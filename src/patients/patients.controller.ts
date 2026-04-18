import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  BadRequestException
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/user.decorator';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) { }

  @Post()
  @Auth()
  async create(@CurrentUser() user: any, @Body() body: any) {
    console.log('Datos del doctor logueado:', user);
    const doctorId = user?.sub || user?.id || user?._id || user?.userId;

    if (!doctorId) {
      throw new BadRequestException('El token no contiene un ID de usuario válido');
    }

    return this.patientsService.create(doctorId, body);
  }

  @Get()
  @Auth()
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number
  ) {
    const doctorId = user?.sub || user?.id || user?._id || user?.userId;
    return this.patientsService.findAll(doctorId, page, limit);
  }

  @Get('search')
  @Auth()
  search(@CurrentUser() user: any, @Query('q') q: string) {
    const doctorId = user?.sub || user?.id || user?._id || user?.userId;
    return this.patientsService.search(doctorId, q);
  }

  @Get(':id')
  @Auth()
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    const doctorId = user?.sub || user?.id || user?._id || user?.userId;
    return this.patientsService.findOne(id, doctorId);
  }
}