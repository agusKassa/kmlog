import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common'
import { HexesService } from './hexes.service'
import { AddHexNoteDto, BulkImportDto, UpdateHexDto } from './dto/hex.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { UserDocument } from '../users/schemas/user.schema'

@Controller('maps/:mapId/hexes')
export class HexesController {
  constructor(private readonly hexesService: HexesService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  findByMap(
    @Param('mapId') mapId: string,
    @CurrentUser() user: UserDocument | null,
  ) {
    return this.hexesService.findByMap(mapId, user?.role === 'gm')
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  findById(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument | null,
  ) {
    return this.hexesService.findById(id, user?.role === 'gm')
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  update(@Param('id') id: string, @Body() dto: UpdateHexDto) {
    return this.hexesService.update(id, dto)
  }

  // Any authenticated user can add notes; is_public flag is set by the author
  @Post(':id/notes')
  @UseGuards(JwtAuthGuard)
  addNote(
    @Param('id') id: string,
    @Body() dto: AddHexNoteDto,
    @CurrentUser() user: UserDocument,
  ) {
    return this.hexesService.addNote(id, String(user._id), dto)
  }

  @Delete(':hexId/notes/:noteId')
  @UseGuards(JwtAuthGuard)
  removeNote(
    @Param('hexId') hexId: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user: UserDocument,
  ) {
    return this.hexesService.removeNote(hexId, noteId, String(user._id), user.role === 'gm')
  }

  // GM-only bulk seed endpoint
  @Post('import')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  bulkImport(@Param('mapId') mapId: string, @Body() dto: BulkImportDto) {
    return this.hexesService.bulkImport(mapId, dto)
  }
}
