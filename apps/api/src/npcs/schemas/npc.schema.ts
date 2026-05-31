import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import type { NpcRole } from '@kmlog/types'

export type NpcDocument = HydratedDocument<Npc>

@Schema({ timestamps: true })
export class Npc {
  @Prop({ required: true, trim: true })
  name: string

  @Prop({ required: true, enum: ['ally', 'enemy', 'neutral', 'unknown'], default: 'unknown' })
  role: NpcRole

  @Prop({ type: Boolean, default: true })
  is_alive: boolean

  @Prop({ type: String, default: null })
  portrait_url: string | null

  // Visible to everyone
  @Prop({ type: String, default: '' })
  public_description: string

  @Prop({ type: [String], default: [] })
  public_image_urls: string[]

  // GM only
  @Prop({ type: String, default: '' })
  gm_notes: string

  @Prop({ type: String, default: '' })
  true_motives: string

  @Prop({ type: Object, default: null })
  stats: Record<string, unknown> | null

  @Prop({ type: Types.ObjectId, ref: 'Location', default: null })
  location_id: Types.ObjectId | null

  @Prop({ type: Types.ObjectId, ref: 'Session', default: null })
  first_seen_session_id: Types.ObjectId | null

  @Prop({ type: Boolean, default: false })
  is_with_party: boolean

  @Prop({ type: Types.ObjectId, ref: 'Hex', default: null })
  last_seen_hex_id: Types.ObjectId | null

  @Prop({ type: String, default: '' })
  last_seen_description: string

  @Prop({ type: Date, default: null })
  last_seen_at: Date | null
}

export const NpcSchema = SchemaFactory.createForClass(Npc)
