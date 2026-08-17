import { AlunoInterface } from '../entities/aluno.interface';
import { DocenteSqlInterface } from '../entities/docente-sql.interface';
import { TurmaInterface } from '../entities/turma.interface';
import { ChaveNo } from './no-arvore.interface';

export type EntidadeArvore = TurmaInterface | DocenteSqlInterface | AlunoInterface;

export interface GrupoArvoreInterface {
  titulo: string;
}

export type NoAgrupamento = GrupoArvoreInterface | TurmaInterface | AlunoInterface;

export type EstadoBuscaFilhos =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; filhos: EntidadeArvore[] };

export type IndiceFilhos = ReadonlyMap<ChaveNo, EstadoBuscaFilhos>;
