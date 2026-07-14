import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { SelectOptionInterface } from '../../shared/interfaces/ui/select-option.interface';
import { TurmaFacadeService } from '../../core/facades/turma-facade.service';
import { TurnoEnum } from '../../shared/enums/turno.enum';
import { SelectFilterInterface } from '../../shared/interfaces/ui/select-filter.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { Botao } from '../../shared/components/botao/botao.component';
import { FiltroListaComponent } from '../../shared/components/filtro-lista.component/filtro-lista.component';
import { MensagemComponent } from '../../shared/components/mensagem.component/mensagem.component';
import { TurmaCardComponent } from '../../shared/components/turma-card.component/turma-card.component';
import { PaginacaoComponent } from '../../shared/components/paginacao.component/paginacao.component';
import { TranslatePipe } from '@ngx-translate/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-turma-index',
  imports: [
    Botao,
    FiltroListaComponent,
    MensagemComponent,
    TurmaCardComponent,
    PaginacaoComponent,
    TranslatePipe,
    AsyncPipe,
    RouterLink,
  ],
  templateUrl: './turma-index.component.html',
  styleUrl: './turma-index.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TurmaIndexComponent {
  private readonly facade = inject(TurmaFacadeService);

  readonly sucessoCadastro = signal<boolean>(history.state?.sucesso === true);

  readonly estado$ = this.facade.estado$;

  readonly opcoesTurno: SelectOptionInterface[] = [
    { value: TurnoEnum.MATUTINO, label: 'TURMA.TURNO.1' },
    { value: TurnoEnum.VESPERTINO, label: 'TURMA.TURNO.2' },
    { value: TurnoEnum.NOTURNO, label: 'TURMA.TURNO.3' },
  ];

  readonly opcoesStatus: SelectOptionInterface[] = [
    { value: true, label: 'TURMA.CARD.ATIVO' },
    { value: false, label: 'TURMA.CARD.INATIVO' },
  ];

  readonly filtrosTurma: SelectFilterInterface[] = [
    {
      controlName: 'anoLetivo',
      label: '',
      placeholder: 'TURMA.FILTRO.ANO_LETIVO',
      options: this.opcoesAnoLetivo(),
    },
    {
      controlName: 'turno',
      label: '',
      placeholder: 'TURMA.FILTRO.TURNO',
      options: this.opcoesTurno,
    },
    {
      controlName: 'ativo',
      label: '',
      placeholder: 'TURMA.FILTRO.STATUS',
      options: this.opcoesStatus,
    },
  ];

  filtrar(filtro: FiltroListaInterface): void {
    this.facade.aplicarFiltros(filtro);
  }

  mudarPagina(pagina: number): void {
    this.facade.mudarPagina(pagina);
  }

  fecharSucesso(): void {
    this.sucessoCadastro.set(false);
  }

  private opcoesAnoLetivo(): SelectOptionInterface[] {
    const anoAtual = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => {
      const ano = anoAtual - i;
      return { value: ano, label: String(ano) };
    });
  }
}
