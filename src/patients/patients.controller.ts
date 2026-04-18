import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) { }

  @Get()
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.patientsService.findAll(page, limit);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.patientsService.search(q);
  }

  @Post(':id/pre-checkin')
  preCheckin(@Param('id') id: string, @Body() body: any) {
    return this.patientsService.preCheckin(id, body);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.patientsService.findOne(id);
  }

  @Post()
  create(@Body() body: { nombre: string; fechaNacimiento: Date }) {
    return this.patientsService.create(body);
  }
}