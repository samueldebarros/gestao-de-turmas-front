import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';

const RAIZ = 'src';
const ALLOWLIST = 'scripts/conformidade-allowlist.json';
const CHAVE_I18N = /^[A-Z0-9_]+(\.[A-Z0-9_]+)*$/;

// Regra sobre ESTRUTURA de producao nao vale para spec: teste assina, dubla e
// monta fixture por natureza. Regra sobre HIGIENE DE DADO (R3) vale em todo
// lugar — objeto de dominio logado num teste vaza igual, na saida do CI.
const ehSpec = (caminho) => caminho.endsWith('.spec.ts');

const REGRAS = [
  {
    id: 'R1',
    titulo: 'Service nao guarda estado',
    porque: 'Service e HTTP puro: sem Subject, sem subscribe. Estado mora no Facade.',
    aplicaA: (caminho) => caminho.startsWith('src/app/core/services/') && !ehSpec(caminho),
    detectar(no) {
      if (
        ts.isNewExpression(no) &&
        ts.isIdentifier(no.expression) &&
        no.expression.text.endsWith('Subject')
      )
        return `new ${no.expression.text}()`;
      if (
        ts.isCallExpression(no) &&
        ts.isPropertyAccessExpression(no.expression) &&
        no.expression.name.text === 'subscribe'
      )
        return '.subscribe()';
      return null;
    },
  },
  {
    id: 'R2',
    titulo: 'Componente em shared/ nao conhece Facade',
    porque: 'Quem injeta Facade conhece o dominio e mora em features/. shared/ e reutilizavel.',
    aplicaA: (caminho) => caminho.startsWith('src/app/shared/') && !ehSpec(caminho),
    detectar(no) {
      if (
        ts.isImportDeclaration(no) &&
        ts.isStringLiteral(no.moduleSpecifier) &&
        no.moduleSpecifier.text.includes('core/facades')
      )
        return `import de ${no.moduleSpecifier.text}`;
      return null;
    },
  },
  {
    id: 'R3',
    titulo: 'console nao recebe objeto de dominio',
    porque:
      'Objeto de dominio carrega CPF, e-mail e data de nascimento. Logue identificador e acao.',
    aplicaA: () => true,
    detectar(no) {
      if (!ts.isCallExpression(no)) return null;
      if (!ts.isPropertyAccessExpression(no.expression)) return null;
      if (!ts.isIdentifier(no.expression.expression) || no.expression.expression.text !== 'console')
        return null;

      const suspeito = no.arguments.find(
        (arg) =>
          ts.isIdentifier(arg) ||
          ts.isPropertyAccessExpression(arg) ||
          ts.isObjectLiteralExpression(arg),
      );
      return suspeito ? `console.${no.expression.name.text}(${suspeito.getText()})` : null;
    },
  },
  {
    id: 'R4',
    titulo: 'Titulo de coluna e chave i18n',
    porque: 'String visivel nunca fica no codigo. O titulo referencia a chave; o template traduz.',
    aplicaA: (caminho) => !ehSpec(caminho),
    detectar(no) {
      if (!ts.isPropertyAssignment(no)) return null;
      if (!no.parent || !ts.isObjectLiteralExpression(no.parent)) return null;
      const nome = ts.isIdentifier(no.name) || ts.isStringLiteral(no.name) ? no.name.text : null;
      if (nome !== 'titulo') return null;
      if (!ts.isStringLiteral(no.initializer)) return null;
      if (CHAVE_I18N.test(no.initializer.text)) return null;
      return `titulo: '${no.initializer.text}'`;
    },
  },
];

if (!existsSync(RAIZ)) {
  console.error(`verify:conformidade NAO CONSEGUIU RODAR: a pasta ${RAIZ}/ nao existe.`);
  process.exit(2);
}

function arquivosTs(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome);
    if (statSync(caminho).isDirectory()) return arquivosTs(caminho);
    return caminho.endsWith('.ts') ? [caminho.replaceAll('\\', '/')] : [];
  });
}

const arquivos = arquivosTs(RAIZ);

if (arquivos.length === 0) {
  console.error(`verify:conformidade NAO CONSEGUIU RODAR: nenhum .ts sob ${RAIZ}/.`);
  process.exit(2);
}

const violacoes = [];

for (const caminho of arquivos) {
  const regrasDoArquivo = REGRAS.filter((regra) => regra.aplicaA(caminho));
  if (regrasDoArquivo.length === 0) continue;

  const fonte = ts.createSourceFile(
    caminho,
    readFileSync(caminho, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );

  const visitar = (no) => {
    for (const regra of regrasDoArquivo) {
      const trecho = regra.detectar(no);
      if (trecho) {
        const linha = fonte.getLineAndCharacterOfPosition(no.getStart(fonte)).line + 1;
        violacoes.push({ regra: regra.id, arquivo: caminho, linha, trecho });
      }
    }
    ts.forEachChild(no, visitar);
  };
  visitar(fonte);
}

const permitido = existsSync(ALLOWLIST) ? JSON.parse(readFileSync(ALLOWLIST, 'utf8')) : {};
const contar = (id, arquivo) =>
  violacoes.filter((v) => v.regra === id && v.arquivo === arquivo).length;

const novas = [];
const pagas = [];

for (const regra of REGRAS) {
  const daRegra = permitido[regra.id] ?? {};
  const arquivosTocados = new Set([
    ...Object.keys(daRegra),
    ...violacoes.filter((v) => v.regra === regra.id).map((v) => v.arquivo),
  ]);

  for (const arquivo of arquivosTocados) {
    const atual = contar(regra.id, arquivo);
    const teto = daRegra[arquivo]?.max ?? 0;
    if (atual > teto) novas.push({ regra, arquivo, atual, teto });
    if (atual < teto) pagas.push({ regra, arquivo, atual, teto });
  }
}

for (const regra of REGRAS) {
  const total = violacoes.filter((v) => v.regra === regra.id).length;
  const excedeu = novas.some((n) => n.regra.id === regra.id);
  const marca = excedeu ? 'REPROVOU' : 'ok';
  console.log(
    `[${regra.id}] ${marca} — ${regra.titulo} (${total} ocorrencia(s), allowlist inclusa)`,
  );
}

if (pagas.length > 0) {
  console.log('\nDivida paga — baixe o teto na allowlist para travar o ganho:');
  for (const { regra, arquivo, atual, teto } of pagas) {
    console.log(`  ${regra.id} ${arquivo}: allowlist permite ${teto}, encontrei ${atual}`);
  }
}

if (novas.length === 0) {
  console.log('\nverify:conformidade — nenhuma violacao nova.');
  process.exit(0);
}

console.error('\nverify:conformidade REPROVOU — violacao nova de regra do AGENTS.md:\n');
for (const { regra, arquivo, atual, teto } of novas) {
  console.error(`[${regra.id}] ${regra.titulo}`);
  console.error(`  ${regra.porque}`);
  console.error(`  ${arquivo}: allowlist permite ${teto}, encontrei ${atual}`);
  for (const v of violacoes.filter((v) => v.regra === regra.id && v.arquivo === arquivo)) {
    console.error(`    linha ${v.linha}: ${v.trecho}`);
  }
  console.error('');
}
console.error('Conserte o codigo. Só edite a allowlist se a violacao for decisao consciente,');
console.error('e nesse caso registre o motivo na dívida correspondente do CONTEXT.md.');
process.exit(1);
