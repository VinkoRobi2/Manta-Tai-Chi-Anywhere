// Carga en la base de datos los programas y clases con los que nace Manta (STARTER_PROGRAMS de
// @manta/shared, los mismos que la app lleva dentro). Es idempotente: si cambian los textos o qué
// es Premium, correrlo otra vez los actualiza.
import 'dotenv/config';
import { LOCALES, STARTER_PROGRAMS } from '@manta/shared';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

// Hash de ejemplo: reemplázalo con el real cuando subas el paquete (pnpm content:manifest).
const PLACEHOLDER_SHA = '0'.repeat(64);

async function main() {
  let lessonCount = 0;
  for (const [programIndex, p] of STARTER_PROGRAMS.entries()) {
    const fields = {
      spaceMode: p.spaceMode,
      level: p.level,
      isPremium: p.isPremium,
      published: true,
      sortOrder: programIndex + 1,
    };
    const program = await prisma.program.upsert({
      where: { slug: p.slug },
      update: fields,
      create: { slug: p.slug, ...fields },
    });
    for (const locale of LOCALES) {
      const text = { title: p.title[locale], description: p.description[locale] };
      await prisma.programTranslation.upsert({
        where: { programId_locale: { programId: program.id, locale } },
        update: text,
        create: { programId: program.id, locale, ...text },
      });
    }

    for (const [lessonIndex, l] of p.lessons.entries()) {
      const lessonFields = {
        programId: program.id,
        durationSec: l.durationSec,
        isPremium: l.isPremium,
        published: true,
        sortOrder: lessonIndex + 1,
      };
      const lesson = await prisma.lesson.upsert({
        where: { slug: l.slug },
        update: lessonFields,
        create: { slug: l.slug, ...lessonFields },
      });
      for (const locale of LOCALES) {
        const text = { title: l.title[locale], summary: l.summary[locale] };
        await prisma.lessonTranslation.upsert({
          where: { lessonId_locale: { lessonId: lesson.id, locale } },
          update: text,
          create: { lessonId: lesson.id, locale, ...text },
        });
      }
      await prisma.lessonPackage.upsert({
        where: { lessonId_locale_version: { lessonId: lesson.id, locale: 'es', version: 1 } },
        update: {},
        create: {
          lessonId: lesson.id,
          locale: 'es',
          version: 1,
          basePath: `lessons/${l.slug}/es/v1/`,
          files: [{ path: 'timeline.json', sha256: PLACEHOLDER_SHA, sizeBytes: 0 }],
          totalBytes: 0,
        },
      });
      lessonCount += 1;
    }
  }
  console.log(`Seed listo: ${STARTER_PROGRAMS.length} programas y ${lessonCount} clases.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
