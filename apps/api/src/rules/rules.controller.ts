import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common'
import { RulesService } from './rules.service'
import { CreateRuleCategoryDto, CreateRuleDto, UpdateRuleDto } from './dto/rule.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { UserDocument } from '../users/schemas/user.schema'

@Controller('rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  // ── Categories ──────────────────────────────────────────────────────────────

  @Get('categories')
  findAllCategories() {
    return this.rulesService.findAllCategories()
  }

  @Post('categories')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  createCategory(@Body() dto: CreateRuleCategoryDto) {
    return this.rulesService.createCategory(dto)
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  removeCategory(@Param('id') id: string) {
    return this.rulesService.removeCategory(id)
  }

  // ── Rules ───────────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(OptionalJwtGuard)
  search(
    @Query('q') q: string | undefined,
    @Query('category') categoryId: string | undefined,
    @CurrentUser() user: UserDocument | null,
  ) {
    const isGm = user?.role === 'gm'
    return this.rulesService.search(q, categoryId, isGm)
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  findById(@Param('id') id: string, @CurrentUser() user: UserDocument | null) {
    return this.rulesService.findById(id, user?.role === 'gm')
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  create(@Body() dto: CreateRuleDto) {
    return this.rulesService.create(dto)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  update(@Param('id') id: string, @Body() dto: UpdateRuleDto) {
    return this.rulesService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  remove(@Param('id') id: string) {
    return this.rulesService.remove(id)
  }
}
