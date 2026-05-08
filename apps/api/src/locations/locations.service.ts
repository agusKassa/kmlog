import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Location, LocationDocument } from './schemas/location.schema'
import {
  CreateLocationDto,
  UpdateLocationPrivateDto,
  UpdateLocationPublicDto,
} from './dto/location.dto'

@Injectable()
export class LocationsService {
  constructor(@InjectModel(Location.name) private locationModel: Model<LocationDocument>) {}

  async create(dto: CreateLocationDto): Promise<LocationDocument> {
    return this.locationModel.create(dto as Parameters<typeof this.locationModel.create>[0])
  }

  async findAll(userId: string | null, isGm: boolean): Promise<LocationDocument[]> {
    const filter = isGm ? {} : this.visibilityFilter(userId)
    const projection = isGm ? {} : { gm_notes: 0, private_image_urls: 0 }
    return this.locationModel.find(filter, projection).exec()
  }

  async findById(id: string, userId: string | null, isGm: boolean): Promise<LocationDocument> {
    const projection = isGm ? {} : { gm_notes: 0, private_image_urls: 0 }
    const location = await this.locationModel.findById(id, projection).exec()
    if (!location) throw new NotFoundException('Location not found')
    if (!isGm && !this.canView(location, userId)) throw new ForbiddenException()
    return location
  }

  async updatePublic(id: string, dto: UpdateLocationPublicDto): Promise<LocationDocument> {
    const updated = await this.locationModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec()
    if (!updated) throw new NotFoundException('Location not found')
    return updated
  }

  async updatePrivate(id: string, dto: UpdateLocationPrivateDto): Promise<LocationDocument> {
    const updated = await this.locationModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec()
    if (!updated) throw new NotFoundException('Location not found')
    return updated
  }

  async remove(id: string): Promise<void> {
    const result = await this.locationModel.findByIdAndDelete(id).exec()
    if (!result) throw new NotFoundException('Location not found')
  }

  private visibilityFilter(userId: string | null) {
    if (!userId) return { 'visibility.mode': 'public' }
    return {
      $or: [
        { 'visibility.mode': 'public' },
        { 'visibility.mode': 'party' },
        { 'visibility.mode': 'custom', 'visibility.allowed_user_ids': userId },
      ],
    }
  }

  private canView(location: LocationDocument, userId: string | null): boolean {
    const { mode, allowed_user_ids } = location.visibility
    if (mode === 'public') return true
    if (!userId) return false
    if (mode === 'party') return true
    if (mode === 'gm_only') return false
    return allowed_user_ids.map(String).includes(userId)
  }
}
