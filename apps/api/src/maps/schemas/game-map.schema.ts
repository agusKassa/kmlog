import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types, type HydratedDocument } from 'mongoose'

export type GameMapDocument = HydratedDocument<GameMap>

@Schema({ _id: false })
class HexConfig {
  @Prop({ required: true }) hex_size_px: number
  @Prop({ required: true }) cols: number
  @Prop({ required: true }) rows: number
  @Prop({ required: true }) hex_size_miles: number
  @Prop({ required: true }) travel_hours_per_day: number
  @Prop({ required: true }) party_speed_ft: number
}
const HexConfigSchema = SchemaFactory.createForClass(HexConfig)

@Schema({ timestamps: true })
export class GameMap {
  @Prop({ required: true, trim: true })
  name: string

  @Prop({ type: HexConfigSchema, required: true })
  hex_config: HexConfig

  @Prop({ type: Types.ObjectId, ref: 'Hex', default: null })
  current_party_hex_id: Types.ObjectId | null

  @Prop({ default: null })
  reference_image_url: string | null

  @Prop({ default: false })
  is_public: boolean
}

export const GameMapSchema = SchemaFactory.createForClass(GameMap)
