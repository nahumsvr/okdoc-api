import { Module } from '@nestjs/common';
import { TranscriptionService } from './transcription.service';
import { TranscriptionGateway } from './transcription.gateway';
import { TranscriptionController } from './transcription.controller';
import { ExtractionModule } from '../extraction/extraction.module';

@Module({
  imports: [ExtractionModule],
  controllers: [TranscriptionController],
  providers: [TranscriptionGateway, TranscriptionService],
})
export class TranscriptionModule {}
