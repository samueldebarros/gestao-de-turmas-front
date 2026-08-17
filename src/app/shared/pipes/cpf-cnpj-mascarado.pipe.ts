import { Pipe, PipeTransform } from '@angular/core';
import { mascararCpfCnpj } from '../utils/cpf-cnpj.utils';

@Pipe({ name: 'cpfCnpjMascarado', standalone: true, pure: true })
export class cpfCnpjMascaradoPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return mascararCpfCnpj(valor);
  }
}
