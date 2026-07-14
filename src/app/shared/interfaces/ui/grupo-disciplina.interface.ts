import { DocenteSqlInterface } from '../entities/docente-sql.interface';

export interface GrupoDisciplinaInterface {
  disciplinaNome: string;
  docentes: DocenteSqlInterface[];
}
