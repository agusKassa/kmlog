import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types, type HydratedDocument } from 'mongoose'

export type RuleHighlightDocument = HydratedDocument<RuleHighlight>

@Schema({ timestamps: true })
export class RuleHighlight {
  @Prop({ type: Types.ObjectId, ref: 'Rule', required: true })
  rule_id: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user_id: Types.ObjectId

  // null = all characters of the user; ObjectId = specific character
  @Prop({ type: Types.ObjectId, ref: 'Character', default: null })
  character_id: Types.ObjectId | null

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assigned_by: Types.ObjectId
}

export const RuleHighlightSchema = SchemaFactory.createForClass(RuleHighlight)

// Prevent duplicate highlights for the same (rule, user, scope)
RuleHighlightSchema.index({ rule_id: 1, user_id: 1, character_id: 1 }, { unique: true })
