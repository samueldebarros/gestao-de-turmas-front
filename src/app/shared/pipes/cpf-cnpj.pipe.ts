import { Pipe, PipeTransform } from '@angular/core';
import { formatarCpfCnpj } from '../utils/cpf-cnpj.utils';

@Pipe({ name: 'cpfCnpj', standalone: true, pure: true })
export class CpfCnpjPipe implements PipeTransform {
  transform(valor: string | null | undefined): string {
    return formatarCpfCnpj(valor);
  }
}
