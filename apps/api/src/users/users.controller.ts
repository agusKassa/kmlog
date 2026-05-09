import { Controller, Get, Request, UseGuards } from '@nestjs/common'
import { UsersService } from './users.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async findMe(@Request() req: { user: { sub: string } }) {
    const user = await this.usersService.findById(req.user.sub)
    if (!user) return null
    return {
      _id: user._id,
      email: user.email,
      username: user.username,
      role: user.role,
      character_id: user.character_id?.toString() ?? null,
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('gm')
  findAll() {
    return this.usersService.findAll()
  }
}
