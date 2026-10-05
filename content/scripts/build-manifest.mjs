#!/usr/bin/env node
// Genera manifest.json (ruta, sha256 y tamaño de cada archivo) de un paquete de clase.
// Uso: pnpm content:manifest <carpeta> <slug> <locale> <version>
// Ej.: pnpm content:manifest content/build/lessons/sentado-primeros-movimientos/es/v1 sentado-primeros-movimientos es 1
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const [dir, lessonSlug, locale, versionArg] = process.argv.slice(2);
if (!dir || !lessonSlug || !locale || !versionArg) {
  console.error('Uso: build-manifest.mjs <carpeta> <slug> <locale> <version>');
  process.exit(1);
}

async function walk(current) {
  const entries = await readdir(current, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = join(current, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(full)));
    else if (entry.name !== 'manifest.json') files.push(full);
  }
  return files;
}

const files = [];
for (const file of (await walk(dir)).sort()) {
  const data = await readFile(file);
  files.push({
    path: relative(dir, file).split(sep).join('/'),
    sha256: createHash('sha256').update(data).digest('hex'),
    sizeBytes: data.length,
  });
}

const manifest = { schemaVersion: 1, lessonSlug, locale, version: Number(versionArg), files };
await writeFile(join(dir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
const total = files.reduce((sum, file) => sum + file.sizeBytes, 0);
console.log(`manifest.json: ${files.length} archivos, ${(total / 1024 / 1024).toFixed(2)} MB`);
