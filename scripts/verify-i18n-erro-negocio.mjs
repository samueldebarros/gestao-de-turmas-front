import { existsSync, readFileSync } from 'node:fs';

const ARQUIVO_PT = 'public/i18n/pt-BR.json';
const ARQUIVO_EN = 'public/i18n/en.json';
const NAMESPACE = 'ERRO_NEGOCIO';

const CHAVES_ESPERADAS = [
  'TURMA_COMBINACAO_DUPLICADA',
  'TURMA_ALOCACAO_DOCENTE_INVALIDA',
  'TURMA_DOCENTE_DUPLICADO_NA_DISCIPLINA',
  'TURMA_CAPACIDADE_MENOR_QUE_ATIVOS',
  'TURMA_INATIVAR_COM_ALUNOS_ATIVOS',
  'TURMA_INATIVA_NAO_MATRICULA',
  'TURMA_CAPACIDADE_ATINGIDA',
  'TURMA_INATIVA_NAO_ALTERA_MATRICULA',
  'TURMA_INATIVA_NAO_ALTERA_ALOCACAO',
  'DOCENTE_INATIVO_NAO_ALOCAVEL',
  'DOCENTE_SEM_DISCIPLINA',
  'DATA_NASCIMENTO_FUTURA',
  'DATA_NASCIMENTO_IDADE_EXCESSIVA',
  'EMAIL_EM_USO',
  'ALUNO_MATRICULA_NAO_GERADA',
  'SEXO_OBRIGATORIO',
  'DOCENTE_IDADE_MINIMA',
  'DISCIPLINA_INEXISTENTE_OU_INATIVA',
  'CPF_INVALIDO',
  'CPF_EM_USO',
];

function lerJson(caminho) {
  if (!existsSync(caminho)) {
    throw new Error(`o arquivo ${caminho} nao existe`);
  }
  return JSON.parse(readFileSync(caminho, 'utf8'));
}

let pt;
let en;

try {
  pt = lerJson(ARQUIVO_PT);
  en = lerJson(ARQUIVO_EN);
} catch (erro) {
  console.error(`verify:i18n NAO CONSEGUIU RODAR: ${erro.message}`);
  process.exit(2);
}

const falhas = [];

const namespacePt = pt[NAMESPACE];
const namespaceEn = en[NAMESPACE];

if (namespacePt && typeof namespacePt === 'object') {
  console.log(`[namespace] ok — ${NAMESPACE} existe em ${ARQUIVO_PT}`);
} else {
  console.log(`[namespace] REPROVOU — ${NAMESPACE} nao existe em ${ARQUIVO_PT}`);
  falhas.push(`${NAMESPACE} ausente em ${ARQUIVO_PT}`);
}

if (namespaceEn && typeof namespaceEn === 'object') {
  console.log(`[namespace] ok — ${NAMESPACE} existe em ${ARQUIVO_EN}`);
} else {
  console.log(`[namespace] REPROVOU — ${NAMESPACE} nao existe em ${ARQUIVO_EN}`);
  falhas.push(`${NAMESPACE} ausente em ${ARQUIVO_EN}`);
}

const chavesPt = new Set(Object.keys(namespacePt ?? {}));
const chavesEn = new Set(Object.keys(namespaceEn ?? {}));

const faltandoEmEn = [...chavesPt].filter((chave) => !chavesEn.has(chave));
const faltandoEmPt = [...chavesEn].filter((chave) => !chavesPt.has(chave));

if (faltandoEmEn.length === 0 && faltandoEmPt.length === 0) {
  console.log(`[paridade] ok — mesmo conjunto de chaves em ${ARQUIVO_PT} e ${ARQUIVO_EN}`);
} else {
  console.log('[paridade] REPROVOU — conjuntos de chaves divergem entre os dois idiomas');
  if (faltandoEmEn.length > 0) {
    falhas.push(`faltando em ${ARQUIVO_EN}: ${faltandoEmEn.join(', ')}`);
  }
  if (faltandoEmPt.length > 0) {
    falhas.push(`faltando em ${ARQUIVO_PT}: ${faltandoEmPt.join(', ')}`);
  }
}

const ausentesPt = CHAVES_ESPERADAS.filter((chave) => !chavesPt.has(chave));
const ausentesEn = CHAVES_ESPERADAS.filter((chave) => !chavesEn.has(chave));

if (ausentesPt.length === 0 && ausentesEn.length === 0) {
  console.log('[completude] ok — as 20 chaves esperadas estao presentes nos dois arquivos');
} else {
  console.log('[completude] REPROVOU — falta chave esperada');
  if (ausentesPt.length > 0) {
    falhas.push(`ausentes em ${ARQUIVO_PT}: ${ausentesPt.join(', ')}`);
  }
  if (ausentesEn.length > 0) {
    falhas.push(`ausentes em ${ARQUIVO_EN}: ${ausentesEn.join(', ')}`);
  }
}

const vaziosPt = [...chavesPt].filter((chave) => !String(namespacePt[chave] ?? '').trim());
const vaziosEn = [...chavesEn].filter((chave) => !String(namespaceEn[chave] ?? '').trim());

if (vaziosPt.length === 0 && vaziosEn.length === 0) {
  console.log('[valor] ok — nenhum valor vazio em ERRO_NEGOCIO');
} else {
  console.log('[valor] REPROVOU — ha chave com valor vazio');
  if (vaziosPt.length > 0) {
    falhas.push(`valor vazio em ${ARQUIVO_PT}: ${vaziosPt.join(', ')}`);
  }
  if (vaziosEn.length > 0) {
    falhas.push(`valor vazio em ${ARQUIVO_EN}: ${vaziosEn.join(', ')}`);
  }
}

if (falhas.length > 0) {
  console.error('\nverify:i18n REPROVOU:\n');
  for (const falha of falhas) {
    console.error(`  ${falha}`);
  }
  process.exit(1);
}

console.log('\nverify:i18n — ERRO_NEGOCIO em paridade nos dois idiomas.');
process.exit(0);
