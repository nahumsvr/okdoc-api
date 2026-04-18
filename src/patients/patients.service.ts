import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './patient.schema';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
  ) { }

  async findAll(doctorId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.patientModel.find({ doctorId }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.patientModel.countDocuments({ doctorId }),
    ]);
    return { data, total, page, limit };
  }

  async search(doctorId: string, q: string) {
    return this.patientModel.find({
      doctorId,
      nombreCompleto: { $regex: q, $options: 'i' }
    }).exec();
  }

  async findOne(id: string, doctorId: string) {
    const patient = await this.patientModel.findOne({ _id: id, doctorId }).exec();
    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }
    return patient;
  }

  async create(doctorId: string, data: Partial<Patient>) {
    const patientData = {
      ...data,
      doctorId: doctorId
    };

    const patient = new this.patientModel(patientData);
    return patient.save();
  }
}