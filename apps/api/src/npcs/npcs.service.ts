import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Npc, NpcDocument } from './schemas/npc.schema'
import { CreateNpcDto, UpdateNpcPrivateDto, UpdateNpcPublicDto } from './dto/npc.dto'

const GM_ONLY_FIELDS = ['gm_notes', 'true_motives', 'stats'] as const
const PUBLIC_PROJECTION = Object.fromEntries(GM_ONLY_FIELDS.map((f) => [f, 0]))

@Injectable()
export class NpcsService {
  constructor(@InjectModel(Npc.name) private npcModel: Model<NpcDocument>) {}

  async create(dto: CreateNpcDto): Promise<NpcDocument> {
    return this.npcModel.create(dto)
  }

  async findAll(isGm: boolean): Promise<NpcDocument[]> {
    const projection = isGm ? {} : PUBLIC_PROJECTION
    return this.npcModel.find({}, projection).exec()
  }

  async findById(id: string, isGm: boolean): Promise<NpcDocument> {
    const projection = isGm ? {} : PUBLIC_PROJECTION
    const npc = await this.npcModel.findById(id, projection).exec()
    if (!npc) throw new NotFoundException('NPC not found')
    return npc
  }

  async updatePublic(id: string, dto: UpdateNpcPublicDto): Promise<NpcDocument> {
    const updated = await this.npcModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec()
    if (!updated) throw new NotFoundException('NPC not found')
    return updated
  }

  async updatePrivate(id: string, dto: UpdateNpcPrivateDto): Promise<NpcDocument> {
    const updated = await this.npcModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec()
    if (!updated) throw new NotFoundException('NPC not found')
    return updated
  }

  async remove(id: string): Promise<void> {
    const result = await this.npcModel.findByIdAndDelete(id).exec()
    if (!result) throw new NotFoundException('NPC not found')
  }
}
