import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types, type HydratedDocument } from 'mongoose'
import type { TerrainType, HexFeatureType, LinearFeatureType, HexPoint } from '@kmlog/types'

export type HexDocument = HydratedDocument<Hex>

@Schema({ _id: false })
class PointFeature {
  @Prop({ required: true }) type: HexFeatureType
  @Prop({ required: true }) position: number  // HexPoint 0-6
  @Prop({ default: null }) label: string | null
  @Prop({ type: Types.ObjectId, ref: 'Location', default: null }) location_id: Types.ObjectId | null
}
const PointFeatureSchema = SchemaFactory.createForClass(PointFeature)

@Schema({ _id: false })
class LinearFeature {
  @Prop({ required: true }) type: LinearFeatureType
  @Prop({ type: [Number], required: true }) path: number[]  // HexPoint[]
}
const LinearFeatureSchema = SchemaFactory.createForClass(LinearFeature)

@Schema({ _id: false })
class HexNote {
  @Prop({ type: Types.ObjectId, required: true }) author_id: Types.ObjectId
  @Prop({ required: true }) content: string
  @Prop({ default: false }) is_public: boolean
  @Prop({ default: () => new Date() }) created_at: Date
}
const HexNoteSchema = SchemaFactory.createForClass(HexNote)

@Schema({ timestamps: true })
export class Hex {
  @Prop({ type: Types.ObjectId, ref: 'GameMap', required: true, index: true })
  map_id: Types.ObjectId

  @Prop({ required: true }) q: number
  @Prop({ required: true }) r: number

  @Prop({ required: true })
  terrain: TerrainType

  @Prop({ trim: true, default: null })
  region: string | null

  @Prop({ default: false })
  is_explored: boolean

  @Prop({ type: [PointFeatureSchema], default: [] })
  point_features: PointFeature[]

  @Prop({ type: [LinearFeatureSchema], default: [] })
  linear_features: LinearFeature[]

  @Prop({ default: null })
  party_summary: string | null

  @Prop({ default: null })
  gm_notes: string | null

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Session' }], default: [] })
  session_ids: Types.ObjectId[]

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Location' }], default: [] })
  location_ids: Types.ObjectId[]

  @Prop({ type: [HexNoteSchema], default: [] })
  notes: HexNote[]
}

export const HexSchema = SchemaFactory.createForClass(Hex)

// Unique per map
HexSchema.index({ map_id: 1, q: 1, r: 1 }, { unique: true })
