import { PartialType } from '@nestjs/mapped-types';
import { CreateExtractionDto } from './create-extraction.dto';

export class UpdateExtractionDto extends PartialType(CreateExtractionDto) {}
