import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model, Types } from 'mongoose'
import { HexRoute, HexRouteDocument } from './schemas/hex-route.schema'
import { Hex, HexDocument } from '../hexes/schemas/hex.schema'
import type { CreateHexRouteDto, UpdateHexRouteDto } from './dto/hex-route.dto'

@Injectable()
export class HexRoutesService {
  constructor(
    @InjectModel(HexRoute.name) private routeModel: Model<HexRouteDocument>,
    @InjectModel(Hex.name)      private hexModel:   Model<HexDocument>,
  ) {}

  findByMap(mapId: string): Promise<HexRouteDocument[]> {
    return this.routeModel.find({ map_id: new Types.ObjectId(mapId) }).exec()
  }

  async create(mapId: string, dto: CreateHexRouteDto, userId: string): Promise<HexRouteDocument> {
    const mapOid  = new Types.ObjectId(mapId)
    const fromOid = new Types.ObjectId(dto.from_hex_id)
    const toOid   = new Types.ObjectId(dto.to_hex_id)

    const [hexA, hexB] = await Promise.all([
      this.hexModel.findOne({ _id: fromOid, map_id: mapOid }).exec(),
      this.hexModel.findOne({ _id: toOid,   map_id: mapOid }).exec(),
    ])
    if (!hexA || !hexB) throw new NotFoundException('One or both hexes not found')

    // Axial (cube) distance — must be exactly 1 to be adjacent
    const dist = Math.max(
      Math.abs(hexA.q - hexB.q),
      Math.abs(hexA.r - hexB.r),
      Math.abs((hexA.q + hexA.r) - (hexB.q + hexB.r)),
    )
    if (dist !== 1) throw new BadRequestException('Hexes must be adjacent')

    // Prevent duplicate routes in either direction
    const exists = await this.routeModel.findOne({
      $or: [
        { from_hex_id: fromOid, to_hex_id: toOid },
        { from_hex_id: toOid,   to_hex_id: fromOid },
      ],
    }).exec()
    if (exists) throw new ConflictException('Route already exists between these hexes')

    return this.routeModel.create({
      map_id:      mapOid,
      from_hex_id: fromOid,
      to_hex_id:   toOid,
      status:      dto.status ?? 'planned',
      created_by:  new Types.ObjectId(userId),
    })
  }

  async update(id: string, dto: UpdateHexRouteDto): Promise<HexRouteDocument> {
    const updated = await this.routeModel
      .findByIdAndUpdate(id, { status: dto.status }, { new: true })
      .exec()
    if (!updated) throw new NotFoundException('Route not found')
    return updated
  }

  async remove(id: string): Promise<void> {
    const result = await this.routeModel.findByIdAndDelete(id).exec()
    if (!result) throw new NotFoundException('Route not found')
  }
}
