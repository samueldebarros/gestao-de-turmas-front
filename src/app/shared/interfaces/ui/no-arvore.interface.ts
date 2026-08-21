export type ChaveNo = string;

export type ModoSelecao = 'simples' | 'multipla';

export type EstadoMarcacao = 'vazio' | 'desmarcado' | 'parcial' | 'marcado';

export type EstadoBusca<T> =
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; filhos: T[] };

export type Indice<T> = ReadonlyMap<ChaveNo, EstadoBusca<T>>;

export type EstadoFilhos<T> =
  | { status: 'folha' }
  | { status: 'ocioso' }
  | { status: 'carregando' }
  | { status: 'erro' }
  | { status: 'pronto'; filhos: NoArvore<T>[] };

export interface NoArvore<T> {
  chave: ChaveNo;
  rotulo: string;
  entidade: T;
  filhos: EstadoFilhos<T>;
}

export type EventoArvore<T> =
  | { tipo: 'alternou'; no: NoArvore<T> }
  | { tipo: 'selecionou'; no: NoArvore<T>; alternar: boolean };

export interface EventoMarcacao<T> {
  no: NoArvore<T>;
  marcar: boolean;
}
