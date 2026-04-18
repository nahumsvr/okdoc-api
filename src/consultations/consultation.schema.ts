import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

export type ConsultationDocument = HydratedDocument<Consultation>;

export type ConsultationStatus = 'draft' | 'pending_review' | 'approved';

@Schema({ timestamps: true })
export class Consultation {
  @Prop({ type: Types.ObjectId, ref: 'Patient', required: true })
  patientId: Types.ObjectId;

  @Prop({ default: 'draft' })
  status: ConsultationStatus;

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

  // JSON completo extraído por IA (transcripción o documento)
  @Prop({ type: MongooseSchema.Types.Mixed })
  extractedData: Record<string, any>;

  // Fuente de la extracción
  @Prop({ enum: ['transcription', 'document'], default: 'transcription' })
  extractionSource: 'transcription' | 'document';

  // Auditoría de campos generados por IA
  @Prop({ type: [String], default: [] })
  camposGeneradosPorIA: string[];

  // Transcripción final ya pulida por IA
  @Prop()
  textoTranscrito: string;
}

export const ConsultationSchema = SchemaFactory.createForClass(Consultation);