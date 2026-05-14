import { Component, forwardRef, Input } from '@angular/core';
import { SelectOptionInterface } from '../../interfaces/select-option.interface';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-form-field-select',
  standalone: true,
  imports: [TranslateModule, ReactiveFormsModule],
  templateUrl: './form-field-select.component.html',
  styleUrl: './form-field-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormFieldSelectComponent),
      multi: true,
    },
  ],
})
export class FormFieldSelectComponent implements ControlValueAccessor {
  @Input() label: string = '';
  @Input() placeholder: string = 'Selecione...';
  @Input() options: SelectOptionInterface[] = [];
  @Input() errorMessage: string = '';

  valorAtual: any = '';
  isDisabled: boolean = false;

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(value: any): void {
    if (value != undefined) this.valorAtual = value;
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onSelectChange(event: Event) {
    const valorStringDoHtml = (event.target as HTMLSelectElement).value;
    const opcaoSelecionada = this.options.find(
      (opcao) => String(opcao.value) === valorStringDoHtml,
    );
    const valorPreservado = opcaoSelecionada ? opcaoSelecionada.value : null;

    this.valorAtual = valorPreservado;
    this.onChange(valorPreservado);
    this.onTouched();
  }
}
