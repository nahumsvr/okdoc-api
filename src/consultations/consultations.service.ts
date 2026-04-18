import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Consultation, ConsultationDocument } from './consultation.schema';

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectModel(Consultation.name) private consultationModel: Model<ConsultationDocument>,
  ) {}

  async findAll() {
    return this.consultationModel
      .find()
      .sort({ createdAt: -1 })
      .exec();
  }

  async findByPatient(patientId?: string) {
    const query = patientId ? { patientId } : {};
    return this.consultationModel
      .find(query)
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string) {
    return this.consultationModel.findById(id).exec();
  }

  async create(patientId: string) {
    const consultation = new this.consultationModel({ patientId, status: 'draft' });
    return consultation.save();
  }

  async update(id: string, fields: Partial<Consultation>) {
    return this.consultationModel
      .findByIdAndUpdate(id, fields, { new: true })
      .exec();
  }

  async updateStatus(id: string, status: 'pending_review' | 'approved') {
    return this.consultationModel
      .findByIdAndUpdate(id, { status }, { new: true })
      .exec();
  }

  async saveExtractionResult(
    patientId: string,
    extractedData: Record<string, any>,
    source: 'transcription' | 'document',
  ) {
    const consultation = new this.consultationModel({
      patientId,
      status: 'draft',
      extractedData,
      extractionSource: source,
    });
    return consultation.save();
  }
}