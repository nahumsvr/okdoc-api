import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpeechService } from './speech.service';
import { SpeechGateway } from './speech.gateway';
import { SpeechController } from './speech.controller';
import { ExtractionModule } from '../extraction/extraction.module';
import { Consultation, ConsultationSchema } from '../consultations/consultation.schema';
import { TranscriptionsModule } from '../transcriptions/transcriptions.module';

@Module({
  imports: [
    ExtractionModule,
    MongooseModule.forFeature([
      { name: Consultation.name, schema: ConsultationSchema }
    ]),
    TranscriptionsModule,
  ],
  controllers: [SpeechController],
  providers: [SpeechGateway, SpeechService],
})
export class SpeechModule {}
