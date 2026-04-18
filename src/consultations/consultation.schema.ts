import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConsultationDocument = HydratedDocument<Consultation>;

export type ConsultationStatus = 'DRAFT' | 'APPROVED';

@Schema({ timestamps: true })
export class Consultation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctorId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ default: 'DRAFT', enum: ['DRAFT', 'APPROVED'] })
  estado: ConsultationStatus;

  // Campos del formulario médico
  @Prop()
  motivoConsulta: string;

  @Prop()
  sintomas: string;

  @Prop()
  diagnostico: string;

  @Prop()
  tratamiento: string;

  @Prop()
  medicamentos: string;

  @Prop()
  observaciones: string;

  @Prop()
  proximaCita: Date;

  @Prop({ default: Date.now })
  fecha: Date;

  // Auditoría de campos generados por IA
  @Prop({ type: [String], default: [] })
  camposGeneradosPorIA: string[];
}

export const ConsultationSchema = SchemaFactory.createForClass(Consultation);