import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

export class HexConfigDto {
  @IsNumber() @Min(1) hex_size_px: number
  @IsInt() @Min(1) cols: number
  @IsInt() @Min(1) rows: number
  @IsNumber() @Min(0) hex_size_miles: number
  @IsNumber() @Min(1) travel_hours_per_day: number
  @IsNumber() @Min(1) party_speed_ft: number
}

export class CreateGameMapDto {
  @IsString()
  name: string

  @ValidateNested()
  @Type(() => HexConfigDto)
  hex_config: HexConfigDto

  @IsOptional()
  @IsString()
  reference_image_url?: string

  @IsOptional()
  @IsBoolean()
  is_public?: boolean
}

export class UpdateGameMapDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @ValidateNested()
  @Type(() => HexConfigDto)
  hex_config?: HexConfigDto

  @IsOptional()
  @IsString()
  current_party_hex_id?: string | null

  @IsOptional()
  @IsString()
  reference_image_url?: string | null

  @IsOptional()
  @IsBoolean()
  is_public?: boolean
}
