import { DEFAULT_LOCALE, PackageFileSchema, type DownloadGrant, type Locale } from '@manta/shared';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EntitlementsService } from '../entitlements/entitlements.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { StorageService } from './storage.service.js';

@Injectable()
export class DownloadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly entitlements: EntitlementsService,
    private readonly storage: StorageService,
  ) {}

  async grant(slug: string, locale: Locale, appUserId: string | null): Promise<DownloadGrant> {
    const lesson = await this.prisma.lesson.findFirst({
      where: { slug, published: true, program: { published: true } },
      include: {
        program: { select: { isPremium: true } },
        packages: {
          where: { locale: { in: [locale, DEFAULT_LOCALE] } },
          orderBy: { version: 'desc' },
        },
      },
    });
    if (!lesson) throw new NotFoundException('Clase no encontrada');

    const pkg =
      lesson.packages.find((p) => p.locale === locale) ??
      lesson.packages.find((p) => p.locale === DEFAULT_LOCALE);
    if (!pkg) throw new NotFoundException('Esta clase todavía no tiene paquete descargable');

    if (lesson.isPremium || lesson.program.isPremium) {
      if (!appUserId) throw new UnauthorizedException('Falta x-app-user-id para contenido premium');
      if (!(await this.entitlements.hasPremium(appUserId))) {
        throw new ForbiddenException('Contenido premium: se necesita una suscripción activa');
      }
    }

    const files = PackageFileSchema.array().parse(pkg.files);
    const signed = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await this.storage.signedUrl(`${pkg.basePath}${file.path}`),
      })),
    );

    return {
      lessonSlug: lesson.slug,
      locale: pkg.locale,
      version: pkg.version,
      expiresInSeconds: this.storage.ttlSeconds,
      files: signed,
    };
  }
}
