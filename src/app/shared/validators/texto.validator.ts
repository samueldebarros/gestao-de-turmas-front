import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class TextoValidator {
  static naoEmBranco(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null =>
      control.value != null && control.value !== '' && control.value.trim() === ''
        ? { emBranco: true }
        : null;
  }
}
