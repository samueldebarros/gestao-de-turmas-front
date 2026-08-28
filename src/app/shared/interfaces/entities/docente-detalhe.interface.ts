import { EntidadeBaseInterface } from './entidade-base.interface';

export interface DocenteDetalheInterface extends EntidadeBaseInterface {
  nome: string;
  email: string | null;
  dataNascimento: string;
  disciplinaId: number | null;
  ativo: boolean;
}
