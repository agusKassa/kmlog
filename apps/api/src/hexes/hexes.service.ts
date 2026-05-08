import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Hex, HexDocument } from './schemas/hex.schema'
import type { UpdateHexDto, AddHexNoteDto, BulkImportDto } from './dto/hex.dto'

@Injectable()
export class HexesService {
  constructor(@InjectModel(Hex.name) private hexModel: Model<HexDocument>) {}

  async findByMap(mapId: string, isGm: boolean): Promise<HexDocument[]> {
    const projection = isGm ? {} : { gm_notes: 0 }
    return this.hexModel.find({ map_id: new Types.ObjectId(mapId) }, projection).exec()
  }

  async findById(id: string, isGm: boolean): Promise<HexDocument> {
    const projection = isGm ? {} : { gm_notes: 0 }
    const hex = await this.hexModel.findById(id, projection).exec()
    if (!hex) throw new NotFoundException('Hex not found')
    return hex
  }

  async update(id: string, dto: UpdateHexDto): Promise<HexDocument> {
    const updated = await this.hexModel.findByIdAndUpdate(id, dto, { new: true }).exec()
    if (!updated) throw new NotFoundException('Hex not found')
    return updated
  }

  async addNote(
    id: string,
    authorId: string,
    dto: AddHexNoteDto,
  ): Promise<HexDocument> {
    const note = {
      author_id: new Types.ObjectId(authorId),
      content: dto.content,
      is_public: dto.is_public ?? false,
      created_at: new Date(),
    }
    const updated = await this.hexModel
      .findByIdAndUpdate(id, { $push: { notes: note } }, { new: true })
      .exec()
    if (!updated) throw new NotFoundException('Hex not found')
    return updated
  }

  async removeNote(hexId: string, noteId: string, requesterId: string, isGm: boolean): Promise<HexDocument> {
    const hex = await this.hexModel.findById(hexId).exec()
    if (!hex) throw new NotFoundException('Hex not found')

    const note = hex.notes.find((n) => String((n as unknown as { _id: unknown })._id) === noteId)
    if (!note) throw new NotFoundException('Note not found')

    if (!isGm && String(note.author_id) !== requesterId) {
      throw new NotFoundException('Note not found')
    }

    const updated = await this.hexModel
      .findByIdAndUpdate(
        hexId,
        { $pull: { notes: { _id: new Types.ObjectId(noteId) } } },
        { new: true },
      )
      .exec()

    return updated!
  }

  // ── Bulk import ────────────────────────────────────────────────────────────

  async bulkImport(mapId: string, dto: BulkImportDto): Promise<{ inserted: number; updated: number }> {
    const mapObjectId = new Types.ObjectId(mapId)
    let inserted = 0
    let updated = 0

    const ops = dto.hexes.map((h) => ({
      updateOne: {
        filter: { map_id: mapObjectId, q: h.q, r: h.r },
        update: { $set: { map_id: mapObjectId, ...h } },
        upsert: true,
      },
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await this.hexModel.bulkWrite(ops as any[])
    inserted = result.upsertedCount
    updated = result.modifiedCount

    return { inserted, updated }
  }
}
