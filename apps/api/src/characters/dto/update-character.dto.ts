import { IsBoolean, IsNumber, IsOptional, IsString, Min } from 'class-validator'

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
}

export class UpdateGmNotesDto {
  @IsString()
  gm_notes: string
}
