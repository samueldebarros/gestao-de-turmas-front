import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { primeiroErroDe } from '../utils/primeiro-erro-de.util';

const ERRO_PARA_MENSAGEM: Record<string, string> = {
  required: 'VALIDACAO.OBRIGATORIO',
  minlength: 'VALIDACAO.TAMANHO_MINIMO',
  email: 'VALIDACAO.EMAIL_INVALIDO',
  documentoInvalido: 'VALIDACAO.DOCUMENTO_INVALIDO',
  cpfInvalido: 'VALIDACAO.CPF_INVALIDO',
  cnpjInvalido: 'VALIDACAO.CNPJ_INVALIDO',
  dataFuturaOuPresente: 'VALIDACAO.DATA_FUTURA',
  idadeMaximaExcedida: 'VALIDACAO.IDADE_MAXIMA',
  emBranco: 'VALIDACAO.EM_BRANCO',
  maxlength: 'VALIDACAO.TAMANHO_MAXIMO',
  min: 'VALIDACAO.VALOR_MINIMO',
  max: 'VALIDACAO.VALOR_MAXIMO',
};

@Pipe({ name: 'errorMessage', standalone: true, pure: false })
export class ErrorMessagePipe implements PipeTransform {
  transform(control: AbstractControl | null | undefined): string {
    const primeiroErro = primeiroErroDe(control);
    if (!primeiroErro) return '';
    return ERRO_PARA_MENSAGEM[primeiroErro.chave] ?? '';
  }
}
