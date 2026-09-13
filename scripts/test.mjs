import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = await mkdtemp(join(tmpdir(), 'masroofi-tests-'));

function run(args, env = process.env) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

try {
  // Compile the real financial modules, including their type dependencies. Keep all
  // generated CommonJS files outside the repository and clean them even on failure.
  await writeFile(join(output, 'package.json'), '{"type":"commonjs"}\n');
  const compileStatus = run([
    join(root, 'node_modules', 'typescript', 'bin', 'tsc'),
    '--project', 'tsconfig.tests.json', '--outDir', output,
  ]);
  if (compileStatus !== 0) {
    process.exitCode = compileStatus;
  } else {
    const files = (await readdir(join(root, 'tests')))
      .filter((file) => file.endsWith('.test.mjs'))
      .sort()
      .map((file) => join(root, 'tests', file));
    process.exitCode = run(['--test', ...files], { ...process.env, MASROOFI_TEST_BUILD: output });
  }
} finally {
  await rm(output, { recursive: true, force: true });
}
