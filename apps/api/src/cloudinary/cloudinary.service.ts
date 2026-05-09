import { Injectable } from '@nestjs/common'
import { Readable } from 'stream'
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

@Injectable()
export class CloudinaryService {
  async uploadBuffer(buffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result: UploadApiResponse | undefined) => {
          if (error) return reject(error)
          resolve(result!.secure_url)
        },
      )
      Readable.from(buffer).pipe(stream)
    })
  }

  async deleteByUrl(url: string): Promise<void> {
    const publicId = this.extractPublicId(url)
    if (publicId) await cloudinary.uploader.destroy(publicId)
  }

  private extractPublicId(url: string): string | null {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/)
    return match ? match[1] : null
  }
}
