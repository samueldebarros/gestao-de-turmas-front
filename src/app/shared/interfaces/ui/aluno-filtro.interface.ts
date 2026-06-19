import { SexoEnum } from '../../enums/sexo.enum';

export interface AlunoFiltro {
  pagina: number;
  tamanhoPagina: number;
  pesquisa: string;
  sexo: SexoEnum | null;
  ativo: boolean | null;
}
