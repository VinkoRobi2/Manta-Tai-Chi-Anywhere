import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JoinWaitlistDto } from './dto/join-waitlist.dto.js';
import { WaitlistService } from './waitlist.service.js';

@Controller('waitlist')
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistService) {}

  @Post()
  @HttpCode(202)
  // Más estricto que el límite general: 5 intentos por minuto por IP.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async join(@Body() dto: JoinWaitlistDto): Promise<{ ok: true }> {
    await this.waitlist.join(dto);
    return { ok: true };
  }
}
