import { Injectable } from '@nestjs/common';
import { CreateExtractionDto } from './dto/create-extraction.dto';
import { UpdateExtractionDto } from './dto/update-extraction.dto';

@Injectable()
export class ExtractionService {
  create(createExtractionDto: CreateExtractionDto) {
    return 'This action adds a new extraction';
  }

  findAll() {
    return `This action returns all extraction`;
  }

  findOne(id: number) {
    return `This action returns a #${id} extraction`;
  }

  update(id: number, updateExtractionDto: UpdateExtractionDto) {
    return `This action updates a #${id} extraction`;
  }

  remove(id: number) {
    return `This action removes a #${id} extraction`;
  }
}
