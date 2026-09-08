import { OpcoesCacheMemoria } from '../interfaces/infra/opcoes-cache-memoria.interface';
import { CacheMemoria } from './cache-memoria';

const criarCache = (opcoes: Partial<OpcoesCacheMemoria> = {}) =>
  new CacheMemoria<string>({
    ttlMs: 60_000,
    limite: 3,
    ...opcoes,
  });

describe('CacheMemoria: validade e teto do cache de sugestões', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 8, 8));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('leitura e gravação', () => {
    it('chave nunca gravada devolve null', () => {
      const cache = criarCache();

      expect(cache.get('ana')).toBeNull();
    });

    it('grava e devolve o valor', () => {
      const cache = criarCache();

      cache.set('ana', 'Ana Souza');

      expect(cache.get('ana')).toBe('Ana Souza');
    });

    it('a chave é exata: outro termo não lê o valor do primeiro', () => {
      const cache = criarCache();
      cache.set('ana', 'Ana Souza');

      expect(cache.get('an')).toBeNull();
    });

    it('regravar a mesma chave substitui o valor sem criar entrada nova', () => {
      const cache = criarCache({ limite: 2 });
      cache.set('ana', 'Ana Souza');
      vi.advanceTimersByTime(1);

      cache.set('ana', 'Ana Paula');
      vi.advanceTimersByTime(1);
      cache.set('bruno', 'Bruno Lima');

      expect(cache.get('ana')).toBe('Ana Paula');
      expect(cache.get('bruno')).toBe('Bruno Lima');
    });
  });

  describe('expiração por ttlMs', () => {
    it('exatos ttlMs ainda valem, porque a comparação é > e não >=', () => {
      const cache = criarCache({ ttlMs: 60_000 });
      cache.set('ana', 'Ana Souza');

      vi.advanceTimersByTime(60_000);

      expect(cache.get('ana')).toBe('Ana Souza');
    });

    it('um milissegundo depois do ttlMs devolve null', () => {
      const cache = criarCache({ ttlMs: 60_000 });
      cache.set('ana', 'Ana Souza');

      vi.advanceTimersByTime(60_001);

      expect(cache.get('ana')).toBeNull();
    });

    it('a validade é de cada registro, então a entrada mais nova sobrevive à morte da mais velha', () => {
      const cache = criarCache({ ttlMs: 60_000 });
      cache.set('ana', 'Ana Souza');
      vi.advanceTimersByTime(30_000);
      cache.set('bruno', 'Bruno Lima');

      vi.advanceTimersByTime(30_001);

      expect(cache.get('ana')).toBeNull();
      expect(cache.get('bruno')).toBe('Bruno Lima');
    });

    it('regravar a chave renova a validade a partir da nova gravação', () => {
      const cache = criarCache({ ttlMs: 60_000 });
      cache.set('ana', 'Ana Souza');
      vi.advanceTimersByTime(59_000);
      cache.set('ana', 'Ana Souza');

      vi.advanceTimersByTime(59_000);

      expect(cache.get('ana')).toBe('Ana Souza');
    });
  });

  describe('o teto de entradas', () => {
    it('enquanto cabe, não descarta nada', () => {
      const cache = criarCache({ limite: 3 });

      cache.set('ana', 'Ana Souza');
      vi.advanceTimersByTime(1);
      cache.set('bruno', 'Bruno Lima');
      vi.advanceTimersByTime(1);
      cache.set('carla', 'Carla Dias');

      expect(cache.get('ana')).toBe('Ana Souza');
      expect(cache.get('bruno')).toBe('Bruno Lima');
      expect(cache.get('carla')).toBe('Carla Dias');
    });

    it('a entrada seguinte descarta a mais antiga pelo gravadoEm', () => {
      const cache = criarCache({ limite: 3 });
      cache.set('ana', 'Ana Souza');
      vi.advanceTimersByTime(1);
      cache.set('bruno', 'Bruno Lima');
      vi.advanceTimersByTime(1);
      cache.set('carla', 'Carla Dias');
      vi.advanceTimersByTime(1);

      cache.set('davi', 'Davi Melo');

      expect(cache.get('ana')).toBeNull();
      expect(cache.get('davi')).toBe('Davi Melo');
    });

    it('o descarte poupa as entradas mais novas, não esvazia o cache', () => {
      const cache = criarCache({ limite: 3 });
      cache.set('ana', 'Ana Souza');
      vi.advanceTimersByTime(1);
      cache.set('bruno', 'Bruno Lima');
      vi.advanceTimersByTime(1);
      cache.set('carla', 'Carla Dias');
      vi.advanceTimersByTime(1);

      cache.set('davi', 'Davi Melo');

      expect(cache.get('bruno')).toBe('Bruno Lima');
      expect(cache.get('carla')).toBe('Carla Dias');
    });

    it('caracterização: quem sai é a gravação mais antiga, ainda que seja a última lida', () => {
      const cache = criarCache({ limite: 2 });
      cache.set('ana', 'Ana Souza');
      vi.advanceTimersByTime(1);
      cache.set('bruno', 'Bruno Lima');
      vi.advanceTimersByTime(1);
      cache.get('ana');

      cache.set('carla', 'Carla Dias');

      expect(cache.get('ana')).toBeNull();
    });

    it('limite 1 guarda apenas a última gravação', () => {
      const cache = criarCache({ limite: 1 });
      cache.set('ana', 'Ana Souza');
      vi.advanceTimersByTime(1);

      cache.set('bruno', 'Bruno Lima');

      expect(cache.get('ana')).toBeNull();
      expect(cache.get('bruno')).toBe('Bruno Lima');
    });
  });

  describe('limpar', () => {
    it('limpar apaga toda entrada válida', () => {
      const cache = criarCache();
      cache.set('ana', 'Ana Souza');
      cache.set('bruno', 'Bruno Lima');

      cache.limpar();

      expect(cache.get('ana')).toBeNull();
      expect(cache.get('bruno')).toBeNull();
    });

    it('depois de limpar, o cache volta a aceitar até o limite sem descartar', () => {
      const cache = criarCache({ limite: 2 });
      cache.set('ana', 'Ana Souza');
      vi.advanceTimersByTime(1);
      cache.set('bruno', 'Bruno Lima');

      cache.limpar();
      cache.set('carla', 'Carla Dias');
      vi.advanceTimersByTime(1);
      cache.set('davi', 'Davi Melo');

      expect(cache.get('carla')).toBe('Carla Dias');
      expect(cache.get('davi')).toBe('Davi Melo');
    });
  });
});
