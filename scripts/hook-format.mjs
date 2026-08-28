import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const EXTENSOES = /\.(ts|html|scss|mjs)$/;
const PRETTIER = join('node_modules', 'prettier', 'bin', 'prettier.cjs');

let bruto = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (pedaco) => (bruto += pedaco));
process.stdin.on('end', () => {
  let entrada;
  try {
    entrada = JSON.parse(bruto);
  } catch {
    process.exit(0);
  }

  const caminho = entrada.tool_response?.filePath ?? entrada.tool_input?.file_path;
  if (!caminho || !EXTENSOES.test(caminho) || !existsSync(caminho)) process.exit(0);

  try {
    execFileSync(process.execPath, [PRETTIER, '--write', caminho], { stdio: 'ignore' });
  } catch {
    process.exit(0);
  }
  process.exit(0);
});
