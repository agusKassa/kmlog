import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { HexRoutesService } from './hex-routes.service'
import { CreateHexRouteDto, UpdateHexRouteDto } from './dto/hex-route.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { UserDocument } from '../users/schemas/user.schema'

@Controller('maps/:mapId/routes')
export class HexRoutesController {
  constructor(private readonly service: HexRoutesService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  findAll(@Param('mapId') mapId: string) {
    return this.service.findByMap(mapId)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Param('mapId') mapId: string,
    @Body() dto: CreateHexRouteDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.service.create(mapId, dto, String(user._id))
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() dto: UpdateHexRouteDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
