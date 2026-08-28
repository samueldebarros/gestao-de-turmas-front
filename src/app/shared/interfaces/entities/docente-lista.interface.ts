import { EntidadeBaseInterface } from './entidade-base.interface';

export interface DocenteListaInterface extends EntidadeBaseInterface {
  nome: string;
  email: string | null;
  disciplinaNome: string | null;
  ativo: boolean;
}
