export interface TabelaColuna {
  chave: string;
  titulo: string;
  formatador?: (valor: any) => string;
  cssClassCabecalho?: string;
  cssClassCelula?: (valor: any) => string;
}
