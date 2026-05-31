import { Controller, DefaultValuePipe, Get, ParseIntPipe, Query } from '@nestjs/common'
import { EventsService } from './events.service'

@Controller('events')
export class EventsRecentController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('recent')
  findRecent(
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit: number,
  ) {
    return this.eventsService.findRecent(Math.min(limit, 20))
  }
}
