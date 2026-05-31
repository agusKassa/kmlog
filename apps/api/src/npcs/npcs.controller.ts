import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { memoryStorage } from 'multer'
import { NpcsService } from './npcs.service'
import { CreateNpcDto, UpdateNpcPrivateDto, UpdateNpcPublicDto } from './dto/npc.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { UserDocument } from '../users/schemas/user.schema'

@Controller('npcs')
export class NpcsController {
  constructor(private npcsService: NpcsService) {}

  // ── Public ────────────────────────────────────────────────────────────────

  @Get()
  @UseGuards(OptionalJwtGuard)
  findAll(@CurrentUser() user: UserDocument | null) {
    return this.npcsService.findAll(user?.role === 'gm')
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: UserDocument | null) {
    return this.npcsService.findById(id, user?.role === 'gm')
  }

  // ── GM only ───────────────────────────────────────────────────────────────

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  create(@Body() dto: CreateNpcDto) {
    return this.npcsService.create(dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  updatePublic(@Param('id') id: string, @Body() dto: UpdateNpcPublicDto) {
    return this.npcsService.updatePublic(id, dto)
  }

  @Patch(':id/private')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  updatePrivate(@Param('id') id: string, @Body() dto: UpdateNpcPrivateDto) {
    return this.npcsService.updatePrivate(id, dto)
  }

  @Post(':id/portrait')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  uploadPortrait(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('No file provided')
    return this.npcsService.uploadPortrait(id, file.buffer)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.npcsService.remove(id)
  }
}
