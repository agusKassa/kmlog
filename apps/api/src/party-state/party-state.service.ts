import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { PartyState, PartyStateDocument } from './schemas/party-state.schema'
import { UpdatePartyStateDto } from './dto/party-state.dto'

@Injectable()
export class PartyStateService {
  constructor(
    @InjectModel(PartyState.name) private partyStateModel: Model<PartyStateDocument>,
  ) {}

  async get(): Promise<PartyStateDocument> {
    let doc = await this.partyStateModel.findOne().exec()
    if (!doc) doc = await this.partyStateModel.create({})
    return doc
  }

  async update(userId: string, dto: UpdatePartyStateDto): Promise<PartyStateDocument> {
    const doc = await this.get()

    // Archive current content before overwriting
    if (doc.current_content) {
      doc.versions.push({
        content: doc.current_content,
        updated_by: doc.last_updated_by!,
        updated_at: doc.updated_at ?? new Date(),
        version_note: null,
      } as never)
    }

    doc.current_content = dto.content
    doc.last_updated_by = userId as never
    doc.updated_at = new Date()

    if (dto.version_note && doc.versions.length > 0) {
      doc.versions[doc.versions.length - 1].version_note = dto.version_note
    }

    return doc.save()
  }

  async getVersions(): Promise<PartyStateDocument['versions']> {
    const doc = await this.get()
    return doc.versions.slice().reverse()
  }
}
