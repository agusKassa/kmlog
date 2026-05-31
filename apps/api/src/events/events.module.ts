import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Event, EventSchema } from './schemas/event.schema'
import { EventsService } from './events.service'
import { EventsController } from './events.controller'
import { EventsRecentController } from './events-recent.controller'

@Module({
  imports: [MongooseModule.forFeature([{ name: Event.name, schema: EventSchema }])],
  controllers: [EventsController, EventsRecentController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
