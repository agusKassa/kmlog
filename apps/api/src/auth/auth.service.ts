import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import * as bcrypt from 'bcrypt'
import { UsersService } from '../users/users.service'
import { RegisterDto } from './dto/register.dto'
import { LoginDto } from './dto/login.dto'
import { JwtPayload } from './strategies/jwt-access.strategy'

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.usersService.findByEmail(dto.email)
    if (existing) throw new ConflictException('Email already in use')

    const password_hash = await bcrypt.hash(dto.password, 10)
    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      password_hash,
      role: dto.role ?? 'player',
    })

    const tokens = await this.issueTokens(String(user._id), user.email, user.role)
    await this.storeRefreshToken(String(user._id), tokens.refresh_token)
    return tokens
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email)
    if (!user) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(dto.password, user.password_hash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    const tokens = await this.issueTokens(String(user._id), user.email, user.role)
    await this.storeRefreshToken(String(user._id), tokens.refresh_token)
    return tokens
  }

  async refresh(userId: string, email: string, role: string) {
    const tokens = await this.issueTokens(userId, email, role)
    await this.storeRefreshToken(userId, tokens.refresh_token)
    return tokens
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null)
  }

  private async issueTokens(userId: string, email: string, role: string) {
    const payload: JwtPayload = { sub: userId, email, role }

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_ACCESS_SECRET'),
        expiresIn: '12h',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ])

    return { access_token, refresh_token }
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hash = await bcrypt.hash(refreshToken, 10)
    await this.usersService.updateRefreshToken(userId, hash)
  }
}
