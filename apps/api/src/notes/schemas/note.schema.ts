import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import type { MentionEntityType } from '@kmlog/types'

export type NoteDocument = HydratedDocument<Note>

const ENTITY_TYPES: MentionEntityType[] = [
  'character', 'npc', 'location', 'session', 'hex', 'rule', 'encounter',
]

@Schema({ _id: false })
class Mention {
  @Prop({ required: true, enum: ENTITY_TYPES })
  entity_type: MentionEntityType

  @Prop({ type: Types.ObjectId, required: true })
  entity_id: Types.ObjectId
}

@Schema({ timestamps: true })
export class Note {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author_id: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Character', default: null })
  author_character_id: Types.ObjectId | null

  @Prop({ type: String, default: null })
  title: string | null

  @Prop({ required: true, type: String })
  content: string

  @Prop({ type: [Mention], default: [] })
  mentions: Mention[]

  @Prop({ type: Boolean, default: false })
  is_public: boolean

  @Prop({ type: Boolean, default: false })
  is_pinned: boolean
}

export const NoteSchema = SchemaFactory.createForClass(Note)

NoteSchema.index({ 'mentions.entity_type': 1, 'mentions.entity_id': 1 })
