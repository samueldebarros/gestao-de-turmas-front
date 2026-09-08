import { CacheStorage, OpcoesCache } from './cache-storage';

const criarCache = (opcoes: Partial<OpcoesCache> = {}) =>
  new CacheStorage<string[]>({
    storage: sessionStorage,
    namespace: 'sugestoes',
    versao: 1,
    ttlMs: 60_000,
    limite: 20,
    ...opcoes,
  });

const storageQueRecusaEscrita = (): Storage => ({
  length: 0,
  clear: () => undefined,
  getItem: () => null,
  key: () => null,
  removeItem: () => undefined,
  setItem: () => {
    throw new Error('QuotaExceededError');
  },
});

const storageComQuotaEstourada = (inicial: Record<string, string> = {}): Storage => {
  const dados = new Map(Object.entries(inicial));

  return {
    get length() {
      return dados.size;
    },
    clear: () => dados.clear(),
    getItem: (chave: string) => dados.get(chave) ?? null,
    key: (indice: number) => [...dados.keys()][indice] ?? null,
    removeItem: (chave: string) => {
      dados.delete(chave);
    },
    setItem: (chave: string, valor: string) => {
      if (chave.endsWith('__teste__')) {
        dados.set(chave, valor);
        return;
      }
      throw new Error('QuotaExceededError');
    },
  };
};

describe('CacheStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 7, 10));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('escrita e leitura', () => {
    it('chave nunca gravada devolve null', () => {
      expect(criarCache().get('ma')).toBeNull();
    });

    it('grava e devolve o valor', () => {
      const cache = criarCache();

      cache.set('ma', ['Maria', 'Marcos']);

      expect(cache.get('ma')).toEqual(['Maria', 'Marcos']);
    });

    it('outra instância com as mesmas opções lê o que a primeira gravou', () => {
      criarCache().set('ma', ['Maria']);

      expect(criarCache().get('ma')).toEqual(['Maria']);
    });
  });

  describe('a fronteira do TTL é estrita', () => {
    it('exatos ttlMs ainda valem, porque a comparação é > e não >=', () => {
      const cache = criarCache({ ttlMs: 60_000 });
      cache.set('ma', ['Maria']);

      vi.advanceTimersByTime(60_000);

      expect(cache.get('ma')).toEqual(['Maria']);
    });

    it('um milissegundo depois do ttlMs devolve null', () => {
      const cache = criarCache({ ttlMs: 60_000 });
      cache.set('ma', ['Maria']);

      vi.advanceTimersByTime(60_001);

      expect(cache.get('ma')).toBeNull();
    });

    it('a leitura expirada apaga a chave, não só devolve null', () => {
      const cache = criarCache({ ttlMs: 60_000 });
      cache.set('ma', ['Maria']);
      vi.advanceTimersByTime(60_001);

      cache.get('ma');

      expect(sessionStorage.getItem('sugestoes:v1:ma')).toBeNull();
    });
  });

  describe('namespace', () => {
    it('limpar remove as chaves do próprio namespace', () => {
      const cache = criarCache();
      cache.set('ma', ['Maria']);
      cache.set('jo', ['João']);

      cache.limpar();

      expect(cache.get('ma')).toBeNull();
      expect(cache.get('jo')).toBeNull();
    });

    it('limpar não toca em chave de outro namespace', () => {
      const cache = criarCache();
      cache.set('ma', ['Maria']);
      sessionStorage.setItem('outro:v1:x', '1');

      cache.limpar();

      expect(sessionStorage.getItem('outro:v1:x')).toBe('1');
    });
  });

  describe('versão como invalidação', () => {
    it('versão nova não lê o que a antiga gravou', () => {
      criarCache().set('ma', ['Maria']);

      expect(criarCache({ versao: 2 }).get('ma')).toBeNull();
    });

    it('a entrada da versão antiga continua no storage, órfã', () => {
      criarCache().set('ma', ['Maria']);

      criarCache({ versao: 2 }).get('ma');

      expect(sessionStorage.getItem('sugestoes:v1:ma')).not.toBeNull();
    });
  });

  describe('limite de entradas', () => {
    it('enquanto cabe, não descarta nada', () => {
      const cache = criarCache({ limite: 2 });

      cache.set('a', ['A']);
      cache.set('b', ['B']);

      expect(cache.get('a')).toEqual(['A']);
      expect(cache.get('b')).toEqual(['B']);
    });

    it('a entrada seguinte descarta a mais antiga pelo gravadoEm', () => {
      const cache = criarCache({ limite: 2 });
      cache.set('a', ['A']);
      vi.advanceTimersByTime(1_000);
      cache.set('b', ['B']);
      vi.advanceTimersByTime(1_000);

      cache.set('c', ['C']);

      expect(cache.get('a')).toBeNull();
      expect(cache.get('b')).toEqual(['B']);
      expect(cache.get('c')).toEqual(['C']);
    });

    it('entradas de versões anteriores ocupam o limite e são descartadas primeiro', () => {
      criarCache({ limite: 2 }).set('a', ['A']);
      vi.advanceTimersByTime(1_000);
      const v2 = criarCache({ versao: 2, limite: 2 });
      v2.set('b', ['B']);
      vi.advanceTimersByTime(1_000);

      v2.set('c', ['C']);

      expect(sessionStorage.getItem('sugestoes:v1:a')).toBeNull();
      expect(v2.get('b')).toEqual(['B']);
      expect(v2.get('c')).toEqual(['C']);
    });
  });

  describe('entrada corrompida', () => {
    it('JSON inválido devolve null e apaga a chave', () => {
      const cache = criarCache();
      sessionStorage.setItem('sugestoes:v1:ma', 'isto não é json');

      const valor = cache.get('ma');

      expect(valor).toBeNull();
      expect(sessionStorage.getItem('sugestoes:v1:ma')).toBeNull();
    });

    it('entrada corrompida encontrada durante o descarte também é removida', () => {
      const cache = criarCache({ limite: 2 });
      sessionStorage.setItem('sugestoes:v1:lixo', 'isto não é json');
      cache.set('a', ['A']);

      cache.set('b', ['B']);

      expect(sessionStorage.getItem('sugestoes:v1:lixo')).toBeNull();
      expect(cache.get('b')).toEqual(['B']);
    });
  });

  describe('storage indisponível', () => {
    it('get devolve null e nem chega a consultar o storage', () => {
      const storage = storageQueRecusaEscrita();
      const getItem = vi.spyOn(storage, 'getItem');

      const valor = criarCache({ storage }).get('ma');

      expect(valor).toBeNull();
      expect(getItem).not.toHaveBeenCalled();
    });

    it('set não estoura quando o storage recusa a escrita', () => {
      const cache = criarCache({ storage: storageQueRecusaEscrita() });

      expect(() => cache.set('ma', ['Maria'])).not.toThrow();
    });
  });

  describe('quota estourada com o storage disponível', () => {
    it('o set sacrifica o próprio namespace para abrir espaço, e só o próprio', () => {
      const storage = storageComQuotaEstourada({
        'sugestoes:v1:ja': '{"valor":["Janaína"],"gravadoEm":0}',
        'outro:v1:x': '1',
      });
      const cache = criarCache({ storage });

      cache.set('ma', ['Maria']);

      expect(storage.getItem('sugestoes:v1:ja')).toBeNull();
      expect(storage.getItem('outro:v1:x')).toBe('1');
    });
  });
});
