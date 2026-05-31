import { IsArray, IsBoolean, IsEnum, IsMongoId, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import type { MentionEntityType } from '@kmlog/types'

const ENTITY_TYPES = ['character', 'npc', 'location', 'session', 'hex', 'rule', 'encounter'] as const

class MentionDto {
  @IsEnum(ENTITY_TYPES)
  entity_type: MentionEntityType

  @IsString()
  entity_id: string
}

export class CreateNoteDto {
  @IsOptional()
  @IsString()
  title?: string | null

  @IsString()
  content: string

  @IsOptional()
  @IsBoolean()
  is_public?: boolean

  @IsOptional()
  @IsBoolean()
  is_pinned?: boolean

  @IsOptional()
  @IsMongoId()
  author_character_id?: string | null

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MentionDto)
  mentions?: MentionDto[]
}

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string | null

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsBoolean()
  is_public?: boolean

  @IsOptional()
  @IsBoolean()
  is_pinned?: boolean

  @IsOptional()
  @IsMongoId()
  author_character_id?: string | null

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MentionDto)
  mentions?: MentionDto[]
}
