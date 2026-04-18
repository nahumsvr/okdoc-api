import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException } from '@nestjs/common';
import { ExtractionService } from './extraction.service';
import { CreateExtractionDto } from './dto/create-extraction.dto';
import { UpdateExtractionDto } from './dto/update-extraction.dto';

@Controller('extraction')
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) { }

  @Post('transcription')
  async extractFromTranscription(@Body('text') text: string) {
    console.log(text);
    if (!text) {
      throw new BadRequestException('El campo text es requerido');
    }
    return this.extractionService.extractFromTranscription(text);
  }

  @Post('document')
  async extractFromDocument(@Body('base64') base64: string, @Body('mimeType') mimeType: string) {
    if (!base64) {
      throw new BadRequestException('El campo base64 es requerido');
    }
    return this.extractionService.extractFromDocument(base64, mimeType);
  }
}
