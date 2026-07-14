import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class TextoValidator {
  static naoEmBranco(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const valor = control.value;
      if (valor == null || valor === '') return null;
      return valor.trim().length === 0 ? { emBranco: true } : null;
    };
  }
}
