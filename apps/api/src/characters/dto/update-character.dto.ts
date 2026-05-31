import { IsBoolean, IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from 'class-validator'
import type { PathbuilderBuild } from '@kmlog/types'

export class UpdateCharacterDto {
  @IsOptional()
  @IsString()
  portrait_url?: string | null

  @IsOptional()
  @IsString()
  public_bio?: string

  @IsOptional()
  @IsString()
  backstory?: string

  @IsOptional()
  @IsBoolean()
  is_alive?: boolean

  @IsOptional()
  @IsBoolean()
  in_party?: boolean

  @IsOptional()
  @IsNumber()
  @Min(0)
  current_hp?: number | null

  @IsOptional()
  @IsObject()
  build?: PathbuilderBuild

  @IsOptional()
  @IsInt()
  @Min(1)
  pathbuilder_id?: number | null

  @IsOptional()
  last_synced_at?: Date | string | null
}

export class UpdateGmNotesDto {
  @IsString()
  gm_notes: string
}
