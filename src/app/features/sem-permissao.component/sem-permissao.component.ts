import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { Botao } from '../../shared/components/botao/botao.component';

@Component({
  selector: 'app-sem-permissao.component',
  imports: [TranslatePipe, Botao],
  templateUrl: './sem-permissao.component.html',
  styleUrl: './sem-permissao.component.scss',
})
export class SemPermissaoComponent {
  private readonly router = inject(Router);

  irParaInicio(): void {
    this.router.navigate(['/alunos']);
  }
}
