import { ChaveNo, NoArvore } from '../interfaces/ui/no-arvore.interface';

export function folhasDe<T>(no: NoArvore<T>): ChaveNo[] {
  if (no.filhos.status === 'folha') return [no.chave];
  if (no.filhos.status !== 'pronto') return [];

  return no.filhos.filhos.flatMap((filho) => folhasDe(filho));
}
