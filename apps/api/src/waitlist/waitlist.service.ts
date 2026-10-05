import { DEFAULT_LOCALE } from '@manta/shared';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { JoinWaitlistDto } from './dto/join-waitlist.dto.js';

@Injectable()
export class WaitlistService {
  constructor(private readonly prisma: PrismaService) {}

  /** Idempotente y sin revelar si el correo ya estaba registrado. */
  async join(dto: JoinWaitlistDto): Promise<void> {
    const email = dto.email.trim().toLowerCase();
    await this.prisma.waitlistEntry.upsert({
      where: { email },
      create: { email, locale: dto.locale ?? DEFAULT_LOCALE, source: dto.source },
      update: {},
    });
  }
}
