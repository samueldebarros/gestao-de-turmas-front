export interface AcaoTabela {
  id: string;
  rotulo: string;
  varianteBotao: string;
  condicaoVisibilidade?: (item: any) => boolean;
}
