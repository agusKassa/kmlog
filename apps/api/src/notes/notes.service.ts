import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Note, NoteDocument } from './schemas/note.schema'
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto'

@Injectable()
export class NotesService {
  constructor(@InjectModel(Note.name) private noteModel: Model<NoteDocument>) {}

  async create(authorId: string, dto: CreateNoteDto): Promise<NoteDocument> {
    const mentions = dto.mentions?.map((m) => ({
      entity_type: m.entity_type,
      entity_id: new Types.ObjectId(m.entity_id),
    }))
    return this.noteModel.create({ author_id: authorId, ...dto, mentions })
  }

  // GM sees all notes; players see only their own
  async findAll(requesterId: string, isGm: boolean): Promise<NoteDocument[]> {
    const filter = isGm ? {} : { author_id: requesterId }
    return this.noteModel.find(filter).sort({ updatedAt: -1 }).exec()
  }

  async findById(id: string, requesterId: string, isGm: boolean): Promise<NoteDocument> {
    const note = await this.noteModel.findById(id).exec()
    if (!note) throw new NotFoundException('Note not found')
    if (!isGm && String(note.author_id) !== requesterId) throw new ForbiddenException()
    return note
  }

  async update(id: string, requesterId: string, isGm: boolean, dto: UpdateNoteDto): Promise<NoteDocument> {
    const note = await this.noteModel.findById(id).exec()
    if (!note) throw new NotFoundException('Note not found')
    if (!isGm && String(note.author_id) !== requesterId) throw new ForbiddenException()

    const updated = await this.noteModel.findByIdAndUpdate(id, dto, { new: true }).exec()
    return updated!
  }

  async findByCharacter(characterId: string, requesterId: string | null, isGm: boolean): Promise<NoteDocument[]> {
    return this.findByEntity('character', characterId, requesterId, isGm)
  }

  async findByEntity(
    entityType: string,
    entityId: string,
    requesterId: string | null,
    isGm: boolean,
  ): Promise<NoteDocument[]> {
    const base: Record<string, unknown> = {
      'mentions.entity_type': entityType,
      'mentions.entity_id': new Types.ObjectId(entityId),
    }

    if (isGm) {
      return this.noteModel
        .find(base)
        .sort({ is_pinned: -1, updatedAt: -1 })
        .limit(50)
        .exec()
    }

    const visibilityFilter = requesterId
      ? { $or: [{ is_public: true }, { author_id: new Types.ObjectId(requesterId) }] }
      : { is_public: true }

    return this.noteModel
      .find({ ...base, ...visibilityFilter })
      .sort({ is_pinned: -1, updatedAt: -1 })
      .limit(50)
      .exec()
  }

  async remove(id: string, requesterId: string, isGm: boolean): Promise<void> {
    const note = await this.noteModel.findById(id).exec()
    if (!note) throw new NotFoundException('Note not found')
    if (!isGm && String(note.author_id) !== requesterId) throw new ForbiddenException()
    await this.noteModel.findByIdAndDelete(id).exec()
  }
}
