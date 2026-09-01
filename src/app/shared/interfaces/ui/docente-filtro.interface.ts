import { DirecaoOrdenacaoEnum } from '../../enums/direcao-ordenacao.enum';
import { OrdenacaoDocenteEnum } from '../../enums/ordenacao-docente.enum';

export interface DocenteFiltro {
  pagina: number;
  tamanhoPagina: number;
  pesquisa: string;
  ativo: boolean | null;
  ordenacao: OrdenacaoDocenteEnum | null;
  direcao: DirecaoOrdenacaoEnum | null;
  disciplinaId: number | null;
}
