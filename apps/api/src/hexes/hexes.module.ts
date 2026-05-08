import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Hex, HexSchema } from './schemas/hex.schema'
import { HexesService } from './hexes.service'
import { HexesController } from './hexes.controller'

@Module({
  imports: [MongooseModule.forFeature([{ name: Hex.name, schema: HexSchema }])],
  controllers: [HexesController],
  providers: [HexesService],
})
export class HexesModule {}
