import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator'
import type { UserRole } from '@kmlog/types'

export class RegisterDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(2)
  username: string

  @IsString()
  @MinLength(8)
  password: string

  @IsOptional()
  @IsEnum(['gm', 'player'])
  role?: UserRole
}
