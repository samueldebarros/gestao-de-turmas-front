import { EntidadeBaseInterface } from './entidade-base.interface';

export interface DocenteSqlInterface extends EntidadeBaseInterface {
  docenteNome: string;
  docenteEmail: string;
  disciplinaNome: string;
  cargaHoraria: number;
}
