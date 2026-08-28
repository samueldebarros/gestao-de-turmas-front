import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

const EXTENSOES = /\.(ts|html|scss|mjs)$/;
const BASE = process.env['VERIFY_BASE'] ?? 'main';
const PRETTIER = join('node_modules', 'prettier', 'bin', 'prettier.cjs');

function git(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n')
      .map((linha) => linha.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

if (git(['rev-parse', '--verify', BASE]).length === 0) {
  console.error(`verify:format NAO CONSEGUIU RODAR: a referencia "${BASE}" nao existe aqui.`);
  console.error('Em CI, use fetch-depth: 0 e aponte VERIFY_BASE para a branch de destino.');
  console.error('Isto nao e reprovacao de formatacao — o gate nao rodou.');
  process.exit(2);
}

const candidatos = new Set([
  ...git(['diff', '--name-only', '--diff-filter=ACMR', `${BASE}...HEAD`]),
  ...git(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']),
  ...git(['ls-files', '--others', '--exclude-standard']),
]);

const arquivos = [...candidatos].filter((arquivo) => EXTENSOES.test(arquivo));

if (arquivos.length === 0) {
  console.log(`verify:format — nenhum arquivo alterado vs ${BASE} sujeito a formatacao.`);
  process.exit(0);
}

console.log(`verify:format — conferindo ${arquivos.length} arquivo(s) alterado(s) vs ${BASE}.`);

try {
  execFileSync(process.execPath, [PRETTIER, '--check', ...arquivos], { stdio: 'inherit' });
} catch (erro) {
  if (erro.status === 1) {
    console.error('\nverify:format REPROVOU. Rode: npx prettier --write <arquivo>');
    process.exit(1);
  }
  console.error(`\nverify:format NAO CONSEGUIU RODAR o prettier (status ${erro.status}).`);
  console.error('Isto nao e reprovacao de formatacao — o gate esta quebrado.');
  process.exit(2);
}
