import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SpeechService } from './speech.service';
import { ExtractionService } from '../extraction/extraction.service';

@Controller('speech')
export class SpeechController {
  constructor(
    private readonly speechService: SpeechService,
    private readonly extractionService: ExtractionService,
  ) {}

  @Post('process')
  @UseInterceptors(FileInterceptor('file'))
  async processAudio(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('El archivo de audio es requerido');
    }

    // Detectar si el archivo es MP3 o WEBM para avisarle a Google Cloud
    let encoding = 'WEBM_OPUS';
    if (file.mimetype.includes('mp3') || file.mimetype.includes('mpeg') || file.originalname.endsWith('.mp3')) {
      encoding = 'MP3';
    }

    // Multer entrega un Buffer → lo convertimos a base64 igual que hace el WebSocket gateway
    const audioBase64 = file.buffer.toString('base64');
    const transcriptionText = await this.speechService.transcribeAudio(audioBase64, encoding);

    if (!transcriptionText || transcriptionText.trim() === '') {
      throw new BadRequestException('No se detectó habla o no se pudo transcribir el audio');
    }

    // Extraer datos estructurados con Gemini
    const structuredData = await this.extractionService.extractFromTranscription(transcriptionText);

    return {
      transcription: transcriptionText,
      data: structuredData,
    };
  }
}
