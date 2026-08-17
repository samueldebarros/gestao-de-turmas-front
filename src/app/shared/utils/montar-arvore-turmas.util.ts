import { AlunoInterface } from '../interfaces/entities/aluno.interface';
import { TurmaInterface } from '../interfaces/entities/turma.interface';
import { IndiceFilhos, NoAgrupamento } from '../interfaces/ui/arvore-escolar.interface';
import { ChaveNo, NoArvore } from '../interfaces/ui/no-arvore.interface';
import { eAluno } from './entidade-arvore.util';
import { traduzirFilhos } from './traduzir-filhos.util';

type RotuloSerie = (serie: number) => string;

export function montarArvoreTurmas(
  turmas: TurmaInterface[],
  indice: IndiceFilhos,
  rotuloSerie: RotuloSerie,
): NoArvore<NoAgrupamento>[] {
  const porAno = agrupar(turmas, (turma) => turma.anoLetivo);

  return Array.from(porAno, ([ano, doAno]) => noAno(ano, doAno, indice, rotuloSerie));
}

function noAno(
  ano: number,
  turmas: TurmaInterface[],
  indice: IndiceFilhos,
  rotuloSerie: RotuloSerie,
): NoArvore<NoAgrupamento> {
  const chave = `/ano:${ano}`;
  const porSerie = agrupar(turmas, (turma) => turma.serie);

  return {
    chave,
    rotulo: String(ano),
    entidade: { titulo: String(ano) },
    filhos: {
      status: 'pronto',
      filhos: Array.from(porSerie, ([serie, daSerie]) =>
        noSerie(chave, serie, daSerie, indice, rotuloSerie),
      ),
    },
  };
}

function noSerie(
  chaveAno: ChaveNo,
  serie: number,
  turmas: TurmaInterface[],
  indice: IndiceFilhos,
  rotuloSerie: RotuloSerie,
): NoArvore<NoAgrupamento> {
  const chave = `${chaveAno}/serie:${serie}`;
  const rotulo = rotuloSerie(serie);

  return {
    chave,
    rotulo,
    entidade: { titulo: rotulo },
    filhos: {
      status: 'pronto',
      filhos: turmas.map((turma) => noTurma(chave, turma, indice)),
    },
  };
}

function noTurma(
  chaveSerie: ChaveNo,
  turma: TurmaInterface,
  indice: IndiceFilhos,
): NoArvore<NoAgrupamento> {
  const chave = `${chaveSerie}/turma:${turma.id}`;

  return {
    chave,
    rotulo: `${turma.identificador} · ${turma.totalAlunos}/${turma.capacidade}`,
    entidade: turma,
    filhos: traduzirFilhos(indice.get(chave), (filhos) =>
      filhos.filter(eAluno).map((aluno) => noAluno(chave, aluno)),
    ),
  };
}

function noAluno(chaveTurma: ChaveNo, aluno: AlunoInterface): NoArvore<NoAgrupamento> {
  return {
    chave: `${chaveTurma}/aluno:${aluno.id}`,
    rotulo: `${aluno.matricula} · ${aluno.nome}`,
    entidade: aluno,
    filhos: { status: 'folha' },
  };
}

function agrupar<T>(itens: T[], chave: (item: T) => number): Map<number, T[]> {
  const mapa = new Map<number, T[]>();
  for (const item of itens) {
    const grupo = mapa.get(chave(item)) ?? [];
    grupo.push(item);
    mapa.set(chave(item), grupo);
  }
  return mapa;
}
