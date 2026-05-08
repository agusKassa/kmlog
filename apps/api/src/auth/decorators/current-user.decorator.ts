import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import { UserDocument } from '../../users/schemas/user.schema'

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserDocument => {
    return ctx.switchToHttp().getRequest().user as UserDocument
  },
)
