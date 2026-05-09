import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'
import type { UserRole } from '@kmlog/types'

export type UserDocument = HydratedDocument<User>

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string

  @Prop({ required: true, trim: true })
  username: string

  @Prop({ required: true })
  password_hash: string

  @Prop({ required: true, enum: ['gm', 'player'], default: 'player' })
  role: UserRole

  @Prop({ type: Types.ObjectId, ref: 'Character', default: null })
  character_id: Types.ObjectId | null

  @Prop({ type: String, default: null })
  refresh_token_hash: string | null
}

export const UserSchema = SchemaFactory.createForClass(User)
