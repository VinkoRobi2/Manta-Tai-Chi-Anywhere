import type { Level, SpaceMode } from './enums.js';
import type { Localized } from './lesson-builder.js';

/**
 * Los programas y clases con los que nace Manta. Es la única fuente: la app los lleva
 * dentro (funcionan sin internet) y la API los carga en la base de datos con el seed.
 * Los slugs de las clases son los de content/guiones/clases.json.
 */

export interface StarterLesson {
  slug: string;
  durationSec: number;
  isPremium: boolean;
  title: Localized<string>;
  summary: Localized<string>;
}

export interface StarterProgram {
  slug: string;
  spaceMode: SpaceMode;
  level: Level;
  /** Todo el programa es de Premium. Si no, cada clase dice si lo es. */
  isPremium: boolean;
  title: Localized<string>;
  description: Localized<string>;
  lessons: StarterLesson[];
}

export const STARTER_PROGRAMS: readonly StarterProgram[] = [
  {
    slug: 'sentado-basico',
    spaceMode: 'SEATED',
    level: 'BEGINNER',
    isPremium: false,
    title: { es: 'Tai chi sentado', en: 'Seated tai chi', de: 'Tai Chi im Sitzen' },
    description: {
      es: 'Cinco movimientos completos desde una silla.',
      en: 'Five complete movements from a chair.',
      de: 'Fünf vollständige Bewegungen auf einem Stuhl.',
    },
    lessons: [
      {
        slug: 'sentado-primeros-movimientos',
        durationSec: 360,
        isPremium: false,
        title: { es: 'Primeros movimientos', en: 'First movements', de: 'Erste Bewegungen' },
        summary: {
          es: 'Llegar a la silla, abrir y tus primeras manos de nube.',
          en: 'Settle in, open up and your first cloud hands.',
          de: 'Ankommen, öffnen und deine ersten Wolkenhände.',
        },
      },
      {
        slug: 'sentado-manos-de-nube',
        durationSec: 480,
        isPremium: false,
        title: { es: 'Manos de nube', en: 'Cloud hands', de: 'Wolkenhände' },
        summary: {
          es: 'Las manos dibujan nubes mientras la cintura gira.',
          en: 'Your hands trace clouds as your waist turns.',
          de: 'Die Hände malen Wolken, während die Taille dreht.',
        },
      },
      {
        slug: 'sentado-abrir-el-pecho',
        durationSec: 420,
        isPremium: false,
        title: { es: 'Abrir el pecho', en: 'Opening the chest', de: 'Brust öffnen' },
        summary: {
          es: 'Brazos abiertos con la respiración para soltar los hombros.',
          en: 'Arms open with the breath to release the shoulders.',
          de: 'Die Arme öffnen sich mit dem Atem und lösen die Schultern.',
        },
      },
      {
        slug: 'sentado-grulla',
        durationSec: 480,
        isPremium: false,
        title: {
          es: 'La grulla abre las alas',
          en: 'White crane spreads its wings',
          de: 'Der Kranich breitet die Flügel aus',
        },
        summary: {
          es: 'Una mano sube y la otra baja: equilibrio desde el centro.',
          en: 'One hand rises, the other sinks: balance from your center.',
          de: 'Eine Hand steigt, die andere sinkt: Gleichgewicht aus der Mitte.',
        },
      },
      {
        slug: 'sentado-cepillar-rodilla',
        durationSec: 540,
        isPremium: false,
        title: { es: 'Cepillar la rodilla', en: 'Brush knee', de: 'Knie streifen' },
        summary: {
          es: 'Una mano barre junto a la rodilla y la otra empuja suave.',
          en: 'One hand sweeps past the knee as the other pushes softly.',
          de: 'Eine Hand streift am Knie vorbei, die andere schiebt sanft.',
        },
      },
    ],
  },
  {
    slug: 'en-el-lugar',
    spaceMode: 'STANDING_IN_PLACE',
    level: 'BEGINNER',
    isPremium: false,
    title: { es: 'De pie, en el lugar', en: 'Standing in place', de: 'Im Stehen, auf der Stelle' },
    description: {
      es: 'Tai chi en un metro cuadrado, sin desplazarte.',
      en: 'Tai chi in one square meter, without stepping.',
      de: 'Tai Chi auf einem Quadratmeter, ohne Schritte.',
    },
    lessons: [
      {
        slug: 'en-el-lugar-manos-de-nube',
        durationSec: 600,
        isPremium: false,
        title: {
          es: 'Manos de nube sin desplazarte',
          en: 'Cloud hands without stepping',
          de: 'Wolkenhände ohne Schritte',
        },
        summary: {
          es: 'La forma clásica adaptada a un metro cuadrado.',
          en: 'The classic form adapted to one square meter.',
          de: 'Die klassische Form auf einem Quadratmeter.',
        },
      },
      {
        slug: 'en-el-lugar-abrir-el-pecho',
        durationSec: 480,
        isPremium: false,
        title: {
          es: 'Abrir el pecho de pie',
          en: 'Opening the chest, standing',
          de: 'Brust öffnen im Stehen',
        },
        summary: {
          es: 'El peso pasa de un pie al otro mientras el pecho se abre.',
          en: 'Your weight shifts foot to foot as the chest opens.',
          de: 'Das Gewicht wandert von Fuß zu Fuß, während sich die Brust öffnet.',
        },
      },
      {
        slug: 'en-el-lugar-grulla',
        durationSec: 540,
        isPremium: true,
        title: {
          es: 'La grulla en el lugar',
          en: 'White crane in place',
          de: 'Der Kranich auf der Stelle',
        },
        summary: {
          es: 'Equilibrio sobre una pierna, con apoyo si lo necesitas.',
          en: 'Balance on one leg, with support if you need it.',
          de: 'Gleichgewicht auf einem Bein, mit Halt, wenn du ihn brauchst.',
        },
      },
      {
        slug: 'en-el-lugar-marea-completa',
        durationSec: 720,
        isPremium: true,
        title: { es: 'Marea completa', en: 'Full tide', de: 'Volle Flut' },
        summary: {
          es: 'Los tres movimientos seguidos, como una sola ola.',
          en: 'All three movements in a row, like a single wave.',
          de: 'Alle drei Bewegungen am Stück, wie eine einzige Welle.',
        },
      },
    ],
  },
  {
    slug: 'forma-24',
    spaceMode: 'FULL_FORM',
    level: 'INTERMEDIATE',
    isPremium: true,
    title: { es: 'Forma de 24 movimientos', en: '24-movement form', de: 'Die 24er-Form' },
    description: {
      es: 'La forma Yang simplificada, paso a paso.',
      en: 'The simplified Yang form, step by step.',
      de: 'Die vereinfachte Yang-Form, Schritt für Schritt.',
    },
    lessons: [
      {
        slug: 'forma-24-apertura',
        durationSec: 720,
        isPremium: true,
        title: {
          es: 'Apertura y crin del caballo',
          en: "Opening and the horse's mane",
          de: 'Eröffnung und Pferdemähne',
        },
        summary: {
          es: 'El comienzo de la forma y tus primeros pasos.',
          en: 'The opening of the form and your first steps.',
          de: 'Der Beginn der Form und deine ersten Schritte.',
        },
      },
      {
        slug: 'forma-24-grulla',
        durationSec: 600,
        isPremium: true,
        title: {
          es: 'Crin del caballo y grulla',
          en: "Horse's mane and white crane",
          de: 'Pferdemähne und Kranich',
        },
        summary: {
          es: 'Unimos dos movimientos de la forma sin parar.',
          en: 'Two movements of the form, joined without stopping.',
          de: 'Zwei Bewegungen der Form, ohne Pause verbunden.',
        },
      },
    ],
  },
];
