import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { UserRole } from '@kmlog/types'
import { ROLES_KEY } from '../decorators/roles.decorator'
import { UserDocument } from '../../users/schemas/user.schema'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required) return true

    const user = context.switchToHttp().getRequest().user as UserDocument
    return required.includes(user.role)
  }
}
