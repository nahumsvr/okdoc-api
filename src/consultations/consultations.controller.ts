import { Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';

@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  findAll(@Query('patientId') patientId?: string) {
    return this.consultationsService.findByPatient(patientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.consultationsService.findOne(id);
  }

  @Post()
  create(@Body() body: { patientId: string }) {
    return this.consultationsService.create(body.patientId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.consultationsService.update(id, body);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'pending_review' | 'approved' },
  ) {
    return this.consultationsService.updateStatus(id, body.status);
  }
}