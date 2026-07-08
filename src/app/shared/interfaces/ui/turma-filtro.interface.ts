import { TurnoEnum } from '../../enums/turno.enum';

export interface TurmaFiltro {
  pagina: number;
  tamanhoPagina: number;
  pesquisa: string;
  anoLetivo: number | null;
  turno: TurnoEnum | null;
  ativo: boolean | null;
}
