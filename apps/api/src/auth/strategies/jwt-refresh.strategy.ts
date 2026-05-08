import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Request } from 'express'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../../users/users.service'
import { JwtPayload } from './jwt-access.strategy'

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    })
  }

  async validate(req: Request, payload: JwtPayload) {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim()
    if (!refreshToken) throw new UnauthorizedException()

    const user = await this.usersService.findById(payload.sub)
    if (!user?.refresh_token_hash) throw new UnauthorizedException()

    const matches = await bcrypt.compare(refreshToken, user.refresh_token_hash)
    if (!matches) throw new UnauthorizedException()

    return user
  }
}
