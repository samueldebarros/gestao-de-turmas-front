import { EntidadeBaseInterface } from './entidade-base.interface';

export interface AlunoDisponivelInterface extends EntidadeBaseInterface {
  matricula: string;
  nome: string;
}
