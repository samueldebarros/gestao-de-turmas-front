import { FormControl } from '@angular/forms';
import { TextoValidator } from './texto.validator';

const validar = TextoValidator.naoEmBranco();

describe('TextoValidator.naoEmBranco — texto em branco', () => {
  it.each([
    { rotulo: 'espaços', valor: '   ' },
    { rotulo: 'tabulação', valor: '\t\t' },
  ])('reprova texto composto apenas de $rotulo', ({ valor }) => {
    const resultado = validar(new FormControl(valor));

    expect(resultado).toEqual({ emBranco: true });
  });
});

describe('TextoValidator.naoEmBranco — texto com conteúdo', () => {
  it('aprova texto preenchido', () => {
    const control = new FormControl('Maria');

    const resultado = validar(control);

    expect(resultado).toBeNull();
  });

  it('aprova texto com conteúdo cercado de espaços, sem exigir que venha aparado', () => {
    const control = new FormControl('  Maria  ');

    const resultado = validar(control);

    expect(resultado).toBeNull();
  });
});

describe('TextoValidator.naoEmBranco — fronteira de contrato', () => {
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
