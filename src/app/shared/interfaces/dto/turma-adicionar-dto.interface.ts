import { TurnoEnum } from '../../enums/turno.enum';

export interface TurmaAdicionarDTO {
  identificador: string;
  serie: number;
  anoLetivo: number;
  turno: TurnoEnum;
  capacidade: number;
  alocacoes: number[];
  alunosIds: number[];
}
