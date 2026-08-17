import { OpcoesCacheMemoria } from '../interfaces/infra/opcoes-cache-memoria.interface';
import { RegistroCacheMemoria } from '../interfaces/infra/registro-cache-memoria.interface';

export class CacheMemoria<T> {
  private readonly registros = new Map<string, RegistroCacheMemoria<T>>();

  constructor(private readonly opcoes: OpcoesCacheMemoria) {}

  get(chave: string): T | null {
    const registro = this.registros.get(chave);
    if (!registro) return null;
    if (Date.now() - registro.gravadoEm > this.opcoes.ttlMs) {
      this.registros.delete(chave);
      return null;
    }
    return registro.valor;
  }

  set(chave: string, valor: T): void {
    this.aplicarLimite();
    this.registros.set(chave, { valor, gravadoEm: Date.now() });
  }

  limpar(): void {
    this.registros.clear();
  }

  private aplicarLimite(): void {
    if (this.registros.size < this.opcoes.limite) return;
    let maisAntiga: string | null = null;
    let menorTempo = Infinity;
    for (const [chave, registro] of this.registros) {
      if (registro.gravadoEm < menorTempo) {
        menorTempo = registro.gravadoEm;
        maisAntiga = chave;
      }
    }
    if (maisAntiga) this.registros.delete(maisAntiga);
  }
}
