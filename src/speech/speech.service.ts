import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SpeechClient } from '@google-cloud/speech';

@Injectable()
export class SpeechService {
  private client: SpeechClient;
  private readonly mockMode: boolean;

  constructor() {
    this.mockMode = process.env.MOCK_TRANSCRIPTION === 'true';

    if (!this.mockMode) {
      this.client = new SpeechClient();
    }
  }

  /**
   * Transcribe un chunk de audio.
   * @param audioBase64 - Audio codificado en base64 (viene del frontend vía WebSocket)
   * @param encoding    - Formato de audio (default: WEBM_OPUS)
   */
  async transcribeAudio(audioBase64: string, encoding: string = 'WEBM_OPUS'): Promise<string> {
    // ── MODO MOCK (hackathon sin credenciales GCP) ──────────────────────────
    if (this.mockMode) {
      return '[mock] El paciente tiene una fiebre altísima de 40 grados y mucho dolor de cuerpo.';
    }

    // ── MODO REAL ───────────────────────────────────────────────────────────
    try {
      const config: any = {
        encoding: encoding as any,
        languageCode: 'es-MX',
      };

      // WEBM_OPUS requiere frecuencia de muestreo explícita
      if (encoding === 'WEBM_OPUS') {
        config.sampleRateHertz = 48000;
      }

      const request = {
        audio: { content: audioBase64 }, // ya llega en base64 desde el frontend
        config,
      };

      const [response] = await this.client.recognize(request);

      const transcription = (response.results || [])
        .map(result => result.alternatives?.[0]?.transcript || '')
        .filter(t => t.length > 0)
        .join('\n');

      return transcription;
    } catch (error) {
      throw new InternalServerErrorException('Error transcribiendo audio con GCP: ' + error.message);
    }
  }
}
