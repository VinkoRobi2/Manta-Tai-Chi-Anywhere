import { timingSafeEqual } from 'node:crypto';
import {
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import type { Env } from '../config/env.js';

/** Solo RevenueCat conoce el secreto que va en la cabecera Authorization. */
@Injectable()
export class RevenueCatAuthGuard implements CanActivate {
  private readonly expected: Buffer;

  constructor(config: ConfigService<Env, true>) {
    this.expected = Buffer.from(
      `Bearer ${config.get('REVENUECAT_WEBHOOK_SECRET', { infer: true })}`,
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const received = Buffer.from(
      context.switchToHttp().getRequest<Request>().header('authorization') ?? '',
    );
    // Comparación en tiempo constante para no filtrar el secreto por tiempos de respuesta.
    if (received.length !== this.expected.length || !timingSafeEqual(received, this.expected)) {
      throw new UnauthorizedException();
    }
    return true;
  }
}
