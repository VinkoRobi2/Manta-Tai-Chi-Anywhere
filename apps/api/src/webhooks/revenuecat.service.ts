import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { EntitlementsService } from '../entitlements/entitlements.service.js';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { mapRevenueCatEvent, RevenueCatWebhookSchema } from './revenuecat.mapper.js';

@Injectable()
export class RevenueCatService {
  private readonly logger = new Logger(RevenueCatService.name);
  private readonly entitlementId: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    config: ConfigService<Env, true>,
  ) {
    this.entitlementId = config.get('REVENUECAT_ENTITLEMENT_ID', { infer: true });
  }

  async handle(body: unknown): Promise<{ received: true }> {
    const parsed = RevenueCatWebhookSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Payload de RevenueCat inválido');
    const { event } = parsed.data;

    // Aplicar el cambio es idempotente, así que un reintento de RevenueCat no hace daño.
    const change = mapRevenueCatEvent(event, this.entitlementId);
    if (change) {
      await this.entitlements.apply(change);
    } else {
      this.logger.debug(`Evento ${event.type} sin efecto en el acceso`);
    }

    await this.prisma.webhookEvent.createMany({
      data: [{ id: event.id, type: event.type, payload: parsed.data as Prisma.InputJsonValue }],
      skipDuplicates: true,
    });
    return { received: true };
  }
}
