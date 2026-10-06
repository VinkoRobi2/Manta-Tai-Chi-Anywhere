import { randomUUID } from 'node:crypto';
import type { AuthSession } from '@manta/shared';
import { Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { errors } from 'jose';
import type { Env } from '../config/env.js';
import { isUniqueViolation } from '../prisma/errors.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AppleSignInDto, GoogleSignInDto } from './dto/sign-in.dto.js';
import {
  appleKeys,
  googleKeys,
  verifyAppleToken,
  verifyGoogleToken,
  type VerifiedIdentity,
} from './identity.js';
import { sessionKey, signSessionToken, verifySessionToken } from './session-token.js';

const list = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

@Injectable()
export class AuthService {
  private readonly key: Uint8Array;
  private readonly sessionDays: number;
  private readonly appleAudiences: string[];
  private readonly googleAudiences: string[];

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.key = sessionKey(config.get('AUTH_JWT_SECRET', { infer: true }));
    this.sessionDays = config.get('AUTH_SESSION_DAYS', { infer: true });
    this.appleAudiences = list(config.get('APPLE_AUDIENCES', { infer: true }));
    this.googleAudiences = list(config.get('GOOGLE_CLIENT_IDS', { infer: true }));
  }

  async signInWithApple(dto: AppleSignInDto): Promise<AuthSession> {
    const identity = await verified(
      verifyAppleToken(dto.identityToken, appleKeys, this.appleAudiences),
    );
    return this.signIn({ ...identity, name: dto.fullName?.trim() || null });
  }

  async signInWithGoogle(dto: GoogleSignInDto): Promise<AuthSession> {
    if (this.googleAudiences.length === 0) {
      throw new ServiceUnavailableException('Entrar con Google no está configurado en la API');
    }
    return this.signIn(
      await verified(verifyGoogleToken(dto.idToken, googleKeys, this.googleAudiences)),
    );
  }

  /** El id de la persona de una sesión de la app, o 401. */
  async userIdFromToken(token: string): Promise<string> {
    try {
      return await verifySessionToken(token, this.key);
    } catch {
      throw new UnauthorizedException();
    }
  }

  /** La primera vez crea la persona y su cuenta; después la reconoce por proveedor + sub. */
  private async signIn(identity: VerifiedIdentity): Promise<AuthSession> {
    const upsert = () => {
      const userId = randomUUID();
      return this.prisma.account.upsert({
        where: {
          provider_providerUserId: {
            provider: identity.provider,
            providerUserId: identity.subject,
          },
        },
        // Apple manda nombre y correo solo la primera vez: si después llegan vacíos, se conservan.
        update: {
          ...(identity.email ? { email: identity.email } : {}),
          ...(identity.name ? { name: identity.name } : {}),
        },
        create: {
          provider: identity.provider,
          providerUserId: identity.subject,
          email: identity.email,
          name: identity.name,
          // Su App User ID de RevenueCat es su propio id: las compras quedan atadas a la cuenta.
          user: { create: { id: userId, revenuecatId: userId } },
        },
      });
    };
    // Si la misma persona entra dos veces a la vez, el segundo intento encuentra la cuenta ya creada.
    const account = await upsert().catch((error: unknown) => {
      if (isUniqueViolation(error)) return upsert();
      throw error;
    });
    const token = await signSessionToken(account.userId, this.key, this.sessionDays);
    return { token, user: { id: account.userId, name: account.name, email: account.email } };
  }
}

/**
 * Token falso, ajeno o caducado: 401. Sin conexión con Apple o Google para bajar sus claves: 503,
 * así la app sabe que puede reintentar y no que la persona hizo algo mal.
 */
async function verified(verification: Promise<VerifiedIdentity>): Promise<VerifiedIdentity> {
  try {
    return await verification;
  } catch (error) {
    if (error instanceof errors.JWKSTimeout || error instanceof TypeError) {
      throw new ServiceUnavailableException('No se pudo verificar la cuenta. Prueba en un momento');
    }
    throw new UnauthorizedException();
  }
}
