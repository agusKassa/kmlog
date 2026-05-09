import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import type { PathbuilderBuild } from '@kmlog/types'
import { Character, CharacterDocument } from './schemas/character.schema'
import { UsersService } from '../users/users.service'
import { CloudinaryService } from '../cloudinary/cloudinary.service'
import { ImportByIdDto, ImportByJsonDto } from './dto/import-character.dto'
import { UpdateCharacterDto, UpdateGmNotesDto } from './dto/update-character.dto'

const PUBLIC_PROJECTION = { gm_notes: 0 } as const

interface PathbuilderResponse {
  success: boolean
  build: PathbuilderBuild
}

@Injectable()
export class CharactersService {
  constructor(
    @InjectModel(Character.name) private characterModel: Model<CharacterDocument>,
    private usersService: UsersService,
    private cloudinaryService: CloudinaryService,
  ) {}

  async findAll(): Promise<CharacterDocument[]> {
    return this.characterModel
      .find({ is_active: true }, PUBLIC_PROJECTION)
      .populate('user_id', 'username')
      .exec()
  }

  async findById(id: string, isGm: boolean): Promise<CharacterDocument> {
    const projection = isGm ? {} : PUBLIC_PROJECTION
    const character = await this.characterModel.findById(id, projection).exec()
    if (!character) throw new NotFoundException('Character not found')
    return character
  }

  async importById(userId: string, dto: ImportByIdDto): Promise<CharacterDocument> {
    const url = `https://pathbuilder2e.com/json.php?id=${dto.pathbuilder_id}`
    let data: PathbuilderResponse

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'kmlog/1.0' } })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data = await res.json() as PathbuilderResponse
    } catch {
      throw new BadRequestException('Could not reach Pathbuilder. Try importing by JSON.')
    }

    if (!data.success) throw new BadRequestException('Pathbuilder ID not found or not public.')

    return this.createCharacter(userId, data.build, dto.pathbuilder_id)
  }

  async importByJson(userId: string, dto: ImportByJsonDto): Promise<CharacterDocument> {
    return this.createCharacter(userId, dto.build, null)
  }

  async update(
    id: string,
    requesterId: string,
    isGm: boolean,
    dto: UpdateCharacterDto,
  ): Promise<CharacterDocument> {
    const character = await this.characterModel.findById(id).exec()
    if (!character) throw new NotFoundException('Character not found')
    if (!isGm && String(character.user_id) !== requesterId) throw new ForbiddenException()

    const updated = await this.characterModel
      .findByIdAndUpdate(id, dto, { new: true, projection: PUBLIC_PROJECTION })
      .exec()

    return updated!
  }

  async updatePortrait(
    id: string,
    requesterId: string,
    isGm: boolean,
    buffer: Buffer,
  ): Promise<CharacterDocument> {
    const character = await this.characterModel.findById(id).exec()
    if (!character) throw new NotFoundException('Character not found')
    if (!isGm && String(character.user_id) !== requesterId) throw new ForbiddenException()

    if (character.portrait_url) {
      await this.cloudinaryService.deleteByUrl(character.portrait_url).catch(() => null)
    }

    const portrait_url = await this.cloudinaryService.uploadBuffer(buffer, 'kmlog/portraits')

    return this.characterModel
      .findByIdAndUpdate(id, { portrait_url }, { new: true, projection: { gm_notes: 0 } })
      .exec() as Promise<CharacterDocument>
  }

  async updateGmNotes(id: string, dto: UpdateGmNotesDto): Promise<CharacterDocument> {
    const updated = await this.characterModel
      .findByIdAndUpdate(id, { gm_notes: dto.gm_notes }, { new: true })
      .exec()
    if (!updated) throw new NotFoundException('Character not found')
    return updated
  }

  private async createCharacter(
    userId: string,
    build: PathbuilderBuild,
    pathbuilder_id: number | null,
  ): Promise<CharacterDocument> {
    // Deactivate any previous active character for this user
    await this.characterModel.updateMany({ user_id: userId, is_active: true }, { is_active: false })

    const character = await this.characterModel.create({
      user_id: userId,
      build,
      pathbuilder_id,
      is_active: true,
    })

    await this.usersService.updateCharacterId(userId, String(character._id))

    return character
  }
}
