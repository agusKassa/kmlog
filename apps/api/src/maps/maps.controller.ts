import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common'
import { MapsService } from './maps.service'
import { CreateGameMapDto, UpdateGameMapDto } from './dto/game-map.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { UserDocument } from '../users/schemas/user.schema'

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  findAll(@CurrentUser() user: UserDocument | null) {
    return this.mapsService.findAll(user?.role === 'gm')
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  findById(@Param('id') id: string, @CurrentUser() user: UserDocument | null) {
    return this.mapsService.findById(id, user?.role === 'gm')
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  create(@Body() dto: CreateGameMapDto) {
    return this.mapsService.create(dto)
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  update(@Param('id') id: string, @Body() dto: UpdateGameMapDto) {
    return this.mapsService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  remove(@Param('id') id: string) {
    return this.mapsService.remove(id)
  }
}
