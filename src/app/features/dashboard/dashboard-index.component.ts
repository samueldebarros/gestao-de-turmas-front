import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { TabelaGenerica } from '../../shared/components/tabela-generica/tabela-generica.component';
import { TabelaColuna } from '../../shared/interfaces/ui/tabela-coluna.interface';
import { DashboardFacadeService } from '../../core/facades/dashboard-facade.service';

@Component({
  selector: 'app-dashboard-index',
  standalone: true,
  imports: [TabelaGenerica, AsyncPipe, TranslatePipe],
  templateUrl: './dashboard-index.component.html',
  styleUrl: './dashboard-index.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardIndexComponent {
  private readonly dashboardFacade = inject(DashboardFacadeService);

  protected readonly painelDemografico$ = this.dashboardFacade.painelDemografico$;
  protected readonly balancoEvasao$ = this.dashboardFacade.balancoEvasao$;

  protected readonly colunasPainel: TabelaColuna[] = [
    { chave: 'identificador', titulo: 'TABELA.COLUNAS.PAINEL_DEMOGRAFICO.TURMA' },
    { chave: 'serieDescricao', titulo: 'TABELA.COLUNAS.PAINEL_DEMOGRAFICO.SERIE' },
    { chave: 'menor15', titulo: 'TABELA.COLUNAS.PAINEL_DEMOGRAFICO.MENOR_15' },
    { chave: 'de15a17', titulo: 'TABELA.COLUNAS.PAINEL_DEMOGRAFICO.DE_15_A_17' },
    { chave: 'maior18', titulo: 'TABELA.COLUNAS.PAINEL_DEMOGRAFICO.MAIOR_18' },
    {
      chave: 'idadeMedia',
      titulo: 'TABELA.COLUNAS.PAINEL_DEMOGRAFICO.IDADE_MEDIA',
      formatador: (valor: number) => valor.toFixed(2),
    },
  ];

  protected readonly colunasEvasao: TabelaColuna[] = [
    { chave: 'anoLetivo', titulo: 'TABELA.COLUNAS.BALANCO_EVASAO.ANO_LETIVO' },
    { chave: 'serieDescricao', titulo: 'TABELA.COLUNAS.BALANCO_EVASAO.SERIE' },
    { chave: 'totalMatriculas', titulo: 'TABELA.COLUNAS.BALANCO_EVASAO.TOTAL_MATRICULAS' },
    { chave: 'alunosAtivos', titulo: 'TABELA.COLUNAS.BALANCO_EVASAO.ALUNOS_ATIVOS' },
    {
      chave: 'alunosTrancadosOuCancelados',
      titulo: 'TABELA.COLUNAS.BALANCO_EVASAO.TRANCADOS_CANCELADOS',
    },
    {
      chave: 'percentualEvasao',
      titulo: 'TABELA.COLUNAS.BALANCO_EVASAO.PERCENTUAL_EVASAO',
      formatador: (valor: number) => `${valor.toFixed(2)}%`,
    },
  ];
}
