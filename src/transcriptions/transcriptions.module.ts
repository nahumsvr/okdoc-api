import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TranscriptionsController } from './transcriptions.controller';
import { TranscriptionsService } from './transcriptions.service';
import { Transcription, TranscriptionSchema } from './transcription.schema';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [MongooseModule.forFeature([{ name: Transcription.name, schema: TranscriptionSchema }]), AuthModule],
  controllers: [TranscriptionsController],
  providers: [TranscriptionsService],
  exports: [TranscriptionsService],
})
export class TranscriptionsModule { }