
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { Patient, PatientSchema } from './patient.schema';
import { AuthModule } from '../auth/auth.module';


@Module({
  imports: [MongooseModule.forFeature([{ name: Patient.name, schema: PatientSchema }]), AuthModule],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule { }