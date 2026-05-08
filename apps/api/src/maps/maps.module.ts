import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { GameMap, GameMapSchema } from './schemas/game-map.schema'
import { MapsService } from './maps.service'
import { MapsController } from './maps.controller'

@Module({
  imports: [MongooseModule.forFeature([{ name: GameMap.name, schema: GameMapSchema }])],
  controllers: [MapsController],
  providers: [MapsService],
  exports: [MapsService],
})
export class MapsModule {}
