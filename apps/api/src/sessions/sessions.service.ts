import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Session, SessionDocument } from './schemas/session.schema'
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto'

@Injectable()
export class SessionsService {
  constructor(@InjectModel(Session.name) private sessionModel: Model<SessionDocument>) {}

  async create(dto: CreateSessionDto): Promise<SessionDocument> {
    return this.sessionModel.create(dto)
  }

  async findAll(): Promise<SessionDocument[]> {
    return this.sessionModel.find().sort({ session_number: -1 }).exec()
  }

  async findById(id: string): Promise<SessionDocument> {
    const session = await this.sessionModel.findById(id).exec()
    if (!session) throw new NotFoundException('Session not found')
    return session
  }

  async update(id: string, dto: UpdateSessionDto): Promise<SessionDocument> {
    const updated = await this.sessionModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec()
    if (!updated) throw new NotFoundException('Session not found')
    return updated
  }

  async remove(id: string): Promise<void> {
    const result = await this.sessionModel.findByIdAndDelete(id).exec()
    if (!result) throw new NotFoundException('Session not found')
  }
}
