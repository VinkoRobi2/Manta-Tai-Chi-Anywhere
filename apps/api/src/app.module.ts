import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { validateEnv } from './config/env.js';
import { DownloadsModule } from './downloads/downloads.module.js';
import { EntitlementsModule } from './entitlements/entitlements.module.js';
import { HealthModule } from './health/health.module.js';
import { PracticeModule } from './practice/practice.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProgressModule } from './progress/progress.module.js';
import { WaitlistModule } from './waitlist/waitlist.module.js';
import { WebhooksModule } from './webhooks/webhooks.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    // Límite general: 120 peticiones por minuto por IP.
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    PrismaModule,
    EntitlementsModule,
    HealthModule,
    CatalogModule,
    DownloadsModule,
    WebhooksModule,
    WaitlistModule,
    AuthModule,
    ProgressModule,
    PracticeModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
