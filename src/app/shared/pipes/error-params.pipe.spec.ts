import { FormControl } from '@angular/forms';
import { ErrorParamsPipe } from './error-params.pipe';
import { ErrorMessagePipe } from './error-message.pipe';

const comErros = (erros: Record<string, unknown>): FormControl => {
  const controle = new FormControl('');
  controle.setErrors(erros);
  return controle;
};

describe('ErrorParamsPipe', () => {
  let pipe: ErrorParamsPipe;

  beforeEach(() => {
    pipe = new ErrorParamsPipe();
  });

  it('controle sem erro devolve undefined', () => {
    expect(pipe.transform(new FormControl(''))).toBeUndefined();
  });

  it('controle nulo devolve undefined', () => {
    expect(pipe.transform(null)).toBeUndefined();
  });

  it('controle indefinido devolve undefined', () => {
    expect(pipe.transform(undefined)).toBeUndefined();
  });

  it('erro "required" (detalhe booleano) devolve undefined', () => {
    expect(pipe.transform(comErros({ required: true }))).toBeUndefined();
  });

  it('erro "max" devolve o objeto de detalhe', () => {
    const controle = comErros({ max: { max: 255, actual: 300 } });

    expect(pipe.transform(controle)).toEqual({ max: 255, actual: 300 });
  });

  it('erro "maxlength" devolve requiredLength e actualLength', () => {
    const controle = comErros({ maxlength: { requiredLength: 1, actualLength: 2 } });

    expect(pipe.transform(controle)).toEqual({ requiredLength: 1, actualLength: 2 });
  });

  it('concorda com o ErrorMessagePipe: quando required vem primeiro, params é undefined mesmo com max presente', () => {
    const controle = comErros({ required: true, max: { max: 255, actual: 300 } });
    const mensagemPipe = new ErrorMessagePipe();

    expect(mensagemPipe.transform(controle)).toBe('VALIDACAO.OBRIGATORIO');
    expect(pipe.transform(controle)).toBeUndefined();
  });
});
