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
import { SessionsService } from './sessions.service'
import { CreateSessionDto, UpdateSessionDto } from './dto/session.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('sessions')
export class SessionsController {
  constructor(private sessionsService: SessionsService) {}

  // Public — sessions are readable by anyone
  @Get()
  findAll() {
    return this.sessionsService.findAll()
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sessionsService.findById(id)
  }

  // GM only
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  create(@Body() dto: CreateSessionDto) {
    return this.sessionsService.create(dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  update(@Param('id') id: string, @Body() dto: UpdateSessionDto) {
    return this.sessionsService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id)
  }
}
