import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'El correo es requerido' })
  @IsEmail({}, { message: 'El correo debe ser válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;
}
