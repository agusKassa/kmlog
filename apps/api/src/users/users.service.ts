import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { User, UserDocument } from './schemas/user.schema'
import { UserRole } from '@kmlog/types'

interface CreateUserInput {
  email: string
  username: string
  password_hash: string
  role: UserRole
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(input: CreateUserInput): Promise<UserDocument> {
    return this.userModel.create(input)
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase() }).exec()
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec()
  }

  async updateRefreshToken(id: string, hash: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refresh_token_hash: hash }).exec()
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find({}, { password_hash: 0, refresh_token_hash: 0 }).exec()
  }

  async updateCharacterId(id: string, characterId: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { character_id: characterId }).exec()
  }
}
