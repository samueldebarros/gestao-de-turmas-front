export interface ResultadoPaginado<T> {
  itens: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalResultados: number;
  tamanhoPagina: number;
}
