import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import type { SessionStatus } from '@kmlog/types'

export type SessionDocument = HydratedDocument<Session>

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true })
  session_number: number

  @Prop({ required: true, trim: true })
  title: string

  @Prop({ type: Date, default: null })
  date_played: Date | null

  @Prop({ type: String, default: '' })
  preamble: string

  @Prop({ type: String, default: '' })
  summary: string

  @Prop({ required: true, enum: ['draft', 'played', 'published'], default: 'draft' })
  status: SessionStatus

  @Prop({ type: [Types.ObjectId], ref: 'Character', default: [] })
  attendees: Types.ObjectId[]
}

export const SessionSchema = SchemaFactory.createForClass(Session)
