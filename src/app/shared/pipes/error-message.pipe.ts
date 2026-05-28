import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';

const ERRO_PARA_MENSAGEM: Record<string, string> = {
  required: 'VALIDACAO.OBRIGATORIO',
  email: 'ALUNO.FORMULARIO.EMAIL_INVALIDO',
  documentoInvalido: 'VALIDACAO.DOCUMENTO_INVALIDO',
  cpfInvalido: 'VALIDACAO.CPF_INVALIDO',
  cnpjInvalido: 'VALIDACAO.CNPJ_INVALIDO',
  dataFuturaOuPresente: 'VALIDACAO.DATA_FUTURA',
  idadeMaximaExcedida: 'VALIDACAO.IDADE_MAXIMA',
};

@Pipe({ name: 'errorMessage', standalone: true, pure: false })
export class ErrorMessagePipe implements PipeTransform {
  transform(control: AbstractControl | null | undefined): string {
    if (!control?.errors) return '';
    const primeiraChave = Object.keys(control.errors)[0];
    return ERRO_PARA_MENSAGEM[primeiraChave] ?? '';
  }
}
