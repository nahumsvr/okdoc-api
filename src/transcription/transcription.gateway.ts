import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TranscriptionService } from './transcription.service';
import { ExtractionService } from '../extraction/extraction.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class TranscriptionGateway implements OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    // sessionId → array de transcripciones parciales
    private sessions = new Map<string, string[]>();

    constructor(
        private transcriptionService: TranscriptionService,
        private extractionService: ExtractionService,
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
            const transcript = await this.transcriptionService.transcribeAudio(data.audio);

            if (!this.sessions.has(data.sessionId)) {
                this.sessions.set(data.sessionId, []);
            }
            const chunks = this.sessions.get(data.sessionId)!;
            chunks.push(transcript);

            // Devuelve la transcripción parcial al front en tiempo real
            client.emit('transcript_partial', { text: transcript });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }

    // Front manda "finish" cuando termina la consulta
    @SubscribeMessage('finish_session')
    async handleFinish(
        @MessageBody() data: { sessionId: string },
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

            // Devuelve el formulario lleno al front
            client.emit('form_complete', {
                transcription: fullTranscription,
                form: formData
            });
        } catch (error) {
            client.emit('error', { message: error.message });
        }
    }
}