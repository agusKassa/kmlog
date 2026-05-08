import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import type { PathbuilderBuild } from '@kmlog/types'

export type CharacterDocument = HydratedDocument<Character>

@Schema({ timestamps: true })
export class Character {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId

  @Prop({ type: Number, default: null })
  pathbuilder_id: number | null

  @Prop({ type: Object, required: true })
  build: PathbuilderBuild

  @Prop({ type: String, default: null })
  portrait_url: string | null

  @Prop({ type: String, default: '' })
  public_bio: string

  @Prop({ type: String, default: '' })
  gm_notes: string

  @Prop({ type: Boolean, default: true })
  is_active: boolean
}

export const CharacterSchema = SchemaFactory.createForClass(Character)
