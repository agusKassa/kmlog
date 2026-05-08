import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Session, SessionSchema } from './schemas/session.schema'
import { SessionsService } from './sessions.service'
import { SessionsController } from './sessions.controller'
import { EventsModule } from '../events/events.module'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
    EventsModule,
  ],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}
