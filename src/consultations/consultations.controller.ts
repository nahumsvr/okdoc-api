import { Controller, Get, Post, Body, Param, Query, Res, HttpStatus, BadRequestException } from '@nestjs/common';
import { ConsultationsService } from './consultations.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';
import type { Response } from 'express';

@Auth()
@Controller('consultations')
export class ConsultationsController {
  constructor(private readonly consultationsService: ConsultationsService) { }

  // Función privada para extraer el ID del doctor sin importar cómo venga en el token
  private getDoctorId(user: any): string {
    const id = user?.sub || user?.id || user?._id || user?.userId;
    if (!id) {
      throw new BadRequestException('Token inválido: No se encontró el ID del usuario');
    }
    return id;
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.consultationsService.findAllByDoctor(this.getDoctorId(user));
  }

  @Get('prefill')
  getPrefill(@CurrentUser() user: any, @Query('patientId') patientId: string) {
    return this.consultationsService.getPrefillData(patientId, this.getDoctorId(user));
  }

  @Get('patient/:patientId')
  findByPatient(@CurrentUser() user: any, @Param('patientId') patientId: string) {
    return this.consultationsService.findByPatient(patientId, this.getDoctorId(user));
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.consultationsService.findOne(id, this.getDoctorId(user));
  }

  @Post()
  create(@CurrentUser() user: any, @Body() body: any) {
    return this.consultationsService.create(this.getDoctorId(user), body);
  }

  @Get(':id/download')
  async downloadPdf(@CurrentUser() user: any, @Param('id') id: string, @Res() res: Response) {
    const pdfDoc = await this.consultationsService.generatePdf(id, this.getDoctorId(user));

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=receta-${id}.pdf`);
    res.status(HttpStatus.OK);

    pdfDoc.pipe(res);
  }
}