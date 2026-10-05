import { DEFAULT_LOCALE, type CatalogManifest, type Locale } from '@manta/shared';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

/** Elige la fila del idioma pedido o, si no existe, la del idioma por defecto. */
function pickLocale<T extends { locale: string }>(rows: T[], locale: Locale): T | undefined {
  return (
    rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === DEFAULT_LOCALE)
  );
}

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async getManifest(locale: Locale): Promise<CatalogManifest> {
    const locales: Locale[] = locale === DEFAULT_LOCALE ? [locale] : [locale, DEFAULT_LOCALE];

    const programs = await this.prisma.program.findMany({
      where: { published: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        translations: { where: { locale: { in: locales } } },
        lessons: {
          where: { published: true },
          orderBy: { sortOrder: 'asc' },
          include: {
            translations: { where: { locale: { in: locales } } },
            packages: { where: { locale: { in: locales } }, orderBy: { version: 'desc' } },
          },
        },
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      locale,
      programs: programs.map((program) => {
        const text = pickLocale(program.translations, locale);
        return {
          id: program.id,
          slug: program.slug,
          spaceMode: program.spaceMode,
          level: program.level,
          isPremium: program.isPremium,
          title: text?.title ?? program.slug,
          description: text?.description ?? '',
          lessons: program.lessons.map((lesson) => {
            const lessonText = pickLocale(lesson.translations, locale);
            const pkg = pickLocale(lesson.packages, locale);
            return {
              id: lesson.id,
              slug: lesson.slug,
              durationSec: lesson.durationSec,
              isPremium: lesson.isPremium || program.isPremium,
              title: lessonText?.title ?? lesson.slug,
              summary: lessonText?.summary ?? '',
              packageVersion: pkg?.version ?? null,
              packageBytes: pkg?.totalBytes ?? null,
            };
          }),
        };
      }),
    };
  }
}
