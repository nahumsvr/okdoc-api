import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.patientsService.findAll(page, limit);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.patientsService.search(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  create(
    @Body()
    body: {
      nombre: string;
      fechaNacimiento: Date;
      genero: 'h' | 'm' | 'o';
      telefono?: string;
    },
  ) {
    return this.patientsService.create(body);
  }
}
