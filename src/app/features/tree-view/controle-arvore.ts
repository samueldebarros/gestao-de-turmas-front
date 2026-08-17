import { signal } from '@angular/core';
import { ChaveNo, EventoArvore, NoArvore } from '../../shared/interfaces/ui/no-arvore.interface';

export class ControleArvore<T> {
  private readonly abertos = signal<ReadonlySet<ChaveNo>>(new Set<ChaveNo>());

  readonly expandidos = this.abertos.asReadonly();

  constructor(
    private readonly carregar: (no: NoArvore<T>) => void,
    private readonly selecionar: (no: NoArvore<T>) => void,
  ) {}

  aoEvento(evento: EventoArvore<T>): void {
    if (evento.tipo === 'selecionou') {
      this.selecionar(evento.no);
      return;
    }
    if (this.colapsou(evento.no)) return;
    this.carregar(evento.no);
  }

  expandirTudo(nos: readonly NoArvore<T>[]): void {
    const chaves = new Set<ChaveNo>();

    const visitar = (irmaos: readonly NoArvore<T>[]): void => {
      for (const no of irmaos) {
        if (no.filhos.status === 'folha') continue;
        chaves.add(no.chave);
        this.carregar(no);
        if (no.filhos.status === 'pronto') visitar(no.filhos.filhos);
      }
    };

    visitar(nos);
    this.abertos.set(chaves);
  }

  colapsarTudo(): void {
    this.abertos.set(new Set<ChaveNo>());
  }

  private colapsou(no: NoArvore<T>): boolean {
    const chaves = new Set(this.abertos());

    if (chaves.has(no.chave) && no.filhos.status !== 'erro') {
      chaves.delete(no.chave);
      this.abertos.set(chaves);
      return true;
    }

    chaves.add(no.chave);
    this.abertos.set(chaves);
    return false;
  }
}
