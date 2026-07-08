import { TurnoEnum } from '../../enums/turno.enum';
import { EntidadeBaseInterface } from './entidade-base.interface';

export interface TurmaInterface extends EntidadeBaseInterface {
  identificador: string;
  serie: number;
  serieDescricao?: string;
  anoLetivo: number;
  turno: TurnoEnum;
  turnoDescricao?: string;
  totalAlunos: number;
  totalDisciplinas: number;
}
