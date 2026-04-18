import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { Consultation, ConsultationSchema } from './consultation.schema';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [MongooseModule.forFeature([{ name: Consultation.name, schema: ConsultationSchema }]), AuthModule],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule { }