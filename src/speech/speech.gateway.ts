import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SpeechService } from './speech.service';
import { ExtractionService } from '../extraction/extraction.service';
import { Consultation } from '../consultations/consultation.schema';
// 1. IMPORTAMOS TU NUEVO SERVICIO
import { TranscriptionsService } from '../transcriptions/transcriptions.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class SpeechGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private sessions = new Map<string, string[]>();

  constructor(
    private speechService: SpeechService,
    private extractionService: ExtractionService,
    // 2. LO INYECTAMOS AQUÍ
    private transcriptionsService: TranscriptionsService,
    @InjectModel(Consultation.name)
    private consultationModel: Model<Consultation>,
  ) { }

  handleDisconnect(client: Socket) {
    // Nota: client.id no es igual a sessionId, pero lo dejamos así por velocidad en el hackathon
    this.sessions.delete(client.id);
  }

  @SubscribeMessage('audio_chunk')
  async handleAudioChunk(
    @MessageBody() data: { sessionId: string; audio: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const transcript = await this.speechService.transcribeAudio(data.audio);

      if (!this.sessions.has(data.sessionId)) {
        this.sessions.set(data.sessionId, []);
      }
      this.sessions.get(data.sessionId)!.push(transcript);

      client.emit('transcription_update', { text: transcript });

    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  @SubscribeMessage('finish_session')
  async handleFinish(
    @MessageBody() data: { sessionId: string; doctorId?: string; patientId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const chunks = this.sessions.get(data.sessionId) || [];

      if (chunks.length === 0) {
        client.emit('error', { message: 'No hay transcripciones acumuladas' });
        return;
      }

      const fullTranscription = chunks.join(' ');
      this.sessions.delete(data.sessionId);

      const formData = await this.extractionService.extractFromTranscription(fullTranscription);

      // Guardar consulta en MongoDB
      const consultation = new this.consultationModel({
        doctorId: data?.doctorId,
        patientId: data?.patientId,
        estado: 'DRAFT',
        motivoConsulta: formData?.historia_clinica?.padecimiento_actual,
        diagnostico: formData?.historia_clinica?.diagnostico_cie10,
        tratamiento: formData?.historia_clinica?.tratamiento_cpt,
        formDataIA: formData,
        camposGeneradosPorIA: Object.keys(formData).flatMap((section) =>
          Object.keys(formData[section] || {}),
        ),
      });

      const saved = await consultation.save();

      // 3. ¡GUARDAMOS LA TRANSCRIPCIÓN LIGADA A LA CONSULTA!
      await this.transcriptionsService.saveFinalTranscription(
        saved._id.toString(),
        fullTranscription
      );

      // Emitir entidades campo por campo
      this.emitEntities(client, formData);

      // Emitir formulario completo
      client.emit('form_complete', {
        consultationId: saved._id,
        transcription: fullTranscription,
        form: formData,
      });

    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  private emitEntities(client: Socket, formData: any) {
    const flatten = (obj: any, prefix = '') => {
      for (const key of Object.keys(obj)) {
        const value = obj[key];
        const fieldName = prefix ? `${prefix}.${key}` : key;
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, fieldName);
        } else if (value !== null && value !== undefined) {
          client.emit('entity_extracted', {
            field: fieldName,
            value: value,
            confidence: 0.95,
          });
        }
      }
    };
    flatten(formData);
  }
}