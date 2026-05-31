import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { RuleHighlight, RuleHighlightDocument } from './schemas/rule-highlight.schema'
import type { CreateRuleHighlightDto } from './dto/rule-highlight.dto'

@Injectable()
export class RuleHighlightsService {
  constructor(
    @InjectModel(RuleHighlight.name)
    private highlightModel: Model<RuleHighlightDocument>,
  ) {}

  async create(
    actorUserId: string,
    dto: CreateRuleHighlightDto,
    isGm: boolean,
  ): Promise<RuleHighlightDocument> {
    const userId = isGm && dto.target_user_id ? dto.target_user_id : actorUserId

    const doc = {
      rule_id: new Types.ObjectId(dto.rule_id),
      user_id: new Types.ObjectId(userId),
      character_id: dto.character_id ? new Types.ObjectId(dto.character_id) : null,
      assigned_by: new Types.ObjectId(actorUserId),
    }

    try {
      return await this.highlightModel.create(doc)
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 11000) {
        throw new ConflictException('Esta regla ya está destacada con ese alcance.')
      }
      throw err
    }
  }

  async remove(highlightId: string, actorUserId: string, isGm: boolean): Promise<void> {
    const highlight = await this.highlightModel.findById(highlightId).exec()
    if (!highlight) throw new NotFoundException('Highlight not found')

    const isOwner = String(highlight.user_id) === actorUserId
    if (!isOwner && !isGm) throw new ForbiddenException()

    await this.highlightModel.findByIdAndDelete(highlightId).exec()
  }

  // Remove all highlights for a given rule+user (convenience for "unstar all")
  async removeByRuleAndUser(ruleId: string, userId: string, isGm: boolean, targetUserId?: string): Promise<void> {
    const resolvedUserId = isGm && targetUserId ? targetUserId : userId
    await this.highlightModel.deleteMany({
      rule_id: new Types.ObjectId(ruleId),
      user_id: new Types.ObjectId(resolvedUserId),
    }).exec()
  }

  // Get the current user's highlights, optionally filtered by rule
  async findByUser(userId: string, ruleId?: string): Promise<RuleHighlightDocument[]> {
    const filter: Record<string, unknown> = { user_id: new Types.ObjectId(userId) }
    if (ruleId) filter['rule_id'] = new Types.ObjectId(ruleId)
    return this.highlightModel.find(filter).sort({ createdAt: -1 }).exec()
  }

  // GM: see all highlights for a rule (who has highlighted it)
  async findByRule(ruleId: string): Promise<RuleHighlightDocument[]> {
    return this.highlightModel
      .find({ rule_id: new Types.ObjectId(ruleId) })
      .populate('user_id', 'username email')
      .populate('character_id', 'build.name')
      .sort({ createdAt: -1 })
      .exec()
  }

  // Get highlights relevant to a character for the character sheet (#18).
  // Returns: highlights specific to this character + global highlights (character_id: null) of the owner.
  async findByCharacter(characterId: string, ownerUserId: string): Promise<RuleHighlightDocument[]> {
    return this.highlightModel
      .find({
        user_id: new Types.ObjectId(ownerUserId),
        $or: [
          { character_id: new Types.ObjectId(characterId) },
          { character_id: null },
        ],
      })
      .populate('rule_id', 'title short_description category_id nethys_url is_draft')
      .sort({ createdAt: -1 })
      .exec()
  }
}
