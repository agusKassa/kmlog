import { Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { Character, CharacterSchema } from './schemas/character.schema'
import { CharactersService } from './characters.service'
import { CharactersController } from './characters.controller'
import { UsersModule } from '../users/users.module'
import { CloudinaryModule } from '../cloudinary/cloudinary.module'

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Character.name, schema: CharacterSchema }]),
    UsersModule,
    CloudinaryModule,
  ],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
