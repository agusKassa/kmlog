import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import type { LocationType, LocationVisibilityMode } from '@kmlog/types'

export type LocationDocument = HydratedDocument<Location>

@Schema({ _id: false })
class VisibilityConfig {
  @Prop({ required: true, enum: ['public', 'party', 'gm_only', 'custom'], default: 'party' })
  mode: LocationVisibilityMode

  @Prop({ type: [Types.ObjectId], ref: 'User', default: [] })
  allowed_user_ids: Types.ObjectId[]
}

@Schema({ timestamps: true })
export class Location {
  @Prop({ required: true, trim: true })
  name: string

  @Prop({ required: true, enum: ['city', 'dungeon', 'wilderness', 'building', 'region', 'other'] })
  type: LocationType

  @Prop({ type: Types.ObjectId, ref: 'Location', default: null })
  parent_location_id: Types.ObjectId | null

  @Prop({ type: Types.ObjectId, ref: 'Session', default: null })
  discovered_in_session_id: Types.ObjectId | null

  // Public layer — visibility controlled by `visibility` field
  @Prop({ type: String, default: '' })
  public_description: string

  @Prop({ type: [String], default: [] })
  public_image_urls: string[]

  // Private layer — GM only
  @Prop({ type: String, default: '' })
  gm_notes: string

  @Prop({ type: [String], default: [] })
  private_image_urls: string[]

  @Prop({ type: VisibilityConfig, default: () => ({ mode: 'party', allowed_user_ids: [] }) })
  visibility: VisibilityConfig
}

export const LocationSchema = SchemaFactory.createForClass(Location)
