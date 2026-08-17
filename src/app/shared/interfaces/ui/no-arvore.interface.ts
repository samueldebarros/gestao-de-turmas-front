export type ChaveNo = string;

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
  | { tipo: 'selecionou'; no: NoArvore<T> };
