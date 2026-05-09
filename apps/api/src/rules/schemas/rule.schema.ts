import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Types, type HydratedDocument } from 'mongoose'

export type RuleDocument = HydratedDocument<Rule>

@Schema({ timestamps: true })
export class Rule {
  @Prop({ required: true, trim: true })
  title: string

  @Prop({ type: Types.ObjectId, ref: 'RuleCategory', required: true })
  category_id: Types.ObjectId

  @Prop({ required: true })
  content: string

  @Prop({ type: [String], default: [] })
  tags: string[]

  @Prop({ type: String, trim: true, default: null })
  source: string | null

  @Prop({ default: true })
  is_public: boolean
}

export const RuleSchema = SchemaFactory.createForClass(Rule)

RuleSchema.index({ title: 'text', content: 'text', tags: 'text' })
