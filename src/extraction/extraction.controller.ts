import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ExtractionService } from './extraction.service';
import { CreateExtractionDto } from './dto/create-extraction.dto';
import { UpdateExtractionDto } from './dto/update-extraction.dto';

@Controller('extraction')
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Post()
  create(@Body() createExtractionDto: CreateExtractionDto) {
    return this.extractionService.create(createExtractionDto);
  }

  @Get()
  findAll() {
    return this.extractionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.extractionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExtractionDto: UpdateExtractionDto) {
    return this.extractionService.update(+id, updateExtractionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.extractionService.remove(+id);
  }
}
