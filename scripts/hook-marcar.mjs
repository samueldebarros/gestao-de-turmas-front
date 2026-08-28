import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';

const MARCADOR = '.claude/.pendente-verify';
const EXTENSOES = /\.(ts|html|scss)$/;

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
  if (!caminho || !EXTENSOES.test(caminho)) process.exit(0);

  const relativo = relative(process.cwd(), resolve(caminho)).split('\\').join('/');
  if (!relativo.startsWith('src/')) process.exit(0);

  try {
    mkdirSync(dirname(MARCADOR), { recursive: true });
    appendFileSync(MARCADOR, `${relativo}\n`);
  } catch {
    process.exit(0);
  }
  process.exit(0);
});
