import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ required: true })
  nombreCompleto: string;

  @Prop()
  correo: string;

  @Prop()
  telefono: string;

  @Prop()
  fechaNacimiento: Date;

  @Prop()
  genero: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  doctorId: Types.ObjectId;

  @Prop({ default: Date.now })
  fechaRegistro: Date;

  // Campos médicos adicionales (opcionales)
  @Prop({ unique: true, sparse: true })
  curp: string;

  @Prop()
  direccion: string;

  @Prop()
  tipoSangre: string;

  @Prop({ type: [String], default: [] })
  alergias: string[];

  @Prop({ type: [String], default: [] })
  enfermedadesCronicas: string[];
}

export const PatientSchema = SchemaFactory.createForClass(Patient);