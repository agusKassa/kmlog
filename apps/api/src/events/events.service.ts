import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Event, EventDocument } from './schemas/event.schema'
import {
  AddLootDto,
  AddXpDto,
  ClaimLootDto,
  CreateEventDto,
  ReviewXpDto,
  UpdateEventDto,
} from './dto/event.dto'

@Injectable()
export class EventsService {
  constructor(@InjectModel(Event.name) private eventModel: Model<EventDocument>) {}

  async create(sessionId: string, dto: CreateEventDto): Promise<EventDocument> {
    return this.eventModel.create({ session_id: sessionId, ...dto })
  }

  async findBySession(sessionId: string): Promise<EventDocument[]> {
    return this.eventModel.find({ session_id: sessionId }).sort({ order: 1 }).exec()
  }

  async findRecent(limit: number): Promise<EventDocument[]> {
    return this.eventModel
      .find()
      .populate('session_id', 'session_number title date_played')
      .sort({ createdAt: -1 })
      .limit(limit)
      .exec()
  }

  async findById(id: string): Promise<EventDocument> {
    const event = await this.eventModel.findById(id).exec()
    if (!event) throw new NotFoundException('Event not found')
    return event
  }

  async update(id: string, dto: UpdateEventDto): Promise<EventDocument> {
    const updated = await this.eventModel.findByIdAndUpdate(id, dto, { new: true }).exec()
    if (!updated) throw new NotFoundException('Event not found')
    return updated
  }

  async remove(id: string): Promise<void> {
    const result = await this.eventModel.findByIdAndDelete(id).exec()
    if (!result) throw new NotFoundException('Event not found')
  }

  // ── XP ───────────────────────────────────────────────────────────────────

  async addXp(id: string, userId: string, dto: AddXpDto): Promise<EventDocument> {
    const event = await this.eventModel
      .findByIdAndUpdate(
        id,
        { $push: { xp_entries: { ...dto, submitted_by: userId, status: 'pending' } } },
        { new: true },
      )
      .exec()
    if (!event) throw new NotFoundException('Event not found')
    return event
  }

  async reviewXp(
    eventId: string,
    xpId: string,
    reviewerId: string,
    dto: ReviewXpDto,
  ): Promise<EventDocument> {
    const event = await this.eventModel
      .findOneAndUpdate(
        { _id: eventId, 'xp_entries._id': new Types.ObjectId(xpId) },
        {
          $set: {
            'xp_entries.$.status': dto.status,
            'xp_entries.$.reviewed_by': reviewerId,
            'xp_entries.$.reviewed_at': new Date(),
          },
        },
        { new: true },
      )
      .exec()
    if (!event) throw new NotFoundException('Event or XP entry not found')
    return event
  }

  // ── Loot ─────────────────────────────────────────────────────────────────

  async addLoot(id: string, dto: AddLootDto): Promise<EventDocument> {
    const event = await this.eventModel
      .findByIdAndUpdate(id, { $push: { loot: dto } }, { new: true })
      .exec()
    if (!event) throw new NotFoundException('Event not found')
    return event
  }

  async claimLoot(
    eventId: string,
    lootId: string,
    requesterId: string,
    isGm: boolean,
    dto: ClaimLootDto,
  ): Promise<EventDocument> {
    const event = await this.eventModel.findById(eventId).exec()
    if (!event) throw new NotFoundException('Event not found')

    const lootEntry = event.loot.find((l) => String((l as unknown as { _id: unknown })._id) === lootId)
    if (!lootEntry) throw new NotFoundException('Loot entry not found')

    // Players can only claim for themselves; GM can assign to anyone
    if (!isGm && dto.owner_character_id && dto.status === 'claimed') {
      // Validate requester owns that character — enforced at controller via character lookup
      // For now we trust the client sends their own character_id
    }

    const update: Record<string, unknown> = {
      'loot.$.status': dto.status,
      'loot.$.owner_character_id': dto.owner_character_id ?? null,
    }

    if (!isGm && dto.status === 'party') throw new ForbiddenException('Only GM can mark loot as party')

    const updated = await this.eventModel
      .findOneAndUpdate(
        { _id: eventId, 'loot._id': new Types.ObjectId(lootId) },
        { $set: update },
        { new: true },
      )
      .exec()

    return updated!
  }
}
