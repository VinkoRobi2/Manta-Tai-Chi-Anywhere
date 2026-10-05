import { Module } from '@nestjs/common';
import { RevenueCatController } from './revenuecat.controller.js';
import { RevenueCatAuthGuard } from './revenuecat.guard.js';
import { RevenueCatService } from './revenuecat.service.js';

@Module({
  controllers: [RevenueCatController],
  providers: [RevenueCatService, RevenueCatAuthGuard],
})
export class WebhooksModule {}
