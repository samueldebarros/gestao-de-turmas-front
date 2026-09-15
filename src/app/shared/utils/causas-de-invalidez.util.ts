import { FormGroup } from '@angular/forms';
import { DetalheAlerta } from '../interfaces/ui/detalhe-alerta.interface';
import { ErrorMessagePipe } from '../pipes/error-message.pipe';
import { primeiroErroDe } from './primeiro-erro-de.util';

const erroMessagePipe = new ErrorMessagePipe();

export function causasDeInvalidez(
  form: FormGroup,
  rotulos: Record<string, string>,
): DetalheAlerta[] {
  return Object.entries(form.controls)
    .filter(([, controle]) => controle.enabled && controle.invalid)
    .map(([nome, controle]) => {
      const erro = primeiroErroDe(controle);
      const params =
        erro && typeof erro.detalhe === 'object' && erro.detalhe !== null
          ? (erro.detalhe as Record<string, unknown>)
          : undefined;

      return {
        campo: rotulos[nome] ?? nome,
        erro: erroMessagePipe.transform(controle),
        params,
      };
    })
    .filter((detalhe) => detalhe.erro !== '');
}
