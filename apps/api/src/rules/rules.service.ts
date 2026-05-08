import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { Rule, RuleDocument } from './schemas/rule.schema'
import { RuleCategory, RuleCategoryDocument, DEFAULT_CATEGORY_SEEDS } from './schemas/rule-category.schema'
import type { CreateRuleDto, UpdateRuleDto, CreateRuleCategoryDto } from './dto/rule.dto'

@Injectable()
export class RulesService implements OnModuleInit {
  constructor(
    @InjectModel(Rule.name) private ruleModel: Model<RuleDocument>,
    @InjectModel(RuleCategory.name) private categoryModel: Model<RuleCategoryDocument>,
  ) {}

  async onModuleInit(): Promise<void> {
    for (const seed of DEFAULT_CATEGORY_SEEDS) {
      await this.categoryModel.updateOne({ slug: seed.slug }, { $setOnInsert: seed }, { upsert: true })
    }
  }

  // ── Categories ──────────────────────────────────────────────────────────────

  async findAllCategories(): Promise<RuleCategoryDocument[]> {
    return this.categoryModel.find().sort({ name: 1 }).exec()
  }

  async createCategory(dto: CreateRuleCategoryDto): Promise<RuleCategoryDocument> {
    return this.categoryModel.create(dto)
  }

  async removeCategory(id: string): Promise<void> {
    const cat = await this.categoryModel.findById(id).exec()
    if (!cat) throw new NotFoundException('Category not found')
    if (cat.is_default) throw new NotFoundException('Cannot delete a default category')
    await this.categoryModel.findByIdAndDelete(id).exec()
  }

  // ── Rules ───────────────────────────────────────────────────────────────────

  async search(q: string | undefined, categoryId: string | undefined, isGm: boolean): Promise<RuleDocument[]> {
    const filter: Record<string, unknown> = {}
    if (!isGm) filter['is_public'] = true
    if (categoryId) filter['category_id'] = new Types.ObjectId(categoryId)
    if (q) filter['$text'] = { $search: q }

    const projection = q ? { score: { $meta: 'textScore' } } : {}
    const sort = q ? { score: { $meta: 'textScore' } } : { title: 1 }

    return this.ruleModel.find(filter, projection).sort(sort as Parameters<typeof this.ruleModel.find>[2]).exec()
  }

  async findById(id: string, isGm: boolean): Promise<RuleDocument> {
    const rule = await this.ruleModel.findById(id).exec()
    if (!rule) throw new NotFoundException('Rule not found')
    if (!isGm && !rule.is_public) throw new NotFoundException('Rule not found')
    return rule
  }

  async create(dto: CreateRuleDto): Promise<RuleDocument> {
    return this.ruleModel.create({
      ...dto,
      category_id: new Types.ObjectId(dto.category_id),
    })
  }

  async update(id: string, dto: UpdateRuleDto): Promise<RuleDocument> {
    const payload: Record<string, unknown> = { ...dto }
    if (dto.category_id) payload['category_id'] = new Types.ObjectId(dto.category_id)
    const updated = await this.ruleModel.findByIdAndUpdate(id, payload, { new: true }).exec()
    if (!updated) throw new NotFoundException('Rule not found')
    return updated
  }

  async remove(id: string): Promise<void> {
    const result = await this.ruleModel.findByIdAndDelete(id).exec()
    if (!result) throw new NotFoundException('Rule not found')
  }
}
