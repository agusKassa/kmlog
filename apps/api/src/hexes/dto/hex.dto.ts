import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import type { TerrainType, HexFeatureType, LinearFeatureType } from '@kmlog/types'

const TERRAIN_VALUES = ['plains','hills','forest','swamp','mountains','desert','tundra','lake','ocean','other'] as const
const FEATURE_VALUES = ['city','town','village','dungeon','cave','ruins','fortress','temple','mine','landmark','other'] as const
const LINEAR_VALUES = ['river','stream','road','trail','cliff','coastline','wall','bridge'] as const

export class PointFeatureDto {
  @IsEnum(FEATURE_VALUES) type: HexFeatureType
  @IsInt() position: number
  @IsOptional() @IsString() label?: string | null
  @IsOptional() @IsMongoId() location_id?: string | null
}

export class LinearFeatureDto {
  @IsEnum(LINEAR_VALUES) type: LinearFeatureType
  @IsArray() @IsNumber({}, { each: true }) path: number[]
}

export class UpdateHexDto {
  @IsOptional() @IsEnum(TERRAIN_VALUES) terrain?: TerrainType
  @IsOptional() @IsString() region?: string | null
  @IsOptional() @IsBoolean() is_discovered?: boolean
  @IsOptional() @IsBoolean() is_explored?: boolean
  @IsOptional() @IsString() party_summary?: string | null
  @IsOptional() @IsString() gm_notes?: string | null

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointFeatureDto)
  point_features?: PointFeatureDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinearFeatureDto)
  linear_features?: LinearFeatureDto[]
}

export class AddHexNoteDto {
  @IsString() content: string
  @IsOptional() @IsBoolean() is_public?: boolean
}

// ── Bulk import ──────────────────────────────────────────────────────────────

export class BulkHexDto {
  @IsInt() q: number
  @IsInt() r: number
  @IsEnum(TERRAIN_VALUES) terrain: TerrainType
  @IsOptional() @IsString() region?: string | null
  @IsOptional() @IsBoolean() is_discovered?: boolean
  @IsOptional() @IsBoolean() is_explored?: boolean
  @IsOptional() @IsString() party_summary?: string | null
  @IsOptional() @IsString() gm_notes?: string | null

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PointFeatureDto)
  point_features?: PointFeatureDto[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LinearFeatureDto)
  linear_features?: LinearFeatureDto[]
}

export class BulkImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkHexDto)
  hexes: BulkHexDto[]
}
