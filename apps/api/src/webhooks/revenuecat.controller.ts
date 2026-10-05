import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { RevenueCatAuthGuard } from './revenuecat.guard.js';
import { RevenueCatService } from './revenuecat.service.js';

@Controller('webhooks/revenuecat')
@UseGuards(RevenueCatAuthGuard)
@SkipThrottle()
export class RevenueCatController {
  constructor(private readonly revenueCat: RevenueCatService) {}

  @Post()
  @HttpCode(200)
  handle(@Body() body: unknown): Promise<{ received: true }> {
    return this.revenueCat.handle(body);
  }
}
