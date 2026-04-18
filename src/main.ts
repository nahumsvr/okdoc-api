import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Habilitar validadores globalmente
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // remueve propiedades que no estén en el DTO
    forbidNonWhitelisted: true, // lanza error si hay propiedades no permitidas
  }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);

  await app.listen(port);
}
bootstrap();
