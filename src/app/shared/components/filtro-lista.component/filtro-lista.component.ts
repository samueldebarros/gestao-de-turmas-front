import { Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormFieldTextComponent } from '../form-field-text.component/form-field-text.component';
import { FormFieldSelectComponent } from '../form-field-select.component/form-field-select.component';
import { Botao } from '../botao/botao.component';
import { SelectFilterInterface } from '../../interfaces/ui/select-filter.interface';
import { FiltroListaInterface } from '../../interfaces/ui/filtro-lista.interface';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-filtro-lista',
  imports: [
    FormFieldTextComponent,
    FormFieldSelectComponent,
    Botao,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './filtro-lista.component.html',
  styleUrl: './filtro-lista.component.scss',
})
export class FiltroListaComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  @Input() filtros: SelectFilterInterface[] = [];
  @Output() acaoFiltrar = new EventEmitter<FiltroListaInterface>();

  private readonly fb = inject(FormBuilder);

  formFiltro!: FormGroup<{
    pesquisa: FormControl<string | null>;
    [key: string]: AbstractControl;
  }>;

  ngOnInit(): void {
    this.formFiltro = this.fb.group({
      pesquisa: [''],
    });

    this.configurarFormFiltros();

    this.formFiltro.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(300),
        distinctUntilChanged((anterior, atual) => {
          return JSON.stringify(anterior) === JSON.stringify(atual);
        }),
      )
      .subscribe((valores) => this.acaoFiltrar.emit(valores as FiltroListaInterface));
  }

  private configurarFormFiltros(): void {
    this.filtros.forEach((filtro) => {
      const novoControle = this.fb.control<unknown>(null);

      this.formFiltro.addControl(filtro.controlName, novoControle);
    });
  }

  private obterFiltrosResetados(): Record<string, unknown> {
    const filtrosResetados: Record<string, unknown> = { pesquisa: '' };

    this.filtros.forEach((filtro) => {
      filtrosResetados[filtro.controlName] = '';
    });

    return filtrosResetados;
  }

  onLimparFiltro(): void {
    this.formFiltro.reset(this.obterFiltrosResetados());
    this.acaoFiltrar.emit(this.formFiltro.value as FiltroListaInterface);
  }
}
