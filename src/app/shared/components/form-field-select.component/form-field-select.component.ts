import { Component, forwardRef, Input } from '@angular/core';
import { SelectOptionInterface } from '../../interfaces/ui/select-option.interface';
import { ValorCampoSelect } from '../../types/valor-campo.type';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { gerarIdUnico } from '../../utils/gerar-id-unico.util';

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
  protected readonly campoId = gerarIdUnico('form-field-select');

  @Input() label: string = '';
  @Input() placeholder: string = 'Selecione...';
  @Input() options: SelectOptionInterface[] = [];
  @Input() errorMessage: string = '';
  @Input() control?: AbstractControl | null;

  get exibirErro(): boolean {
    if (this.control) return this.control.invalid && this.control.touched;
    return !!this.errorMessage;
  }

  valorAtual: ValorCampoSelect = '';
  isDisabled: boolean = false;

  onChange: (valor: ValorCampoSelect) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: ValorCampoSelect | undefined): void {
    this.valorAtual = value ?? '';
  }
  registerOnChange(fn: (valor: ValorCampoSelect) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
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
