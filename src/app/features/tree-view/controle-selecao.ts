import { signal } from '@angular/core';
import { ChaveNo, ModoSelecao } from '../../shared/interfaces/ui/no-arvore.interface';

export class ControleSelecao {
  private readonly escolhidas = signal<ReadonlySet<ChaveNo>>(new Set<ChaveNo>());

  readonly selecionadas = this.escolhidas.asReadonly();

  selecionar(chave: ChaveNo, alternar: boolean, modo: ModoSelecao): void {
    if (modo == 'simples' || !alternar) {
      this.escolhidas.set(new Set([chave]));
      return;
    }

    const chaves = new Set(this.escolhidas());

    if (chaves.has(chave)) chaves.delete(chave);
    else chaves.add(chave);

    this.escolhidas.set(chaves);
  }

  limpar(): void {
    this.escolhidas.set(new Set<ChaveNo>());
  }
}
