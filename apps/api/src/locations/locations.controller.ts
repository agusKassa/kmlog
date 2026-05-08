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
import { LocationsService } from './locations.service'
import {
  CreateLocationDto,
  UpdateLocationPrivateDto,
  UpdateLocationPublicDto,
} from './dto/location.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { UserDocument } from '../users/schemas/user.schema'

@Controller('locations')
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  @Get()
  @UseGuards(OptionalJwtGuard)
  findAll(@CurrentUser() user: UserDocument | null) {
    return this.locationsService.findAll(
      user ? String(user._id) : null,
      user?.role === 'gm',
    )
  }

  @Get(':id')
  @UseGuards(OptionalJwtGuard)
  findOne(@Param('id') id: string, @CurrentUser() user: UserDocument | null) {
    return this.locationsService.findById(
      id,
      user ? String(user._id) : null,
      user?.role === 'gm',
    )
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  create(@Body() dto: CreateLocationDto) {
    return this.locationsService.create(dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  updatePublic(@Param('id') id: string, @Body() dto: UpdateLocationPublicDto) {
    return this.locationsService.updatePublic(id, dto)
  }

  @Patch(':id/private')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  updatePrivate(@Param('id') id: string, @Body() dto: UpdateLocationPrivateDto) {
    return this.locationsService.updatePrivate(id, dto)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.locationsService.remove(id)
  }
}
