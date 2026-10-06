import {
  createParamDecorator,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';

type SessionRequest = Request & { userId?: string };

/** Exige la sesión de la app en la cabecera Authorization: Bearer <token>. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SessionRequest>();
    const [scheme, token] = (request.header('authorization') ?? '').split(' ');
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException();
    request.userId = await this.auth.userIdFromToken(token);
    return true;
  }
}

/** El id de la persona con sesión. Solo en rutas protegidas con SessionGuard. */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const userId = ctx.switchToHttp().getRequest<SessionRequest>().userId;
    if (!userId) throw new UnauthorizedException();
    return userId;
  },
);
