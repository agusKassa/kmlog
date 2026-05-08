import { IsArray, IsBoolean, IsMongoId, IsOptional, IsString } from 'class-validator'

export class CreateRuleCategoryDto {
  @IsString()
  name: string

  @IsString()
  slug: string
}

export class CreateRuleDto {
  @IsString()
  title: string

  @IsMongoId()
  category_id: string

  @IsString()
  content: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  source?: string

  @IsOptional()
  @IsBoolean()
  is_public?: boolean
}

export class UpdateRuleDto {
  @IsOptional()
  @IsString()
  title?: string

  @IsOptional()
  @IsMongoId()
  category_id?: string

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  source?: string

  @IsOptional()
  @IsBoolean()
  is_public?: boolean
}
