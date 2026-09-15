import { FormControl } from '@angular/forms';
import { primeiroErroDe } from './primeiro-erro-de.util';

describe('primeiroErroDe', () => {
  it('controle null devolve null', () => {
    expect(primeiroErroDe(null)).toBeNull();
  });

  it('controle undefined devolve null', () => {
    expect(primeiroErroDe(undefined)).toBeNull();
  });

  it('controle válido, sem erros, devolve null', () => {
    const controle = new FormControl('ok');

    expect(primeiroErroDe(controle)).toBeNull();
  });

  it('controle com um erro devolve a chave e o detalhe', () => {
    const controle = new FormControl('', { validators: () => ({ required: true }) });
    controle.updateValueAndValidity();

    expect(primeiroErroDe(controle)).toEqual({ chave: 'required', detalhe: true });
  });

  it('controle com dois erros: a primeira chave declarada vence', () => {
    const controle = new FormControl('', {
      validators: () => ({ segundo: 'b', primeiro: 'a' }),
    });
    controle.updateValueAndValidity();

    expect(primeiroErroDe(controle)).toEqual({ chave: 'segundo', detalhe: 'b' });
  });

  it('erro cujo valor é objeto devolve o detalhe intacto', () => {
    const detalheEsperado = { max: 255, actual: 300 };
    const controle = new FormControl(300, {
      validators: () => ({ max: detalheEsperado }),
    });
    controle.updateValueAndValidity();

    expect(primeiroErroDe(controle)).toEqual({ chave: 'max', detalhe: detalheEsperado });
  });
});
