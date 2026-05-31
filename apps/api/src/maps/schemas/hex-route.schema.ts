import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types, type HydratedDocument } from 'mongoose'

export type HexRouteDocument = HydratedDocument<HexRoute>

export type RouteStatus = 'traveled' | 'planned'

@Schema({ timestamps: true })
export class HexRoute {
  @Prop({ type: Types.ObjectId, ref: 'GameMap', required: true, index: true })
  map_id: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Hex', required: true })
  from_hex_id: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Hex', required: true })
  to_hex_id: Types.ObjectId

  @Prop({ type: String, enum: ['traveled', 'planned'], default: 'planned' })
  status: RouteStatus

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  created_by: Types.ObjectId
}

export const HexRouteSchema = SchemaFactory.createForClass(HexRoute)
