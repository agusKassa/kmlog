import { IsInt, IsMongoId, IsObject, IsOptional, IsString, Min } from 'class-validator'
import type { PathbuilderBuild } from '@kmlog/types'

export class ImportByIdDto {
  @IsInt()
  @Min(1)
  pathbuilder_id: number
}

export class ImportByJsonDto {
  @IsObject()
  build: PathbuilderBuild

  @IsOptional()
  @IsInt()
  @Min(1)
  pathbuilder_id?: number | null
}

export class ImportForUserDto {
  @IsMongoId()
  user_id: string

  @IsInt()
  @Min(1)
  pathbuilder_id: number
}

export class ImportJsonForUserDto {
  @IsMongoId()
  user_id: string

  @IsObject()
  build: PathbuilderBuild
}

export class CreateUserDto {
  @IsString()
  email: string

  @IsString()
  username: string

  @IsString()
  password: string
}
