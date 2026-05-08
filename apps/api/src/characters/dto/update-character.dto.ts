import { IsOptional, IsString } from 'class-validator'

export class UpdateCharacterDto {
  @IsOptional()
  @IsString()
  portrait_url?: string | null

  @IsOptional()
  @IsString()
  public_bio?: string
}

export class UpdateGmNotesDto {
  @IsString()
  gm_notes: string
}
