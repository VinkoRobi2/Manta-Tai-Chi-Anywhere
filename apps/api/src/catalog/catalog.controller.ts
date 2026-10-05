import { DEFAULT_LOCALE, LOCALES, LocaleSchema, type CatalogManifest } from '@manta/shared';
import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service.js';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  getCatalog(@Query('locale') locale?: string): Promise<CatalogManifest> {
    const parsed = LocaleSchema.safeParse(locale ?? DEFAULT_LOCALE);
    if (!parsed.success) {
      throw new BadRequestException(`locale debe ser uno de: ${LOCALES.join(', ')}`);
    }
    return this.catalog.getManifest(parsed.data);
  }
}
