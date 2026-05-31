import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { RuleHighlightsService } from './rule-highlights.service'
import { CreateRuleHighlightDto } from './dto/rule-highlight.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { UserDocument } from '../users/schemas/user.schema'

@Controller('rule-highlights')
@UseGuards(JwtAuthGuard)
export class RuleHighlightsController {
  constructor(private readonly service: RuleHighlightsService) {}

  @Post()
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateRuleHighlightDto) {
    return this.service.create(String(user._id), dto, user.role === 'gm')
  }

  @Delete('by-rule/:ruleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeByRule(
    @Param('ruleId') ruleId: string,
    @CurrentUser() user: UserDocument,
    @Query('target_user_id') targetUserId?: string,
  ) {
    return this.service.removeByRuleAndUser(
      ruleId,
      String(user._id),
      user.role === 'gm',
      targetUserId,
    )
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.service.remove(id, String(user._id), user.role === 'gm')
  }

  @Get('my')
  findMine(@CurrentUser() user: UserDocument, @Query('rule_id') ruleId?: string) {
    return this.service.findByUser(String(user._id), ruleId)
  }

  @Get('rule/:ruleId')
  @UseGuards(RolesGuard)
  @Roles('gm')
  findByRule(@Param('ruleId') ruleId: string) {
    return this.service.findByRule(ruleId)
  }

  @Get('character/:characterId')
  findByCharacter(
    @Param('characterId') characterId: string,
    @Query('owner_id') ownerUserId: string | undefined,
    @CurrentUser() user: UserDocument,
  ) {
    const isGm = user.role === 'gm'
    // Non-GM can only view highlights for their own characters
    const resolvedOwner = isGm && ownerUserId ? ownerUserId : String(user._id)
    if (!isGm && ownerUserId && ownerUserId !== String(user._id)) {
      throw new BadRequestException('Cannot view another user\'s character highlights.')
    }
    return this.service.findByCharacter(characterId, resolvedOwner)
  }
}
