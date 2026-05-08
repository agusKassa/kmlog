import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { PartyState, PartyStateSchema } from './schemas/party-state.schema'
import { PartyStateService } from './party-state.service'
import { PartyStateController } from './party-state.controller'

@Module({
  imports: [MongooseModule.forFeature([{ name: PartyState.name, schema: PartyStateSchema }])],
  controllers: [PartyStateController],
  providers: [PartyStateService],
})
export class PartyStateModule {}
