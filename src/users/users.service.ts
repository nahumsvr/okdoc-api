import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) { }

  async findByEmail(correo: string) {
    return this.userModel.findOne({ correo }).exec();
  }

  async findById(id: string) {
    const user = await this.userModel.findById(id).select('+contrasena').exec();
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  async create(data: Partial<User>) {
    const user = new this.userModel(data);
    return user.save();
  }
}