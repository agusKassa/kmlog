import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type PartyStateDocument = HydratedDocument<PartyState>

@Schema({ _id: false })
class StateVersion {
  @Prop({ required: true })
  content: string

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  updated_by: Types.ObjectId

  @Prop({ required: true, default: () => new Date() })
  updated_at: Date

  @Prop({ type: String, default: null })
  version_note: string | null
}

@Schema()
export class PartyState {
  @Prop({ required: true, default: '' })
  current_content: string

  @Prop({ type: [StateVersion], default: [] })
  versions: StateVersion[]

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  last_updated_by: Types.ObjectId | null

  @Prop({ type: Date, default: null })
  updated_at: Date | null
}

export const PartyStateSchema = SchemaFactory.createForClass(PartyState)
