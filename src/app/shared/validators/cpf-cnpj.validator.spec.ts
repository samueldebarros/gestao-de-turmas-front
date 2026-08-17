import { FormControl } from '@angular/forms';
import { CpfCnpjValidator } from './cpf-cnpj.validator';

const validar = CpfCnpjValidator.validarCpfCnpj();

describe('CpfCnpjValidator - CPF', () => {
  it('aprova CPF com dígitos verificadores corretos', () => {
    const control = new FormControl('12345678909');

    const resultado = validar(control);

    expect(resultado).toBeNull();
  });

  it('reprova CPF com o primeiro dígito verificador trocado', () => {
    const control = new FormControl('12345678919');

    const resultado = validar(control);

    expect(resultado).toEqual({ cpfInvalido: true });
  });

  it('reprova CPF com o segundo dígito verificador trocado', () => {
    const control = new FormControl('12345678900');

    const resultado = validar(control);

    expect(resultado).toEqual({ cpfInvalido: true });
  });

  it('reprova CPF formado por sequência repetida', () => {
    const control = new FormControl('11111111111');

    const resultado = validar(control);

    expect(resultado).toEqual({ cpfInvalido: true });
  });
});

describe('CpfCnpjValidator - CNPJ', () => {
  it('aprova CNPJ com dígitos verificadores corretos', () => {
    const control = new FormControl('11222333000181');

    const resultado = validar(control);

    expect(resultado).toBeNull();
  });

  it('aprova CNPJ cujo dígito verificador é zero por resto menor que dois', () => {
    const control = new FormControl('11222337000160');

    const resultado = validar(control);

    expect(resultado).toBeNull();
  });

  it('reprova CNPJ com o primeiro dígito verificador trocado', () => {
    const control = new FormControl('11222333000191');

    const resultado = validar(control);

    expect(resultado).toEqual({ cnpjInvalido: true });
  });

  it('reprova CNPJ com o segundo dígito verificador trocado', () => {
    const control = new FormControl('11222333000182');

    const resultado = validar(control);

    expect(resultado).toEqual({ cnpjInvalido: true });
  });

  it('reprova CNPJ formado por sequência repetida', () => {
    const control = new FormControl('00000000000000');

    const resultado = validar(control);

    expect(resultado).toEqual({ cnpjInvalido: true });
  });
});

describe('CpfCnpjValidator - roteamento por tamanho', () => {
  it.each([
    { digitos: 10, documento: '1234567890' },
    { digitos: 12, documento: '123456789012' },
    { digitos: 13, documento: '1234567890123' },
    { digitos: 15, documento: '123456789012345' },
  ])('reprova documento com $digitos dígitos sem tentar CPF nem CNPJ', ({ documento }) => {
    const resultado = validar(new FormControl(documento));

    expect(resultado).toEqual({ documentoInvalido: true });
  });
});

describe('CpfCnpjValidator - normalização da entrada', () => {
  it('aprova CPF válido com máscara', () => {
    const control = new FormControl('123.456.789-09');

    const resultado = validar(control);

    expect(resultado).toBeNull();
  });

  it('aprova CNPJ válido com máscara', () => {
    const control = new FormControl('11.222.333/0001-81');

    const resultado = validar(control);

    expect(resultado).toBeNull();
  });

  it('reprova texto sem nenhum dígito, que não é o mesmo que ausência de valor', () => {
    const control = new FormControl('1');

    const resultado = validar(control);

    expect(resultado).toEqual({ documentoInvalido: true });
  });
});

describe('CpfCnpjValidator - fronteira de contrato', () => {
  it.each([
    { rotulo: 'string vazia', valor: '' },
    { rotulo: 'null', valor: null },
  ])('aprova $rotulo, deixando a obrigatoriedade para o Validators.required', ({ valor }) => {
    const resultado = validar(new FormControl(valor));

    expect(resultado).toBeNull();
  });

  it('aprova controle nunca preenchido', () => {
    const control = new FormControl();

    const resultado = validar(control);

    expect(resultado).toBeNull();
  });
});
