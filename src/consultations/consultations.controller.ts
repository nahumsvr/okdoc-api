import { Controller, Get, Post, Body, Param, Query, Res, HttpStatus } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import type { Response } from 'express';

@Auth()
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) {}

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.consultationsService.findAllByDoctor(user.sub);
  }

  @Get('prefill')
  getPrefill(@CurrentUser() user: any, @Query('patientId') patientId: string) {
    return this.consultationsService.getPrefillData(patientId, user.sub);
  }

  @Get('patient/:patientId')
  findByPatient(@CurrentUser() user: any, @Param('patientId') patientId: string) {
    return this.consultationsService.findByPatient(patientId, user.sub);
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.consultationsService.findOne(id, user.sub);
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.consultationsService.create({
      ...body,
      doctorId: user.sub,
    });
  }

  @Get(':id/download')
  async downloadPdf(@CurrentUser() user: any, @Param('id') id: string, @Res() res: Response) {
    const pdfDoc = await this.consultationsService.generatePdf(id, user.sub);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receta-${id}.pdf`);
    res.status(HttpStatus.OK);
    
    pdfDoc.pipe(res);
  }
}