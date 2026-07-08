import { ResultadoPaginado } from './resultado-paginado.interface';

export type EstadoLista<T> =
  | { status: 'carregando' }
  | { status: 'ok'; resultado: ResultadoPaginado<T> }
  | { status: 'erro' };
