import { IsInt, IsObject, Min } from 'class-validator'
import type { PathbuilderBuild } from '@kmlog/types'

export class ImportByIdDto {
  @IsInt()
  @Min(1)
  pathbuilder_id: number
}

export class ImportByJsonDto {
  @IsObject()
  build: PathbuilderBuild
}
