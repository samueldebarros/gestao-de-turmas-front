import { EstadoBusca, EstadoFilhos, NoArvore } from '../interfaces/ui/no-arvore.interface';

export function traduzirFilhos<T>(
  estado: EstadoBusca<T> | undefined,
  montar: (filhos: T[]) => NoArvore<T>[],
): EstadoFilhos<T> {
  if (estado === undefined) return { status: 'ocioso' };
  if (estado.status !== 'pronto') return estado;

  return { status: 'pronto', filhos: montar(estado.filhos) };
}
