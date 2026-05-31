import { IsArray, IsBoolean, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'
import type { MentionEntityType } from '@kmlog/types'

class MentionDto {
  @IsEnum(['character', 'npc', 'location', 'session'])
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
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MentionDto)
  mentions?: MentionDto[]
}
