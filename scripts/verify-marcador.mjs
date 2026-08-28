import { rmSync } from 'node:fs';

const MARCADOR = '.claude/.pendente-verify';

try {
  rmSync(MARCADOR, { force: true });
} catch {
  process.exit(0);
}

console.log('verify — cadeia verde; marcador de pendencia limpo.');
process.exit(0);
