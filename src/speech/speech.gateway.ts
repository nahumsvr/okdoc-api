import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SpeechService } from './speech.service';
import { ExtractionService } from '../extraction/extraction.service';
import { TranscriptionsService } from '../transcriptions/transcriptions.service';
import { ConsultationsService } from '../consultations/consultations.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class SpeechGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private sessions = new Map<string, string[]>();

  constructor(
    private speechService: SpeechService,
    private extractionService: ExtractionService,
    private transcriptionsService: TranscriptionsService,
    private consultationsService: ConsultationsService,
  ) { }

  handleDisconnect(client: Socket) {
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
    @MessageBody() data: { sessionId: string; consultationId: string },
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

      const updatedConsultation = await this.consultationsService.updateWithAIResults(
        data.consultationId,
        formData
      );

      await this.transcriptionsService.saveFinalTranscription(
        data.consultationId,
        fullTranscription
      );

      this.emitEntities(client, formData);

      client.emit('form_complete', {
        consultationId: data.consultationId,
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