import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SelectOptionInterface } from '../../../interfaces/ui/select-option.interface';
import { TurnoEnum } from '../../../enums/turno.enum';
import { FormFieldTextComponent } from '../../form-field-text.component/form-field-text.component';
import { FormFieldSelectComponent } from '../../form-field-select.component/form-field-select.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-passo-informacoes',
  imports: [FormFieldTextComponent, FormFieldSelectComponent, TranslatePipe, ReactiveFormsModule],
  templateUrl: './passo-informacoes.component.html',
  styleUrl: './passo-informacoes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassoInformacoesComponent {
  @Input({ required: true }) formGroup!: FormGroup;

  readonly opcoesTurno: SelectOptionInterface[] = [
    { value: TurnoEnum.MATUTINO, label: 'TURMA.TURNO.1' },
    { value: TurnoEnum.VESPERTINO, label: 'TURMA.TURNO.2' },
    { value: TurnoEnum.NOTURNO, label: 'TURMA.TURNO.3' },
  ];

  readonly opcoesSerie: SelectOptionInterface[] = [
    { value: 1, label: 'TURMA.SERIE.1' },
    { value: 2, label: 'TURMA.SERIE.2' },
    { value: 3, label: 'TURMA.SERIE.3' },
  ];
}
