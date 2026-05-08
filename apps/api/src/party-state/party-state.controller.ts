import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common'
import { PartyStateService } from './party-state.service'
import { UpdatePartyStateDto } from './dto/party-state.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { UserDocument } from '../users/schemas/user.schema'

@Controller('party-state')
export class PartyStateController {
  constructor(private partyStateService: PartyStateService) {}

  @Get()
  get() {
    return this.partyStateService.get()
  }

  @Get('versions')
  @UseGuards(JwtAuthGuard)
  getVersions() {
    return this.partyStateService.getVersions()
  }

  @Put()
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() user: UserDocument, @Body() dto: UpdatePartyStateDto) {
    return this.partyStateService.update(String(user._id), dto)
  }
}
