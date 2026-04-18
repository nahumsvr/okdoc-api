import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PatientDocument = HydratedDocument<Patient>;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ required: true })
  nombre: string;

  @Prop({ required: true })
  fechaNacimiento: Date;

  @Prop()
  apellidos: string;

  @Prop({ unique: true, sparse: true })
  curp: string;

  @Prop()
  sexo: string;

  @Prop()
  telefono: string;

  @Prop()
  direccion: string;

  @Prop()
  tipoSangre: string;

  @Prop({ type: [String], default: [] })
  alergias: string[];

  @Prop({ type: [String], default: [] })
  enfermedadesCronicas: string[];

  @Prop({
    type: {
      motivoVisita: String,
      nivelDolor: Number,
      ubicacionDolor: String,
      medicamentosActuales: String,
      alergias: String,
      completadoEn: Date,
    },
    default: null,
  })
  preCheckin: {
    motivoVisita?: string;
    nivelDolor?: number;
    ubicacionDolor?: string;
    medicamentosActuales?: string;
    alergias?: string;
    completadoEn?: Date;
  } | null;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);