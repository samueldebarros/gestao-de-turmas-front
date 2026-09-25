import { EntidadeBaseInterface } from './entidade-base.interface';

export interface DocenteSqlInterface extends EntidadeBaseInterface {
  docenteNome: string;
  docenteEmail: string | null;
  disciplinaId: number;
  disciplinaNome: string;
  cargaHoraria: number;
}
