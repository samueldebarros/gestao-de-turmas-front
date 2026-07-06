interface RegistroCache<T> {
  valor: T;
  gravadoEm: number;
}

export interface OpcoesCache {
  storage: Storage;
  namespace: string;
  versao: number;
  ttlMs: number;
  limite: number;
}

export class CacheStorage<T> {
  private readonly prefixo: string;
  private readonly disponivel: boolean;

  constructor(private readonly opcoes: OpcoesCache) {
    this.prefixo = `${opcoes.namespace}:`;
    this.disponivel = this.testarDisponibilidade(opcoes.storage);
  }

  get(chave: string): T | null {
    if (!this.disponivel) return null;
    const chaveCompleta = this.chaveCompleta(chave);
    const bruto = this.opcoes.storage.getItem(chaveCompleta);
    if (!bruto) return null;
    try {
      const registro = JSON.parse(bruto) as RegistroCache<T>;
      if (Date.now() - registro.gravadoEm > this.opcoes.ttlMs) {
        this.opcoes.storage.removeItem(chaveCompleta);
        return null;
      }
      return registro.valor;
    } catch {
      this.opcoes.storage.removeItem(chaveCompleta);
      return null;
    }
  }

  set(chave: string, valor: T): void {
    if (!this.disponivel) return;
    this.aplicarLimite();
    const registro: RegistroCache<T> = { valor, gravadoEm: Date.now() };
    try {
      this.opcoes.storage.setItem(this.chaveCompleta(chave), JSON.stringify(registro));
    } catch {
      this.limpar();
    }
  }

  limpar(): void {
    if (!this.disponivel) return;
    for (const chave of this.chavesDoNamespace()) {
      this.opcoes.storage.removeItem(chave);
    }
  }

  private aplicarLimite(): void {
    const chaves = this.chavesDoNamespace();
    if (chaves.length < this.opcoes.limite) return;
    let maisAntiga: string | null = null;
    let menorTempo = Infinity;
    for (const chave of chaves) {
      const bruto = this.opcoes.storage.getItem(chave);
      if (!bruto) continue;
      try {
        const { gravadoEm } = JSON.parse(bruto) as RegistroCache<T>;
        if (gravadoEm < menorTempo) {
          menorTempo = gravadoEm;
          maisAntiga = chave;
        }
      } catch {
        this.opcoes.storage.removeItem(chave);
      }
    }
    if (maisAntiga) this.opcoes.storage.removeItem(maisAntiga);
  }

  private chavesDoNamespace(): string[] {
    const chaves: string[] = [];
    for (let i = 0; i < this.opcoes.storage.length; i++) {
      const chave = this.opcoes.storage.key(i);
      if (chave?.startsWith(this.prefixo)) chaves.push(chave);
    }
    return chaves;
  }

  private chaveCompleta(chave: string): string {
    return `${this.prefixo}v${this.opcoes.versao}:${chave}`;
  }

  private testarDisponibilidade(storage: Storage): boolean {
    try {
      const teste = `${this.prefixo}__teste__`;
      storage.setItem(teste, '1');
      storage.removeItem(teste);
      return true;
    } catch {
      return false;
    }
  }
}
