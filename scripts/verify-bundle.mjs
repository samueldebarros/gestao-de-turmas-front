import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const PROIBIDOS = ['localhost:7048'];
const RAIZ = 'dist';

if (!existsSync(RAIZ)) {
  console.error(`verify:bundle NAO CONSEGUIU RODAR: a pasta ${RAIZ}/ nao existe.`);
  console.error('Isto nao e vazamento — o build nao rodou antes.');
  process.exit(2);
}

function arquivosDe(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    return statSync(caminho).isDirectory() ? arquivosDe(caminho) : [caminho];
  });
}

const arquivos = arquivosDe(RAIZ);

if (arquivos.length === 0) {
  console.error(`verify:bundle NAO CONSEGUIU RODAR: ${RAIZ}/ esta vazia.`);
  process.exit(2);
}

const achados = [];
for (const caminho of arquivos) {
  const conteudo = readFileSync(caminho, 'utf8');
  for (const termo of PROIBIDOS) {
    if (conteudo.includes(termo)) achados.push(`${caminho}: ${termo}`);
  }
}

if (achados.length > 0) {
  console.error('verify:bundle REPROVOU — termo de desenvolvimento vazou para o bundle:');
  achados.forEach((achado) => console.error(`  ${achado}`));
  console.error('Confira src/environments/environments.ts (o de producao).');
  process.exit(1);
}

console.log(`verify:bundle — ${arquivos.length} arquivo(s) conferido(s), bundle limpo.`);
