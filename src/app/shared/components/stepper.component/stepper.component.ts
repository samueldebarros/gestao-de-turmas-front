import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PassoStepper } from '../../interfaces/ui/passo-stepper.interface';
import { TranslatePipe } from '@ngx-translate/core';
import { Botao } from '../botao/botao.component';

@Component({
  selector: 'app-stepper',
  imports: [TranslatePipe, Botao],
  templateUrl: './stepper.component.html',
  styleUrl: './stepper.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StepperComponent {
  @Input({ required: true }) passos: PassoStepper[] = [];
  @Input() passoAtual = 0;
  @Input() podeAvancar = true;

  @Output() voltar = new EventEmitter<void>();
  @Output() avancar = new EventEmitter<void>();
  @Output() concluir = new EventEmitter<void>();

  get ehPrimeiro(): boolean {
    return this.passoAtual === 0;
  }

  get ehUltimo(): boolean {
    return this.passoAtual === this.passos.length - 1;
  }
}
