import { signal } from '@angular/core';
import { ChaveNo, NoArvore } from '../../shared/interfaces/ui/no-arvore.interface';
import { folhasDe } from '../../shared/utils/folhas-de.util';

export class ControleMarcacao {
  private readonly marcadas = signal<ReadonlySet<ChaveNo>>(new Set<ChaveNo>());

  readonly marcados = this.marcadas.asReadonly();

  alternar<T>(no: NoArvore<T>, marcar: boolean): void {
    const folhas = folhasDe(no);

    if (folhas.length === 0) return;

    const chaves = new Set(this.marcadas());

    for (const folha of folhas) {
      if (marcar) chaves.add(folha);
      else chaves.delete(folha);
    }

    this.marcadas.set(chaves);
  }
}
