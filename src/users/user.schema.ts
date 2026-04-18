import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  nombreCompleto: string;

  @Prop({ required: true, unique: true })
  correo: string;

  @Prop({ required: true })
  contrasena: string;

  // Nuevos campos para soportar el flujo de "Registro Automático"
  @Prop({ default: 'MANUAL', enum: ['MANUAL', 'AUTO'] })
  registrationMethod: string;

  @Prop({ default: false })
  isCompleted: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);