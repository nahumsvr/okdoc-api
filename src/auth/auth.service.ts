import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('El correo ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.usersService.create({
      nombreCompleto: registerDto.name,
      correo: registerDto.email,
      contrasena: hashedPassword,
      registrationMethod: 'MANUAL',
      isCompleted: true, // Asumimos que un registro manual está completo
    });

    return {
      message: 'Usuario registrado exitosamente',
      user: {
        name: newUser.nombreCompleto,
        email: newUser.correo,
      },
    };
  }

  async autoRegister(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('El correo ya está en uso');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const newUser = await this.usersService.create({
      nombreCompleto: registerDto.name,
      correo: registerDto.email,
      contrasena: hashedPassword,
      registrationMethod: 'AUTO',
      isCompleted: false, // Perfil no completo en auto-registro
    });

    const payload = {
      sub: newUser._id,
      email: newUser.correo,
      name: newUser.nombreCompleto,
    };

    return {
      correo: newUser.correo,
      jwt: await this.jwtService.signAsync(payload),
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.contrasena,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const payload = {
      sub: user._id,
      email: user.correo,
      name: user.nombreCompleto,
    };

    return {
      correo: user.correo,
      jwt: await this.jwtService.signAsync(payload),
    };
  }

  async getProfile(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const userObj = user.toObject();
    return userObj;
  }
}
