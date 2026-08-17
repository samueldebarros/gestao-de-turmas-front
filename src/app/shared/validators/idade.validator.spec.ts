import { FormControl } from '@angular/forms';
import { IdadeValidator } from './idade.validator';

const validar = IdadeValidator.validarIdade();

const HOJE = new Date(2026, 7, 10);
const DATA_DE_HOJE = '2026-08-10';
const DATA_DE_ONTEM = '2026-08-09';
const DATA_FUTURA = '2026-08-25';
const DATA_VALIDA = '1990-05-20';
const LIMITE_DE_120_ANOS = '1906-08-10';
const UM_DIA_ALEM_DO_LIMITE = '1906-08-09';

describe('IdadeValidator.validarIdade', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(HOJE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('fronteira de contrato', () => {
    it.each([
      { rotulo: 'null', valor: null },
      { rotulo: 'string vazia', valor: '' },
    ])('aprova $rotulo, deixando a obrigatoriedade para o Validators.required', ({ valor }) => {
      const control = new FormControl(valor);

      const resultado = validar(control);

      expect(resultado).toBeNull();
    });
  });

  describe('data futura ou presente', () => {
    it('aprova o dia anterior ao de hoje', () => {
      const control = new FormControl(DATA_DE_ONTEM);

      const resultado = validar(control);

      expect(resultado).toBeNull();
    });

    it('reprova data de nascimento igual à data atual', () => {
      const control = new FormControl(DATA_DE_HOJE);

      const resultado = validar(control);

      expect(resultado).toEqual({ dataFuturaOuPresente: true });
    });

    it('reprova data de nascimento posterior à data atual', () => {
      const control = new FormControl(DATA_FUTURA);

      const resultado = validar(control);

      expect(resultado).toEqual({ dataFuturaOuPresente: true });
    });
  });

  describe('idade máxima', () => {
    it('aprova quem completa exatamente 120 anos hoje', () => {
      const control = new FormControl(LIMITE_DE_120_ANOS);

      const resultado = validar(control);

      expect(resultado).toBeNull();
    });

    it('reprova um único dia além do limite de 120 anos', () => {
      const control = new FormControl(UM_DIA_ALEM_DO_LIMITE);

      const resultado = validar(control);

      expect(resultado).toEqual({ idadeMaximaExcedida: true });
    });
  });

  describe('data válida', () => {
    it('aprova data de nascimento dentro do intervalo aceito', () => {
      const control = new FormControl(DATA_VALIDA);

      const resultado = validar(control);

      expect(resultado).toBeNull();
    });
  });

  describe('formato fora do contrato', () => {
    it.each([
      { rotulo: 'data em dd/MM/yyyy', valor: '10/08/2026' },
      { rotulo: 'texto sem estrutura de data', valor: 'abc' },
      { rotulo: 'data incompleta', valor: '1990-05' },
      { rotulo: 'mês e dia impossíveis', valor: '2020-13-45' },
    ])('não julga $rotulo, formato garantido pelo date-picker', ({ valor }) => {
      const control = new FormControl(valor);

      const resultado = validar(control);

      expect(resultado).toBeNull();
    });
  });
});
