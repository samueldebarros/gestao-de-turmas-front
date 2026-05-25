import { Component, forwardRef, Input } from '@angular/core';
import { AbstractControl, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-form-field-text',
  standalone: true,
  templateUrl: './form-field-text.component.html',
  styleUrls: ['./form-field-text.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldTextComponent),
      multi: true,
    },
  ],
})
export class FormFieldTextComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = '';
  @Input() type: 'text' | 'password' | 'email' | 'date' = 'text';
  @Input() errorMessage: string = '';
  @Input() control?: AbstractControl | null;

  get exibirErro(): boolean {
    if (this.control) return this.control.invalid && this.control.touched;
    return !!this.errorMessage;
  }

  disabled = false;
  inputAtual: string = '';

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    this.inputAtual = value || '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event) {
    const valorDigitado = (event.target as HTMLInputElement).value;
    this.inputAtual = valorDigitado;
    this.onChange(valorDigitado);
  }
}
