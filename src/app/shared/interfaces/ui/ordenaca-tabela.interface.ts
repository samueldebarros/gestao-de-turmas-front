import { DirecaoOrdenacaoEnum } from '../../enums/direcao-ordenacao.enum';

export interface OrdenacaoTabela {
  campo: number;
  direcao: DirecaoOrdenacaoEnum;
}
