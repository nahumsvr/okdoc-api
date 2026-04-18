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
import { log } from 'console';

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
  ) {}

  handleDisconnect(client: Socket) {
    this.sessions.delete(client.id);
  }

  private ensureSession(sessionId: string) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
  }

  // Front manda chunk de audio en base64 cada 30s
  @SubscribeMessage('audio_chunk')
  async handleAudioChunk(
    @MessageBody() data: { sessionId: string; audio: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      console.log(data.sessionId);
      const transcript = await this.speechService.transcribeAudio(data.audio);
      console.log(transcript);

      this.ensureSession(data.sessionId);
      this.sessions.get(data.sessionId)!.push(`[Voz]: ${transcript}`);

      // Devuelve la transcripción parcial al front en tiempo real
      console.log({ text: transcript, source: 'voice' });
      client.emit('transcription_update', {
        text: transcript,
        source: 'voice',
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // Front manda una nota de texto manual
  @SubscribeMessage('text_chunk')
  async handleTextChunk(
    @MessageBody() data: { sessionId: string; text: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      this.ensureSession(data.sessionId);
      this.sessions.get(data.sessionId)!.push(`[Nota]: ${data.text}`);

      // Confirmación al front
      client.emit('text_received', { status: 'ok' });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // Front manda "finish" cuando termina la consulta
  @SubscribeMessage('finish_session')
  async handleFinish(
    @MessageBody()
    data: { sessionId: string; doctorId?: string; patientId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const chunks = this.sessions.get(data.sessionId) || [];

      if (chunks.length === 0) {
        client.emit('error', {
          message: 'No hay información acumulada en esta sesión',
        });
        return;
      }

      // Une todos los chunks (voz y texto) en un solo bloque
      const fullContent = chunks.join('\n');

      // Limpia la sesión de memoria
      this.sessions.delete(data.sessionId);

      // Pule la transcripción con Gemini para quitar redundancias o duplicados
      const polishedContent =
        await this.extractionService.polishTranscription(fullContent);
      console.log(polishedContent);

      // Extrae el formulario con Gemini usando el contenido pulido
      const formData =
        await this.extractionService.extractFromTranscription(polishedContent);
      console.log(formData);
      // --- GUARDAR EN BASE DE DATOS ---

      // 1. Crear la consulta (Consultation)
      const consultation = new this.consultationModel({
        patientId: data.patientId,
        doctorId: data.doctorId,
        status: 'draft',
        motivoConsulta: formData?.historia_clinica?.causa_atencion || '',
        sintomas: formData?.historia_clinica?.padecimiento_actual || '',
        diagnostico: formData?.historia_clinica?.diagnostico_cie10 || '',
        tratamiento: formData?.historia_clinica?.tratamiento_cpt || '',
        medicamentos: formData?.medicamentos || '',
        observaciones: formData?.historia_clinica?.antecedentes || '',
        extractedData: formData,
        textoTranscrito: polishedContent,
        camposGeneradosPorIA: Object.keys(formData || {}),
      });
      console.log(consultation);

      const savedConsultation = await consultation.save();
      console.log(savedConsultation);

      // 2. Guardar el contenido final ligado a la consulta
      await this.transcriptionsService.saveFinalTranscription(
        savedConsultation._id.toString(),
        polishedContent,
      );

      // Devuelve el resultado final al front
      client.emit('form_complete', {
        consultationId: savedConsultation._id,
        transcription: polishedContent,
        form: formData,
      });
    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }
}
