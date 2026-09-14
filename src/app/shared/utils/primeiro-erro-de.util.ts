import { AbstractControl } from '@angular/forms';

export function primeiroErroDe(
  control: AbstractControl | null | undefined,
): { chave: string; detalhe: unknown } | null {
  if (!control?.errors) return null;

  const chave = Object.keys(control.errors)[0];
  return { chave, detalhe: control.errors[chave] };
}
