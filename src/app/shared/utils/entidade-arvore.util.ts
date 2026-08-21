import { DocenteSqlInterface } from '../interfaces/entities/docente-sql.interface';
import { TurmaInterface } from '../interfaces/entities/turma.interface';
import { EntidadeArvore } from '../interfaces/ui/arvore-escolar.interface';

export const eTurma = (entidade: EntidadeArvore): entidade is TurmaInterface =>
  'identificador' in entidade;

export const eDocente = (entidade: EntidadeArvore): entidade is DocenteSqlInterface =>
  'disciplinaNome' in entidade;
