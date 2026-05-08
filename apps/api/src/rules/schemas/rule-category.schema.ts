import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import type { HydratedDocument } from 'mongoose'
import { DEFAULT_RULE_CATEGORIES } from '@kmlog/types'

export type RuleCategoryDocument = HydratedDocument<RuleCategory>

@Schema({ timestamps: true })
export class RuleCategory {
  @Prop({ required: true, unique: true, trim: true })
  name: string

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string

  @Prop({ default: false })
  is_default: boolean
}

export const RuleCategorySchema = SchemaFactory.createForClass(RuleCategory)

export const DEFAULT_CATEGORY_SEEDS = DEFAULT_RULE_CATEGORIES.map((slug) => ({
  slug,
  name: slug.charAt(0).toUpperCase() + slug.slice(1).replace('-', ' '),
  is_default: true,
}))
