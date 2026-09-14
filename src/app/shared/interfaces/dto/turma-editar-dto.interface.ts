import { TurnoEnum } from '../../enums/turno.enum';

export interface TurmaEditarDTO {
  id: number;
  identificador: string;
  serie: number;
  anoLetivo: number;
  turno: TurnoEnum;
  capacidade: number;
}
