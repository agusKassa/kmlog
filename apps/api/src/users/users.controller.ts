import { Controller, Get, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('gm')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll()
  }
}
