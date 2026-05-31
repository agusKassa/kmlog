import { IsMongoId, IsOptional } from 'class-validator'

export class CreateRuleHighlightDto {
  @IsMongoId()
  rule_id: string

  @IsOptional()
  @IsMongoId()
  character_id?: string

  // GM only: highlight on behalf of another user
  @IsOptional()
  @IsMongoId()
  target_user_id?: string
}
