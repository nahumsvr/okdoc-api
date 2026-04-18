import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TranscriptionModule } from './transcription/transcription.module';
import { ExtractionModule } from './extraction/extraction.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TranscriptionModule, 
    ExtractionModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
