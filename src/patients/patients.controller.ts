import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Auth()
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: number, 
    @Query('limit') limit?: number
  ) {
    return this.patientsService.findAll(user.sub, page, limit);
  }

  @Get('search')
  search(@CurrentUser() user: any, @Query('q') q: string) {
    return this.patientsService.search(user.sub, q);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.patientsService.findOne(id, user.sub);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    // Inyectamos el doctorId basado en el token del usuario logueado
    return this.patientsService.create({
      ...body,
      doctorId: user.sub
    });
  }
}