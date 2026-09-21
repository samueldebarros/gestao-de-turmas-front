export type EstadoCarga<T> =
  | { status: 'carregando' }
  | { status: 'ok'; itens: T[] }
  | { status: 'erro' };
