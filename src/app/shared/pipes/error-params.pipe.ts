import { Pipe, PipeTransform } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { primeiroErroDe } from '../utils/primeiro-erro-de.util';

@Pipe({ name: 'errorParams', standalone: true, pure: false })
export class ErrorParamsPipe implements PipeTransform {
  transform(control: AbstractControl | null | undefined): Record<string, unknown> | undefined {
    const erro = primeiroErroDe(control);
    if (!erro) return undefined;

    const { detalhe } = erro;
    if (typeof detalhe !== 'object' || detalhe === null) return undefined;

    return detalhe as Record<string, unknown>;
  }
}
