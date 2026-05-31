import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import type { MentionEntityType } from '@kmlog/types'

export type NoteDocument = HydratedDocument<Note>

@Schema({ _id: false })
class Mention {
  @Prop({ required: true, enum: ['character', 'npc', 'location', 'session'] })
  entity_type: MentionEntityType

  @Prop({ type: Types.ObjectId, required: true })
  entity_id: Types.ObjectId
}

@Schema({ timestamps: true })
export class Note {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author_id: Types.ObjectId

  @Prop({ type: String, default: null })
  title: string | null

  @Prop({ required: true, type: String })
  content: string

  @Prop({ type: [Mention], default: [] })
  mentions: Mention[]

  @Prop({ type: Boolean, default: false })
  is_public: boolean
}

export const NoteSchema = SchemaFactory.createForClass(Note)
