import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'El correo es requerido' })
  @IsEmail({}, { message: 'El correo debe ser válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString()
  password: string;
}
