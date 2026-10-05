import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.js';
import { PrismaService } from '../prisma/prisma.service.js';

export interface EntitlementChange {
  appUserId: string;
  isActive: boolean;
  expiresAt: Date | null;
  productId: string | null;
  store: string | null;
}

@Injectable()
export class EntitlementsService {
  private readonly entitlementId: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService<Env, true>,
  ) {
    this.entitlementId = config.get('REVENUECAT_ENTITLEMENT_ID', { infer: true });
  }

  /** ¿Tiene esta persona acceso premium vigente? */
  async hasPremium(revenuecatId: string, now: Date = new Date()): Promise<boolean> {
    const entitlement = await this.prisma.entitlement.findFirst({
      where: {
        identifier: this.entitlementId,
        isActive: true,
        user: { revenuecatId },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      select: { id: true },
    });
    return entitlement !== null;
  }

  /** Aplica un cambio de acceso. Es idempotente: repetirlo no cambia el resultado. */
  async apply(change: EntitlementChange): Promise<void> {
    const user = await this.prisma.appUser.upsert({
      where: { revenuecatId: change.appUserId },
      create: { revenuecatId: change.appUserId },
      update: {},
    });
    const data = {
      isActive: change.isActive,
      expiresAt: change.expiresAt,
      productId: change.productId,
      store: change.store,
    };
    await this.prisma.entitlement.upsert({
      where: { userId_identifier: { userId: user.id, identifier: this.entitlementId } },
      create: { userId: user.id, identifier: this.entitlementId, ...data },
      update: data,
    });
  }
}
