import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export class JwtPayload {
  sub!: number; // User.id 또는 AdminUser.id (Int)
  email!: string;
  role!: string;
}

/**
 * Custom parameter decorator that extracts the JWT payload from the request.
 * Usage: @CurrentUser() user: JwtPayload
 * JwtPayload is a class (not interface) to avoid TS1272 with isolatedModules + emitDecoratorMetadata.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtPayload => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (request as Request & { user: JwtPayload }).user;
  },
);
