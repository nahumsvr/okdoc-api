import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PatientsModule } from './patients/patients.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { TranscriptionsModule } from './transcriptions/transcriptions.module';
import { SpeechModule } from './speech/speech.module';
import { UsersModule } from './users/users.module';
import { TranscriptionModule } from './transcription/transcription.module';
import { ExtractionModule } from './extraction/extraction.module';
import { AuthModule } from './auth/auth.module';
import { ExtractionModule } from './extraction/extraction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Esto hace que el módulo de configuración esté disponible en todo el proyecto
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    PatientsModule,
    ConsultationsModule,
    TranscriptionsModule,
    UsersModule,
    TranscriptionModule,
    ExtractionModule,
    AuthModule,
    ExtractionModule,
    SpeechModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
