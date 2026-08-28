import { existsSync, readFileSync } from 'node:fs';

const MARCADOR = '.claude/.pendente-verify';

let bruto = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (pedaco) => (bruto += pedaco));
process.stdin.on('end', () => {
  let entrada = {};
  try {
    entrada = JSON.parse(bruto);
  } catch {
    process.exit(0);
  }

  if (entrada.stop_hook_active) process.exit(0);
  if (!existsSync(MARCADOR)) process.exit(0);

  let arquivos = [];
  try {
    arquivos = [...new Set(readFileSync(MARCADOR, 'utf8').split('\n').filter(Boolean))];
  } catch {
    process.exit(0);
  }

  const amostra = arquivos.slice(0, 5);
  const resto = arquivos.length - amostra.length;

  console.error(
    'PARADA BLOQUEADA: este turno alterou src/ e o "npm run verify" nao fechou verde depois.',
  );
  console.error('');
  for (const arquivo of amostra) console.error(`  ${arquivo}`);
  if (resto > 0) console.error(`  ... e mais ${resto} arquivo(s).`);
  console.error('');
  console.error('Rode: npm run verify');
  console.error(
    'Se ele reprovar, conserte antes de encerrar — verde e a condicao de pronto neste projeto.',
  );
  console.error('Se a alteracao foi descartada, apague o arquivo .claude/.pendente-verify.');
  process.exit(2);
});
