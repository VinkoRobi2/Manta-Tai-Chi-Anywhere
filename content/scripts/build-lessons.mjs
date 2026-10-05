#!/usr/bin/env node
// Genera la línea de tiempo (timeline.json) de cada clase y cada idioma a partir de
// content/guiones/movimientos.json y content/guiones/clases.json.
// Uso: pnpm content:lessons   (requiere `pnpm --filter @manta/shared build` antes)
//
// En la Fase 1 las líneas de tiempo viajan dentro de la app (apps/mobile/assets/lessons).
// En la Fase 2 se suben a R2 junto con los videos y la app las descarga.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTimeline, LOCALES } from '../../packages/shared/dist/index.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = async (path) => JSON.parse(await readFile(join(root, path), 'utf8'));

const rawLibrary = await read('content/guiones/movimientos.json');
const recipes = await read('content/guiones/clases.json');

const library = Object.fromEntries(
  Object.entries(rawLibrary)
    .filter(([id]) => !id.startsWith('_'))
    .map(([id, movement]) => [id, { id, ...movement }]),
);

const outDir = join(root, 'apps/mobile/assets/lessons');
const imports = [];
const entries = [];

for (const recipe of recipes) {
  const perLocale = [];
  for (const locale of LOCALES) {
    const timeline = buildTimeline(recipe, library, locale);
    const file = join(outDir, recipe.slug, locale, 'timeline.json');
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, `${JSON.stringify(timeline, null, 2)}\n`);

    const name = `${recipe.slug.replace(/-(\w)/g, (_, c) => c.toUpperCase())}_${locale}`;
    imports.push(`import ${name} from '../../../assets/lessons/${recipe.slug}/${locale}/timeline.json';`);
    perLocale.push(`${locale}: ${name}`);
  }
  entries.push(`  '${recipe.slug}': { ${perLocale.join(', ')} },`);
}

const generated = `// Generado por content/scripts/build-lessons.mjs. No lo edites a mano: corre \`pnpm content:lessons\`.
import type { Locale } from '@manta/shared';

${imports.join('\n')}

/** Líneas de tiempo empaquetadas en la app, sin validar todavía (se validan al abrir la clase). */
export const PACKAGED_TIMELINES: Record<string, Record<Locale, unknown>> = {
${entries.join('\n')}
};
`;
await writeFile(join(root, 'apps/mobile/src/features/catalog/timelines.generated.ts'), generated);
console.log(`Listo: ${recipes.length} clases × ${LOCALES.length} idiomas en apps/mobile/assets/lessons`);
