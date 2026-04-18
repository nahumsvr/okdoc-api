import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transcription, TranscriptionDocument } from './transcription.schema';

@Injectable()
export class TranscriptionsService {
  constructor(
    @InjectModel(Transcription.name) private transcriptionModel: Model<TranscriptionDocument>,
  ) {}

  async findOne(id: string) {
    return this.transcriptionModel.findById(id).exec();
  }

  async create(consultationId: string, audioUrl?: string) {
    const transcription = new this.transcriptionModel({
      consultationId,
      audioUrl,
      estado: 'pending',
    });
    return transcription.save();
  }

  async process(transcriptionId: string, consultationId: string) {
    // Back 2 implementará la lógica de Gemini aquí
    return this.transcriptionModel
      .findByIdAndUpdate(transcriptionId, { estado: 'processing' }, { new: true })
      .exec();
  }

  async saveFinalTranscription(consultationId: string, textoCompleto: string) {
    const newTranscription = new this.transcriptionModel({
      consultationId,
      textoTranscrito: textoCompleto,
      estado: 'done',
    });

    return await newTranscription.save();
  }
}