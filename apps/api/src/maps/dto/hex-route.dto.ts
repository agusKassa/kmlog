import { IsEnum, IsMongoId, IsOptional } from 'class-validator'

export class CreateHexRouteDto {
  @IsMongoId()
  from_hex_id: string

  @IsMongoId()
  to_hex_id: string

  @IsOptional()
  @IsEnum(['traveled', 'planned'])
  status?: 'traveled' | 'planned'
}

export class UpdateHexRouteDto {
  @IsEnum(['traveled', 'planned'])
  status: 'traveled' | 'planned'
}
