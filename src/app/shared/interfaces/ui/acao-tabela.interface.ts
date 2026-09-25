import { ConfirmacaoAcao } from './confirmacao-acao.interface';

export interface AcaoTabela {
  id: string;
  rotulo: string;
  varianteBotao: string;
  condicaoVisibilidade?: (item: any) => boolean;
  confirmacao?: (item: any) => ConfirmacaoAcao;
  desabilitada?: (item: any) => boolean;
}
