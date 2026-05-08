import { IsArray, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import type { LocationType, LocationVisibilityMode } from '@kmlog/types'

class VisibilityDto {
  @IsEnum(['public', 'party', 'gm_only', 'custom'])
  mode: LocationVisibilityMode

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowed_user_ids?: string[]
}

export class CreateLocationDto {
  @IsString()
  name: string

  @IsEnum(['city', 'dungeon', 'wilderness', 'building', 'region', 'other'])
  type: LocationType

  @IsOptional()
  @IsString()
  parent_location_id?: string | null

  @IsOptional()
  @IsString()
  discovered_in_session_id?: string | null

  @IsOptional()
  @IsString()
  public_description?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => VisibilityDto)
  visibility?: VisibilityDto
}

export class UpdateLocationPublicDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsEnum(['city', 'dungeon', 'wilderness', 'building', 'region', 'other'])
  type?: LocationType

  @IsOptional()
  @IsString()
  public_description?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  public_image_urls?: string[]

  @IsOptional()
  @IsString()
  parent_location_id?: string | null

  @IsOptional()
  @IsString()
  discovered_in_session_id?: string | null
}

export class UpdateLocationPrivateDto {
  @IsOptional()
  @IsString()
  gm_notes?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  private_image_urls?: string[]

  @IsOptional()
  @ValidateNested()
  @Type(() => VisibilityDto)
  visibility?: VisibilityDto
}
