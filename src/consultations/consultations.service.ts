import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Consultation, ConsultationDocument } from './consultation.schema';
import PDFDocument = require('pdfkit');

@Injectable()
export class ConsultationsService {
  constructor(
    @InjectModel(Consultation.name) private consultationModel: Model<ConsultationDocument>,
  ) { }

  async findAllByDoctor(doctorId: string) {
    return this.consultationModel
      .find({ doctorId })
      .sort({ createdAt: -1 })
      .populate('patientId', 'nombreCompleto') // Para mostrar el nombre del paciente
      .exec();
  }

  async findByPatient(patientId: string, doctorId: string) {
    return this.consultationModel
      .find({ patientId, doctorId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(id: string, doctorId: string) {
    const consultation = await this.consultationModel.findOne({ _id: id, doctorId }).populate('patientId').exec();
    if (!consultation) {
      throw new NotFoundException('Consulta no encontrada');
    }
    return consultation;
  }

  async create(data: Partial<Consultation>) {
    // Fuerzo a que toda nueva consulta comience aprobada si viene llena, o DRAFT si no
    const consultation = new this.consultationModel({
      ...data,
      estado: data.estado || 'APPROVED'
    });
    return consultation.save();
  }

  async getPrefillData(patientId: string, doctorId: string) {
    const lastConsultation = await this.consultationModel
      .findOne({ patientId, doctorId })
      .sort({ createdAt: -1 })
      .exec();

    // Retorna una base para el nuevo formulario, copiando posibles diagnósticos crónicos o historial útil
    return {
      motivoConsulta: '',
      sintomas: '',
      diagnostico: lastConsultation?.diagnostico || '',
      tratamiento: '',
      medicamentos: lastConsultation?.medicamentos || '',
      observaciones: ''
    };
  }

  async generatePdf(id: string, doctorId: string): Promise<PDFKit.PDFDocument> {
    const consultation = await this.findOne(id, doctorId);
    const patient: any = consultation.patientId;

    const doc = new PDFDocument({ margin: 50 });

    doc.fontSize(20).text('Receta Médica', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Fecha: ${new Date(consultation.fecha).toLocaleDateString()}`);
    doc.text(`Paciente: ${patient?.nombreCompleto || 'Desconocido'}`);
    doc.moveDown();

    doc.fontSize(14).text('Diagnóstico:', { underline: true });
    doc.fontSize(12).text(consultation.diagnostico || 'N/A');
    doc.moveDown();

    doc.fontSize(14).text('Tratamiento:', { underline: true });
    doc.fontSize(12).text(consultation.tratamiento || 'N/A');
    doc.moveDown();

    doc.fontSize(14).text('Medicamentos:', { underline: true });
    doc.fontSize(12).text(consultation.medicamentos || 'N/A');
    doc.moveDown();

    doc.fontSize(14).text('Observaciones:', { underline: true });
    doc.fontSize(12).text(consultation.observaciones || 'N/A');

    if (consultation.formDataIA) {
      doc.addPage();
      doc.fontSize(16).text('Datos extraídos por IA', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(JSON.stringify(consultation.formDataIA, null, 2));
    }

    doc.end();

    return doc;
  }
}