import { EntidadeBaseInterface } from './entidade-base.interface';

export interface DisciplinaInterface extends EntidadeBaseInterface {
  nome: string;
  ativo: boolean;
}
