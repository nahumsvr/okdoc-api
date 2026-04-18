import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TranscriptionModule } from './transcription/transcription.module';
import { ExtractionModule } from './extraction/extraction.module';

@Module({
  imports: [TranscriptionModule, ExtractionModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
