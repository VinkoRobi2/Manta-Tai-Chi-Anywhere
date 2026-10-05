import { BadRequestException, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * App User ID de RevenueCat que la app manda en la cabecera x-app-user-id.
 * Devuelve null si no viene. No es autenticación fuerte: ver docs/arquitectura.md.
 */
export const AppUserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const value = ctx.switchToHttp().getRequest<Request>().header('x-app-user-id')?.trim();
    if (!value) return null;
    if (value.length > 200) throw new BadRequestException('x-app-user-id demasiado largo');
    return value;
  },
);
