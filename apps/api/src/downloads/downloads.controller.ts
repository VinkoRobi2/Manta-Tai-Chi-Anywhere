import { DEFAULT_LOCALE, type DownloadGrant } from '@manta/shared';
import { Body, Controller, HttpCode, Param, Post } from '@nestjs/common';
import { AppUserId } from '../common/app-user-id.decorator.js';
import { DownloadsService } from './downloads.service.js';
import { RequestDownloadDto } from './dto/request-download.dto.js';

@Controller('lessons')
export class DownloadsController {
  constructor(private readonly downloads: DownloadsService) {}

  /** Devuelve enlaces temporales para descargar el paquete de una clase. */
  @Post(':slug/download')
  @HttpCode(200)
  requestDownload(
    @Param('slug') slug: string,
    @Body() body: RequestDownloadDto,
    @AppUserId() appUserId: string | null,
  ): Promise<DownloadGrant> {
    return this.downloads.grant(slug, body.locale ?? DEFAULT_LOCALE, appUserId);
  }
}
