import { TurnoEnum } from '../../enums/turno.enum';

export type InclusaoTurma = 'docentes' | 'alunos';

export interface TurmaFiltro {
  pagina: number;
  tamanhoPagina: number;
  pesquisa: string;
  anoLetivo: number | null;
  turno: TurnoEnum | null;
  ativo: boolean | null;
  incluir?: string;
}
