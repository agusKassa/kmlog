import { IsArray, IsBoolean, IsMongoId, IsOptional, IsString, IsUrl } from 'class-validator'

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
  @IsString()
  short_description?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  source?: string

  @IsOptional()
  @IsUrl()
  nethys_url?: string

  @IsOptional()
  @IsBoolean()
  is_public?: boolean

  @IsOptional()
  @IsBoolean()
  is_draft?: boolean
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
  @IsString()
  short_description?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  source?: string

  @IsOptional()
  @IsUrl()
  nethys_url?: string

  @IsOptional()
  @IsBoolean()
  is_public?: boolean

  @IsOptional()
  @IsBoolean()
  is_draft?: boolean
}
