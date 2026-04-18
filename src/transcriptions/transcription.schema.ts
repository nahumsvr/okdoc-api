import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TranscriptionDocument = HydratedDocument<Transcription>;

@Schema({ timestamps: true })
export class Transcription {
  @Prop({ type: Types.ObjectId, ref: 'Consultation', required: true })
  consultationId: Types.ObjectId;

  @Prop()
  audioUrl: string;

  @Prop({ type: String, default: '' })
  textoTranscrito: string;

  @Prop({ default: 'pending' })
  estado: 'pending' | 'processing' | 'done' | 'error';

  // Log de auditoría: qué campos extrajo la IA y cuándo
  @Prop({
    type: [{ field: String, value: String, extractedAt: Date }],
    default: [],
  })
  auditLog: { field: string; value: string; extractedAt: Date }[];
}

export const TranscriptionSchema = SchemaFactory.createForClass(Transcription);