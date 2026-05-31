import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString } from 'class-validator'
import type { NpcRole } from '@kmlog/types'

export class CreateNpcDto {
  @IsString()
  name: string

  @IsOptional()
  @IsEnum(['ally', 'enemy', 'neutral', 'unknown'])
  role?: NpcRole

  @IsOptional()
  @IsString()
  portrait_url?: string | null

  @IsOptional()
  @IsString()
  public_description?: string

  @IsOptional()
  @IsString()
  location_id?: string

  @IsOptional()
  @IsString()
  first_seen_session_id?: string
}

export class UpdateNpcPublicDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(['ally', 'enemy', 'neutral', 'unknown'])
  role?: NpcRole

  @IsOptional()
  @IsBoolean()
  is_alive?: boolean

  @IsOptional()
  @IsString()
  portrait_url?: string | null

  @IsOptional()
  @IsString()
  public_description?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public_image_urls?: string[]

  @IsOptional()
  @IsString()
  location_id?: string | null

  @IsOptional()
  @IsString()
  first_seen_session_id?: string | null

  @IsOptional()
  @IsBoolean()
  is_with_party?: boolean

  @IsOptional()
  @IsString()
  last_seen_hex_id?: string | null

  @IsOptional()
  @IsString()
  last_seen_description?: string

  @IsOptional()
  @IsString()
  last_seen_at?: string | null
}

export class UpdateNpcPrivateDto {
  @IsOptional()
  @IsString()
  gm_notes?: string

  @IsOptional()
  @IsString()
  true_motives?: string

  @IsOptional()
  @IsObject()
  stats?: Record<string, unknown> | null
}
