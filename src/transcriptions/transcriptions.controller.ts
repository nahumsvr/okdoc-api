import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TranscriptionsService } from './transcriptions.service';

@Controller('transcriptions')
export class TranscriptionsController {
  constructor(private readonly transcriptionsService: TranscriptionsService) {}

  @Post('upload')
  upload(@Body() body: { consultationId: string; audioUrl?: string }) {
    return this.transcriptionsService.create(body.consultationId, body.audioUrl);
  }

  @Post('process')
  process(@Body() body: { transcriptionId: string; consultationId: string }) {
    return this.transcriptionsService.process(body.transcriptionId, body.consultationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transcriptionsService.findOne(id);
  }
}