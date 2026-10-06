import type { AuthSession } from '@manta/shared';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service.js';
import { AppleSignInDto, GoogleSignInDto } from './dto/sign-in.dto.js';

/** Entrar con Apple o con Google. Devuelve la sesión de la app. */
@Controller('auth')
// Más estricto que el límite general: 10 intentos por minuto por IP.
@Throttle({ default: { limit: 10, ttl: 60_000 } })
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('apple')
  @HttpCode(200)
  signInWithApple(@Body() dto: AppleSignInDto): Promise<AuthSession> {
    return this.auth.signInWithApple(dto);
  }

  @Post('google')
  @HttpCode(200)
  signInWithGoogle(@Body() dto: GoogleSignInDto): Promise<AuthSession> {
    return this.auth.signInWithGoogle(dto);
  }
}
