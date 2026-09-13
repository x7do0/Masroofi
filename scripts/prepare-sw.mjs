import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map((entry) => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]));
  return groups.flat();
}
const paths = (await files(root)).filter((path) => !path.endsWith('sw.js')).sort();
const hash = createHash('sha256');
for (const path of paths) hash.update(relative(root, path)).update(await readFile(path));
const template = await readFile(join(root, 'sw.js'), 'utf8');
hash.update(template);
const source = template.replace('__BUILD_HASH__', hash.digest('hex').slice(0, 16))
  .replace('/* PRECACHE_PATHS */ []', JSON.stringify(paths.map((path) => relative(root, path).replaceAll('\\', '/'))));
await writeFile(join(root, 'sw.js'), source);
console.log(`PWA: precached ${paths.length} production assets with a content-versioned shell.`);
