import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { CharactersService } from './characters.service'
import { ImportByIdDto, ImportByJsonDto } from './dto/import-character.dto'
import { UpdateCharacterDto, UpdateGmNotesDto } from './dto/update-character.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { UserDocument } from '../users/schemas/user.schema'

@Controller('characters')
export class CharactersController {
  constructor(private charactersService: CharactersService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  @Get()
  findAll() {
    return this.charactersService.findAll()
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: UserDocument | null) {
    return this.charactersService.findById(id, user?.role === 'gm')
  }

  // ── Authenticated ─────────────────────────────────────────────────────────

  @Post('import/pathbuilder')
  @UseGuards(JwtAuthGuard)
  importById(@CurrentUser() user: UserDocument, @Body() dto: ImportByIdDto) {
    return this.charactersService.importById(String(user._id), dto)
  }

  @Post('import/json')
  @UseGuards(JwtAuthGuard)
  importByJson(@CurrentUser() user: UserDocument, @Body() dto: ImportByJsonDto) {
    return this.charactersService.importByJson(String(user._id), dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @Body() dto: UpdateCharacterDto,
  ) {
    return this.charactersService.update(id, String(user._id), user.role === 'gm', dto)
  }

  @Post(':id/portrait')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadPortrait(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided')
    return this.charactersService.updatePortrait(id, String(user._id), user.role === 'gm', file.buffer)
  }

  // ── GM only ───────────────────────────────────────────────────────────────

  @Patch(':id/gm-notes')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  updateGmNotes(@Param('id') id: string, @Body() dto: UpdateGmNotesDto) {
    return this.charactersService.updateGmNotes(id, dto)
  }
}
