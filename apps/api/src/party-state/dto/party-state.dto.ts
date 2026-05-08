import { IsOptional, IsString } from 'class-validator'

export class UpdatePartyStateDto {
  @IsString()
  content: string

  @IsOptional()
  @IsString()
  version_note?: string | null
}
