export interface LinhaImportacao<T> {
  dados: T;
  valida: boolean;
  motivo?: string;
}
