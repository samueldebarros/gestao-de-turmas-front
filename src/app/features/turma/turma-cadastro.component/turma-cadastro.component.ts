import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormArray, FormBuilder, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PassoStepper } from '../../../shared/interfaces/ui/passo-stepper.interface';
import { StepperComponent } from '../../../shared/components/stepper.component/stepper.component';
import { Botao } from '../../../shared/components/botao/botao.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-turma-cadastro',
  imports: [StepperComponent, Botao, TranslatePipe],
  templateUrl: './turma-cadastro.component.html',
  styleUrl: './turma-cadastro.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurmaCadastroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  passoAtual = 0;

  readonly passos: PassoStepper[] = [
    { id: 'informacoes', rotulo: 'TURMA.STEPPER.INFORMACOES' },
    { id: 'alocacoes', rotulo: 'TURMA.STEPPER.DISCIPLINAS' },
    { id: 'alunosIds', rotulo: 'TURMA.STEPPER.ALUNOS' },
  ];

  readonly cadastroForm = this.fb.group({
    informacoes: this.fb.group({
      placeholder: new FormControl<string | null>(null, Validators.required),
    }),
    alocacoes: new FormArray<FormControl<number>>([]),
    alunosIds: new FormControl<number[]>([], { nonNullable: true }),
  });

  private readonly ordemGrupos = ['informacoes', 'alocacoes', 'alunosIds'] as const;

  get podeAvancar(): boolean {
    return this.cadastroForm.get(this.ordemGrupos[this.passoAtual])!.valid;
  }

  avancar(): void {
    if (this.podeAvancar && this.passoAtual < this.passos.length - 1) this.passoAtual++;
  }

  voltar(): void {
    if (this.passoAtual > 0) this.passoAtual--;
  }

  concluir(): void {}

  cancelar(): void {
    this.router.navigate(['/turmas']);
  }
}
