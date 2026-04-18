import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findByEmail(@Query('correo') correo: string) {
    return this.usersService.findByEmail(correo);
  }

  @Post()
  create(@Body() body: { nombreCompleto: string; correo: string; contrasena: string }) {
    return this.usersService.create(body);
  }
}