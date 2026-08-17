import { AlunoInterface } from '../interfaces/entities/aluno.interface';
import { DocenteSqlInterface } from '../interfaces/entities/docente-sql.interface';
import { TurmaInterface } from '../interfaces/entities/turma.interface';
import { EntidadeArvore, NoAgrupamento } from '../interfaces/ui/arvore-escolar.interface';

type EntidadeDeNo = EntidadeArvore | NoAgrupamento;

export const eTurma = (entidade: EntidadeDeNo): entidade is TurmaInterface =>
  'identificador' in entidade;

export const eDocente = (entidade: EntidadeDeNo): entidade is DocenteSqlInterface =>
  'disciplinaNome' in entidade;

export const eAluno = (entidade: EntidadeDeNo): entidade is AlunoInterface =>
  'matricula' in entidade;
