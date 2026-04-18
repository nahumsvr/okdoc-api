import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TranscriptionService } from './transcription.service';
import { ExtractionService } from '../extraction/extraction.service';

@Controller('transcription')
export class TranscriptionController {
  constructor(
    private readonly transcriptionService: TranscriptionService,
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

    // 1. Convertir audio a texto usando Google Cloud Speech
    const transcriptionText = await this.transcriptionService.transcribeAudio(file.buffer, encoding);

    if (!transcriptionText || transcriptionText.trim() === '') {
      throw new BadRequestException('No se detectó habla o no se pudo transcribir el audio');
    }

    // 2. Extraer datos estructurados con Gemini
    const structuredData = await this.extractionService.extractFromTranscription(transcriptionText);

    return {
      transcription: transcriptionText,
      data: structuredData,
    };
  }
}
