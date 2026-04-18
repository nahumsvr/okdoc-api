import { Module } from '@nestjs/common';
import { SpeechService } from './speech.service';
import { SpeechGateway } from './speech.gateway';
import { SpeechController } from './speech.controller';
import { ExtractionModule } from '../extraction/extraction.module';

@Module({
  imports: [ExtractionModule],
  controllers: [SpeechController],
  providers: [SpeechGateway, SpeechService],
})
export class SpeechModule {}
