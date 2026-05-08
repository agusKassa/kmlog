import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common'
import { EventsService } from './events.service'
import {
  AddLootDto,
  AddXpDto,
  ClaimLootDto,
  CreateEventDto,
  ReviewXpDto,
  UpdateEventDto,
} from './dto/event.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { UserDocument } from '../users/schemas/user.schema'

// Events are accessed under /sessions/:sessionId/events
@Controller('sessions/:sessionId/events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  @Get()
  findAll(@Param('sessionId') sessionId: string) {
    return this.eventsService.findBySession(sessionId)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.eventsService.findById(id)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Param('sessionId') sessionId: string, @Body() dto: CreateEventDto) {
    return this.eventsService.create(sessionId, dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventsService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.eventsService.remove(id)
  }

  // ── XP ───────────────────────────────────────────────────────────────────

  @Post(':id/xp')
  @UseGuards(JwtAuthGuard)
  addXp(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: AddXpDto,
  ) {
    return this.eventsService.addXp(id, String(user._id), dto)
  }

  @Patch(':id/xp/:xpId/review')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  reviewXp(
    @Param('id') id: string,
    @Param('xpId') xpId: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: ReviewXpDto,
  ) {
    return this.eventsService.reviewXp(id, xpId, String(user._id), dto)
  }

  // ── Loot ─────────────────────────────────────────────────────────────────

  @Post(':id/loot')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  addLoot(@Param('id') id: string, @Body() dto: AddLootDto) {
    return this.eventsService.addLoot(id, dto)
  }

  @Patch(':id/loot/:lootId/claim')
  @UseGuards(JwtAuthGuard)
  claimLoot(
    @Param('id') id: string,
    @Param('lootId') lootId: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: ClaimLootDto,
  ) {
    return this.eventsService.claimLoot(id, lootId, String(user._id), user.role === 'gm', dto)
  }
}
