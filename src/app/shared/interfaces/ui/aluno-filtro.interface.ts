import { DirecaoOrdenacaoEnum } from '../../enums/direcao-ordenacao.enum';
import { OrdenacaoAlunoEnum } from '../../enums/ordenacao-aluno.enum';
import { SexoEnum } from '../../enums/sexo.enum';

export interface AlunoFiltro {
  pagina: number;
  tamanhoPagina: number;
  pesquisa: string;
  sexo: SexoEnum | null;
  ativo: boolean | null;
  ordenacao: OrdenacaoAlunoEnum | null;
  direcao: DirecaoOrdenacaoEnum | null;
}
