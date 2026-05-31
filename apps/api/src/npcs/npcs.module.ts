import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Npc, NpcSchema } from './schemas/npc.schema'
import { NpcsService } from './npcs.service'
import { NpcsController } from './npcs.controller'
import { CloudinaryModule } from '../cloudinary/cloudinary.module'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Npc.name, schema: NpcSchema }]),
    CloudinaryModule,
  ],
  controllers: [NpcsController],
  providers: [NpcsService],
  exports: [NpcsService],
})
export class NpcsModule {}
