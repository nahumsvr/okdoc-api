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
import { TranscriptionsService } from '../transcriptions/transcriptions.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class SpeechGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // sessionId → array de transcripciones parciales
  private sessions = new Map<string, string[]>();

  constructor(
    private speechService: SpeechService,
    private extractionService: ExtractionService,
    private transcriptionsService: TranscriptionsService,
    @InjectModel(Consultation.name)
    private consultationModel: Model<Consultation>,
  ) { }

  handleDisconnect(client: Socket) {
    this.sessions.delete(client.id);
  }

  // Front manda chunk de audio en base64
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

      // Devuelve la transcripción parcial al front en tiempo real
      client.emit('transcription_update', { text: transcript });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // Front manda "finish" cuando termina la consulta
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

      // Une todos los chunks en un solo texto
      const fullTranscription = chunks.join(' ');

      // Limpia la sesión de memoria
      this.sessions.delete(data.sessionId);

      // Extrae el formulario con Gemini
      const formData = await this.extractionService.extractFromTranscription(fullTranscription);

      // --- GUARDAR EN BASE DE DATOS ---
      
      // 1. Crear la consulta (Consultation)
      const consultation = new this.consultationModel({
        patientId: data.patientId,
        doctorId: data.doctorId, // Asegúrate de que el front lo envíe
        status: 'draft',
        motivoConsulta: formData?.motivoConsulta || '',
        sintomas: formData?.sintomas || '',
        diagnostico: formData?.diagnostico || '',
        tratamiento: formData?.tratamiento || '',
        medicamentos: formData?.medicamentos || '',
        observaciones: formData?.observaciones || '',
        camposGeneradosPorIA: Object.keys(formData || {}),
      });

      const savedConsultation = await consultation.save();

      // 2. Guardar el texto de la transcripción ligado a la consulta
      await this.transcriptionsService.saveFinalTranscription(
        savedConsultation._id.toString(),
        fullTranscription
      );

      // Devuelve el formulario lleno al front
      client.emit('form_complete', {
        consultationId: savedConsultation._id,
        transcription: fullTranscription,
        form: formData,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
