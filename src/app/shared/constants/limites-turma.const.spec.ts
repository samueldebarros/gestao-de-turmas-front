import { FormControl, Validators } from '@angular/forms';
import {
  anoLetivoMaximo,
  anoLetivoMinimo,
  capacidadeMaxima,
  capacidadeMinima,
  identificadorTamanhoMaximo,
  validadoresAnoLetivoTurma,
  validadoresCapacidadeTurma,
  validadoresIdentificadorTurma,
} from './limites-turma.const';

describe('validadoresIdentificadorTurma', () => {
  const validar = Validators.compose(validadoresIdentificadorTurma)!;

  it('aprova um identificador dentro do limite', () => {
    const resultado = validar(new FormControl('A'));

    expect(resultado).toBeNull();
  });

  it('reprova identificador maior que o tamanho máximo com a chave maxlength', () => {
    const resultado = validar(new FormControl('AB'));

    expect(resultado).toEqual({
      maxlength: { requiredLength: identificadorTamanhoMaximo, actualLength: 2 },
    });
  });

  it('reprova identificador em branco com a chave emBranco', () => {
    const resultado = validar(new FormControl(' '));

    expect(resultado).toEqual({ emBranco: true });
  });

  it('reprova identificador ausente com a chave required', () => {
    const resultado = validar(new FormControl(null));

    expect(resultado).toEqual({ required: true });
  });
});

describe('validadoresCapacidadeTurma', () => {
  const validar = Validators.compose(validadoresCapacidadeTurma)!;

  it('aprova uma capacidade dentro do limite', () => {
    const resultado = validar(new FormControl(50));

    expect(resultado).toBeNull();
  });

  it('reprova capacidade abaixo do mínimo com a chave min', () => {
    const resultado = validar(new FormControl(0));

    expect(resultado).toEqual({ min: { min: capacidadeMinima, actual: 0 } });
  });

  it('reprova capacidade acima do máximo com a chave max', () => {
    const resultado = validar(new FormControl(256));

    expect(resultado).toEqual({ max: { max: capacidadeMaxima, actual: 256 } });
  });

  it('reprova capacidade ausente com a chave required', () => {
    const resultado = validar(new FormControl(null));

    expect(resultado).toEqual({ required: true });
  });
});

describe('validadoresAnoLetivoTurma', () => {
  const validar = Validators.compose(validadoresAnoLetivoTurma)!;

  it('aprova um ano letivo dentro do limite', () => {
    const resultado = validar(new FormControl(2024));

    expect(resultado).toBeNull();
  });

  it('reprova ano letivo abaixo do mínimo com a chave min', () => {
    const resultado = validar(new FormControl(1999));

    expect(resultado).toEqual({ min: { min: anoLetivoMinimo, actual: 1999 } });
  });

  it('reprova ano letivo acima do máximo com a chave max', () => {
    const resultado = validar(new FormControl(2101));

    expect(resultado).toEqual({ max: { max: anoLetivoMaximo, actual: 2101 } });
  });

  it('reprova ano letivo ausente com a chave required', () => {
    const resultado = validar(new FormControl(null));

    expect(resultado).toEqual({ required: true });
  });
});
