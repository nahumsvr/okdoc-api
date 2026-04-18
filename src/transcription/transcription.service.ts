import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SpeechClient } from '@google-cloud/speech';

@Injectable()
export class TranscriptionService {
  private client: SpeechClient;

  constructor() {
    // Al instanciar SpeechClient, Google buscará automáticamente 
    // la variable GOOGLE_APPLICATION_CREDENTIALS en tu archivo .env
    this.client = new SpeechClient();
  }

  async transcribeAudio(audioBuffer: Buffer, encoding: string = 'WEBM_OPUS'): Promise<string> {
    try {
      const audio = {
        content: audioBuffer.toString('base64'),
      };

      const config: any = {
        encoding: encoding as any,
        languageCode: 'es-MX',
      };
      
      // WEBM_OPUS requiere que se le especifique la frecuencia (comúnmente 48000Hz en la web)
      if (encoding === 'WEBM_OPUS') {
        config.sampleRateHertz = 48000;
      }

      const request = {
        audio: audio,
        config: config,
      };

      const [response] = await this.client.recognize(request);
      
      const transcription = (response.results || [])
        .map(result => result.alternatives?.[0]?.transcript || '')
        .filter(transcript => transcript.length > 0)
        .join('\\n');

      return transcription;
    } catch (error) {
      throw new InternalServerErrorException('Error transcribiendo audio con GCP: ' + error.message);
    }
  }
}
