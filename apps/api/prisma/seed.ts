// Datos de ejemplo para desarrollo. Es idempotente: puedes correrlo varias veces.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  type Level,
  type Locale,
  type SpaceMode,
} from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

type Texts = Record<Locale, { title: string; body: string }>;

interface SeedProgram {
  slug: string;
  spaceMode: SpaceMode;
  level: Level;
  isPremium: boolean;
  sortOrder: number;
  texts: Texts;
  lesson: { slug: string; durationSec: number; texts: Texts };
}

const PROGRAMS: SeedProgram[] = [
  {
    slug: 'sentado-basico',
    spaceMode: 'SEATED',
    level: 'BEGINNER',
    isPremium: false,
    sortOrder: 1,
    texts: {
      es: { title: 'Tai chi sentado', body: 'Movimientos completos desde una silla.' },
      en: { title: 'Seated tai chi', body: 'Complete movements from a chair.' },
      de: { title: 'Tai Chi im Sitzen', body: 'Vollständige Bewegungen auf einem Stuhl.' },
    },
    lesson: {
      slug: 'sentado-primeros-movimientos',
      durationSec: 600,
      texts: {
        es: {
          title: 'Primeros movimientos',
          body: 'Respiración, apertura y manos de nube sentado.',
        },
        en: { title: 'First movements', body: 'Breathing, opening and seated cloud hands.' },
        de: { title: 'Erste Bewegungen', body: 'Atmung, Eröffnung und Wolkenhände im Sitzen.' },
      },
    },
  },
  {
    slug: 'en-el-lugar',
    spaceMode: 'STANDING_IN_PLACE',
    level: 'BEGINNER',
    isPremium: true,
    sortOrder: 2,
    texts: {
      es: { title: 'De pie, en el lugar', body: 'Tai chi en un metro cuadrado.' },
      en: { title: 'Standing in place', body: 'Tai chi in one square meter.' },
      de: { title: 'Im Stehen, auf der Stelle', body: 'Tai Chi auf einem Quadratmeter.' },
    },
    lesson: {
      slug: 'en-el-lugar-manos-de-nube',
      durationSec: 900,
      texts: {
        es: { title: 'Manos de nube sin desplazarte', body: 'La forma clásica adaptada al lugar.' },
        en: {
          title: 'Cloud hands without stepping',
          body: 'The classic form adapted to stay in place.',
        },
        de: { title: 'Wolkenhände ohne Schritte', body: 'Die klassische Form auf der Stelle.' },
      },
    },
  },
  {
    slug: 'forma-24',
    spaceMode: 'FULL_FORM',
    level: 'INTERMEDIATE',
    isPremium: true,
    sortOrder: 3,
    texts: {
      es: { title: 'Forma de 24 movimientos', body: 'La forma Yang simplificada completa.' },
      en: { title: '24-movement form', body: 'The complete simplified Yang form.' },
      de: { title: 'Die 24er-Form', body: 'Die vollständige vereinfachte Yang-Form.' },
    },
    lesson: {
      slug: 'forma-24-apertura',
      durationSec: 1200,
      texts: {
        es: { title: 'Apertura y primeros pasos', body: 'Movimientos 1 a 4 de la forma.' },
        en: { title: 'Opening and first steps', body: 'Movements 1 to 4 of the form.' },
        de: { title: 'Eröffnung und erste Schritte', body: 'Bewegungen 1 bis 4 der Form.' },
      },
    },
  },
];

const LOCALES: Locale[] = ['es', 'en', 'de'];
// Hash de ejemplo: reemplázalo con el real cuando subas el paquete (pnpm content:manifest).
const PLACEHOLDER_SHA = '0'.repeat(64);

async function main() {
  for (const p of PROGRAMS) {
    const program = await prisma.program.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        spaceMode: p.spaceMode,
        level: p.level,
        isPremium: p.isPremium,
        published: true,
        sortOrder: p.sortOrder,
        translations: {
          create: LOCALES.map((locale) => ({
            locale,
            title: p.texts[locale].title,
            description: p.texts[locale].body,
          })),
        },
      },
    });

    await prisma.lesson.upsert({
      where: { slug: p.lesson.slug },
      update: {},
      create: {
        programId: program.id,
        slug: p.lesson.slug,
        durationSec: p.lesson.durationSec,
        published: true,
        translations: {
          create: LOCALES.map((locale) => ({
            locale,
            title: p.lesson.texts[locale].title,
            summary: p.lesson.texts[locale].body,
          })),
        },
        packages: {
          create: {
            locale: 'es',
            version: 1,
            basePath: `lessons/${p.lesson.slug}/es/v1/`,
            files: [{ path: 'timeline.json', sha256: PLACEHOLDER_SHA, sizeBytes: 0 }],
            totalBytes: 0,
          },
        },
      },
    });
  }
  console.log(`Seed listo: ${PROGRAMS.length} programas con una clase cada uno.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
