import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { MongooseModule } from '@nestjs/mongoose'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { CharactersModule } from './characters/characters.module'
import { NpcsModule } from './npcs/npcs.module'
import { LocationsModule } from './locations/locations.module'
import { SessionsModule } from './sessions/sessions.module'
import { NotesModule } from './notes/notes.module'
import { PartyStateModule } from './party-state/party-state.module'
import { RulesModule } from './rules/rules.module'
import { MapsModule } from './maps/maps.module'
import { HexesModule } from './hexes/hexes.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),
    AuthModule,
    UsersModule,
    CharactersModule,
    NpcsModule,
    LocationsModule,
    SessionsModule,
    NotesModule,
    PartyStateModule,
    RulesModule,
    MapsModule,
    HexesModule,
  ],
})
export class AppModule {}
