import { DocenteSqlInterface } from '../interfaces/entities/docente-sql.interface';
import { LocalidadeInterface } from '../interfaces/entities/localidade.interface';
import { TurmaInterface } from '../interfaces/entities/turma.interface';
import { ChaveNo } from '../interfaces/ui/no-arvore.interface';

export const chaveTurmaDocentes = (turma: TurmaInterface): ChaveNo => `/turma:${turma.id}`;

export const chaveDocente = (chaveTurma: ChaveNo, docente: DocenteSqlInterface): ChaveNo =>
  `${chaveTurma}/docente:${docente.id}/disciplina:${docente.disciplinaNome}`;

export const chaveLocalidade = (chavePai: ChaveNo, local: LocalidadeInterface): ChaveNo =>
  `${chavePai}/${local.nivel}:${local.id}`;
