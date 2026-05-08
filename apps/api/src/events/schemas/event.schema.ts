import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import type {
  EncounterDifficulty,
  EventKind,
  EventType,
  LootStatus,
  LootType,
  XpStatus,
} from '@kmlog/types'

// ── Embedded sub-schemas ──────────────────────────────────────────────────

@Schema({ _id: true })
class XpEntry {
  @Prop({ required: true })
  amount: number

  @Prop({ required: true })
  reason: string

  @Prop({ required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: XpStatus

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submitted_by: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  reviewed_by: Types.ObjectId | null

  @Prop({ type: Date, default: null })
  reviewed_at: Date | null
}

@Schema({ _id: true })
class LootEntry {
  @Prop({ required: true })
  name: string

  @Prop({ required: true, enum: ['weapon', 'armor', 'consumable', 'treasure', 'magic', 'other'] })
  type: LootType

  @Prop({ default: 0 })
  value_gp: number

  @Prop({ default: 1 })
  quantity: number

  @Prop({ type: String, default: '' })
  description: string

  @Prop({ required: true, enum: ['unclaimed', 'claimed', 'party'], default: 'unclaimed' })
  status: LootStatus

  @Prop({ type: Types.ObjectId, ref: 'Character', default: null })
  owner_character_id: Types.ObjectId | null
}

// ── Main schema ───────────────────────────────────────────────────────────

export type EventDocument = HydratedDocument<Event>

@Schema({ timestamps: true })
export class Event {
  @Prop({ type: Types.ObjectId, ref: 'Session', required: true })
  session_id: Types.ObjectId

  @Prop({ required: true, enum: ['event', 'encounter'] })
  kind: EventKind

  // kind === 'event' only
  @Prop({ type: String, enum: ['exploration', 'social', 'narrative', 'rest', 'downtime', null], default: null })
  event_type: EventType | null

  // kind === 'encounter' only
  @Prop({ type: String, enum: ['trivial', 'low', 'moderate', 'severe', 'extreme', null], default: null })
  difficulty: EncounterDifficulty | null

  @Prop({ required: true, trim: true })
  title: string

  @Prop({ type: String, default: '' })
  description: string

  @Prop({ default: 0 })
  order: number

  @Prop({ type: [XpEntry], default: [] })
  xp_entries: XpEntry[]

  @Prop({ type: [LootEntry], default: [] })
  loot: LootEntry[]
}

export const EventSchema = SchemaFactory.createForClass(Event)
