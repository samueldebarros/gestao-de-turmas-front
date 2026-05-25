import { Pipe, PipeTransform } from '@angular/core';
import { SexoEnum } from '../enums/sexo.enum';

const SEXO_MAP: Record<number, string> = {
  [SexoEnum.MASCULINO]: 'ALUNO.FORMULARIO.SEXO_MASCULINO',
  [SexoEnum.FEMININO]: 'ALUNO.FORMULARIO.SEXO_FEMININO',
  [SexoEnum.OUTRO]: 'ALUNO.FORMULARIO.SEXO_OUTRO',
};

@Pipe({ name: 'sexoFormat', standalone: true })
export class SexoFormatPipe implements PipeTransform {
  transform(valor: number): string {
    return SEXO_MAP[valor] ?? '';
  }
}
