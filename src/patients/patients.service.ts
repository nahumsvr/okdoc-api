import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './patient.schema';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
  ) { }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.patientModel.find().skip(skip).limit(limit).exec(),
      this.patientModel.countDocuments(),
    ]);
    return { data, total, page, limit };
  }

  async search(q: string) {
    return this.patientModel.find({
      $or: [
        { nombre: { $regex: q, $options: 'i' } },
        { apellidos: { $regex: q, $options: 'i' } },
      ],
    }).exec();
  }

  async findOne(id: string) {
    return this.patientModel.findById(id).exec();
  }

  async preCheckin(id: string, data: {
    motivoVisita?: string;
    nivelDolor?: number;
    ubicacionDolor?: string;
    medicamentosActuales?: string;
    alergias?: string;
  }) {
    return this.patientModel.findByIdAndUpdate(
      id,
      { preCheckin: { ...data, completadoEn: new Date() } },
      { new: true },
    ).exec();
  }

  async create(data: { nombre: string; fechaNacimiento: Date }) {
    const patient = new this.patientModel(data);
    return patient.save();
  }
}