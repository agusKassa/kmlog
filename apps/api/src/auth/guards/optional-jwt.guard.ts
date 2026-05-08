import { Injectable } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'

// Populates req.user if a valid Bearer token is present, but doesn't throw if absent.
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  handleRequest<T>(_err: unknown, user: T): T | null {
    return user ?? null
  }
}
