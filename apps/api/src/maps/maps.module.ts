import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { GameMap, GameMapSchema } from './schemas/game-map.schema'
import { HexRoute, HexRouteSchema } from './schemas/hex-route.schema'
import { Hex, HexSchema } from '../hexes/schemas/hex.schema'
import { MapsService } from './maps.service'
import { MapsController } from './maps.controller'
import { HexRoutesService } from './hex-routes.service'
import { HexRoutesController } from './hex-routes.controller'

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: GameMap.name,  schema: GameMapSchema  },
      { name: HexRoute.name, schema: HexRouteSchema },
      { name: Hex.name,      schema: HexSchema      },
    ]),
  ],
  controllers: [MapsController, HexRoutesController],
  providers:   [MapsService, HexRoutesService],
  exports:     [MapsService],
})
export class MapsModule {}
