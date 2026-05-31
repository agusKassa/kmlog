import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { NotesService } from './notes.service'
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { UserDocument } from '../users/schemas/user.schema'

@Controller('notes')
export class NotesController {
  constructor(private notesService: NotesService) {}

  @Get('by-character/:characterId')
  @UseGuards(OptionalJwtGuard)
  findByCharacter(
    @Param('characterId') characterId: string,
    @CurrentUser() user: UserDocument | null,
  ) {
    return this.notesService.findByCharacter(
      characterId,
      user ? String(user._id) : null,
      user?.role === 'gm',
    )
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: UserDocument) {
    return this.notesService.findAll(String(user._id), user.role === 'gm')
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.notesService.findById(id, String(user._id), user.role === 'gm')
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: UserDocument, @Body() dto: CreateNoteDto) {
    return this.notesService.create(String(user._id), dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @CurrentUser() user: UserDocument, @Body() dto: UpdateNoteDto) {
    return this.notesService.update(id, String(user._id), user.role === 'gm', dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @CurrentUser() user: UserDocument) {
    return this.notesService.remove(id, String(user._id), user.role === 'gm')
  }
}
