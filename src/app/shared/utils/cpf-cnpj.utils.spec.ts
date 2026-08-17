import { formatarCpfCnpj, mascararCpfCnpj } from './cpf-cnpj.utils';

describe('formatarCpfCnpj', () => {
  describe('documento reconhecido pelo comprimento', () => {
    it('aplica a máscara de CPF em onze dígitos', () => {
      expect(formatarCpfCnpj('52998224725')).toBe('529.982.247-25');
    });

    it('aplica a máscara de CNPJ em catorze dígitos', () => {
      expect(formatarCpfCnpj('11222333000181')).toBe('11.222.333/0001-81');
    });

    it.each([
      { rotulo: 'CPF', valor: '529.982.247-25' },
      { rotulo: 'CNPJ', valor: '11.222.333/0001-81' },
    ])('mantém o $rotulo inalterado quando ele já vem mascarado', ({ valor }) => {
      expect(formatarCpfCnpj(valor)).toBe(valor);
    });
  });

  describe('ausência de valor', () => {
    it.each([
      { rotulo: 'string vazia', valor: '' },
      { rotulo: 'null', valor: null },
      { rotulo: 'undefined', valor: undefined },
    ])('devolve string vazia para $rotulo', ({ valor }) => {
      expect(formatarCpfCnpj(valor)).toBe('');
    });
  });

  describe('comprimento inesperado', () => {
    it('devolve o valor original, sem máscara e sem limpar os separadores', () => {
      expect(formatarCpfCnpj('12.3')).toBe('12.3');
    });
  });
});

describe('mascararCpf', () => {
  describe('CPF', () => {
    it.each([
      { rotulo: 'sem separadores', valor: '52998224725' },
      { rotulo: 'já formatado', valor: '529.982.247-25' },
    ])('oculta início e fim quando o CPF vem $rotulo', ({ valor }) => {
      expect(mascararCpfCnpj(valor)).toBe('***.982.247-**');
    });

    it('não expõe os dígitos verificadores', () => {
      expect(mascararCpfCnpj('52998224725')).not.toContain('25');
    });
  });

  describe('CNPJ', () => {
    it.each([
      { rotulo: 'sem separadores', valor: '11222333000181' },
      { rotulo: 'já formatado', valor: '11.222.333/0001-81' },
    ])('oculta início e fim quando o CNPJ vem $rotulo', ({ valor }) => {
      expect(mascararCpfCnpj(valor)).toBe('**.222.333/0001-**');
    });

    it('não expõe os dígitos verificadores', () => {
      expect(mascararCpfCnpj('11222333000181')).not.toContain('81');
    });
  });

  describe('comprimento inesperado', () => {
    it('devolve o valor original, porque dado sujo precisa ser diagnosticável', () => {
      expect(mascararCpfCnpj('12.3')).toBe('12.3');
    });
  });

  describe('ausência de valor', () => {
    it.each([
      { rotulo: 'string vazia', valor: '' },
      { rotulo: 'null', valor: null },
      { rotulo: 'undefined', valor: undefined },
    ])('devolve string vazia para $rotulo', ({ valor }) => {
      expect(mascararCpfCnpj(valor)).toBe('');
    });
  });
});
