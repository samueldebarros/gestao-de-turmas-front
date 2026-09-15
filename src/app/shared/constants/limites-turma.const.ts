import { Validators } from '@angular/forms';
import { TextoValidator } from '../validators/texto.validator';

export const identificadorTamanhoMaximo = 1;
export const capacidadeMinima = 1;
export const capacidadeMaxima = 255;
export const anoLetivoMinimo = 2000;
export const anoLetivoMaximo = 2100;

export const validadoresIdentificadorTurma = [
  Validators.required,
  TextoValidator.naoEmBranco(),
  Validators.maxLength(identificadorTamanhoMaximo),
];

export const validadoresCapacidadeTurma = [
  Validators.required,
  Validators.min(capacidadeMinima),
  Validators.max(capacidadeMaxima),
];

export const validadoresAnoLetivoTurma = [
  Validators.required,
  Validators.min(anoLetivoMinimo),
  Validators.max(anoLetivoMaximo),
];
