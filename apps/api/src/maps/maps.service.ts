import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { GameMap, GameMapDocument } from './schemas/game-map.schema'
import type { CreateGameMapDto, UpdateGameMapDto } from './dto/game-map.dto'

@Injectable()
export class MapsService {
  constructor(@InjectModel(GameMap.name) private mapModel: Model<GameMapDocument>) {}

  async findAll(isGm: boolean): Promise<GameMapDocument[]> {
    const filter = isGm ? {} : { is_public: true }
    return this.mapModel.find(filter).exec()
  }

  async findById(id: string, isGm: boolean): Promise<GameMapDocument> {
    const map = await this.mapModel.findById(id).exec()
    if (!map) throw new NotFoundException('Map not found')
    if (!isGm && !map.is_public) throw new NotFoundException('Map not found')
    return map
  }

  async create(dto: CreateGameMapDto): Promise<GameMapDocument> {
    return this.mapModel.create(dto)
  }

  async update(id: string, dto: UpdateGameMapDto): Promise<GameMapDocument> {
    const payload: Record<string, unknown> = { ...dto }
    if (dto.current_party_hex_id !== undefined) {
      payload['current_party_hex_id'] = dto.current_party_hex_id
        ? new Types.ObjectId(dto.current_party_hex_id)
        : null
    }
    const updated = await this.mapModel.findByIdAndUpdate(id, payload, { new: true }).exec()
    if (!updated) throw new NotFoundException('Map not found')
    return updated
  }

  async remove(id: string): Promise<void> {
    const result = await this.mapModel.findByIdAndDelete(id).exec()
    if (!result) throw new NotFoundException('Map not found')
  }
}
