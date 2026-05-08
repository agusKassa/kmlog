import { IsArray, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator'
import type { SessionStatus } from '@kmlog/types'

export class CreateSessionDto {
  @IsInt()
  @Min(1)
  session_number: number

  @IsString()
  title: string

  @IsOptional()
  @IsDateString()
  date_played?: string

  @IsOptional()
  @IsString()
  preamble?: string
}

export class UpdateSessionDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsDateString()
  date_played?: string | null

  @IsOptional()
  @IsString()
  preamble?: string

  @IsOptional()
  @IsString()
  summary?: string

  @IsOptional()
  @IsEnum(['draft', 'played', 'published'])
  status?: SessionStatus

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attendees?: string[]
}
