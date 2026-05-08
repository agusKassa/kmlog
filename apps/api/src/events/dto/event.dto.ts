import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Min, ValidateIf } from 'class-validator'
import type { EncounterDifficulty, EventKind, EventType, LootType } from '@kmlog/types'

export class CreateEventDto {
  @IsEnum(['event', 'encounter'])
  kind: EventKind

  @ValidateIf((o: CreateEventDto) => o.kind === 'event')
  @IsEnum(['exploration', 'social', 'narrative', 'rest', 'downtime'])
  event_type?: EventType

  @ValidateIf((o: CreateEventDto) => o.kind === 'encounter')
  @IsEnum(['trivial', 'low', 'moderate', 'severe', 'extreme'])
  difficulty?: EncounterDifficulty

  @IsString()
  title: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsEnum(['exploration', 'social', 'narrative', 'rest', 'downtime'])
  event_type?: EventType

  @IsOptional()
  @IsEnum(['trivial', 'low', 'moderate', 'severe', 'extreme'])
  difficulty?: EncounterDifficulty

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number
}

export class AddXpDto {
  @IsNumber()
  @Min(0)
  amount: number

  @IsString()
  reason: string
}

export class ReviewXpDto {
  @IsEnum(['approved', 'rejected'])
  status: 'approved' | 'rejected'
}

export class AddLootDto {
  @IsString()
  name: string

  @IsEnum(['weapon', 'armor', 'consumable', 'treasure', 'magic', 'other'])
  type: LootType

  @IsOptional()
  @IsNumber()
  @Min(0)
  value_gp?: number

  @IsOptional()
  @IsInt()
  @Min(1)
  quantity?: number

  @IsOptional()
  @IsString()
  description?: string
}

export class ClaimLootDto {
  @IsEnum(['claimed', 'party'])
  status: 'claimed' | 'party'

  @IsOptional()
  @IsString()
  owner_character_id?: string | null
}
