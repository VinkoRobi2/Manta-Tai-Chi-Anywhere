import { Module } from '@nestjs/common';
import { DownloadsController } from './downloads.controller.js';
import { DownloadsService } from './downloads.service.js';
import { StorageService } from './storage.service.js';

@Module({
  controllers: [DownloadsController],
  providers: [DownloadsService, StorageService],
})
export class DownloadsModule {}
