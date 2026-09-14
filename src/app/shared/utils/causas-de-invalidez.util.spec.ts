import { FormControl, FormGroup } from '@angular/forms';
import { causasDeInvalidez } from './causas-de-invalidez.util';

const ROTULOS = {
  nome: 'DOMINIO.FORMULARIO.NOME_LABEL',
  idade: 'DOMINIO.FORMULARIO.IDADE_LABEL',
};

describe('causasDeInvalidez', () => {
  it('grupo válido devolve lista vazia', () => {
    const form = new FormGroup({
      nome: new FormControl('Ana'),
    });

    expect(causasDeInvalidez(form, ROTULOS)).toEqual([]);
  });

  it('controle desabilitado inválido não entra na lista', () => {
    const nome = new FormControl('', { validators: () => ({ required: true }) });
    nome.updateValueAndValidity();
    nome.disable();
    const form = new FormGroup({ nome });

    expect(causasDeInvalidez(form, ROTULOS)).toEqual([]);
  });

  it('erro sem chave mapeada em ErrorMessagePipe não entra na lista', () => {
    const nome = new FormControl('', { validators: () => ({ semMapeamento: true }) });
    nome.updateValueAndValidity();
    const form = new FormGroup({ nome });

    expect(causasDeInvalidez(form, ROTULOS)).toEqual([]);
  });

  it('erro com número preenche params a partir de primeiroErroDe', () => {
    const nome = new FormControl('an', {
      validators: () => ({ minlength: { requiredLength: 3, actualLength: 2 } }),
    });
    nome.updateValueAndValidity();
    const form = new FormGroup({ nome });

    expect(causasDeInvalidez(form, ROTULOS)).toEqual([
      {
        campo: 'DOMINIO.FORMULARIO.NOME_LABEL',
        erro: 'VALIDACAO.TAMANHO_MINIMO',
        params: { requiredLength: 3, actualLength: 2 },
      },
    ]);
  });
});
