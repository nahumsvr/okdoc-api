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
}

export const UserSchema = SchemaFactory.createForClass(User);