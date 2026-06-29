import { inject, Injectable } from '@angular/core';
import { map, Observable, shareReplay } from 'rxjs';
import { DashboardService } from '../services/dashboard.service';
import { PainelDemograficoLinha } from '../../shared/interfaces/entities/painel-demografico-turma.interface';
import { BalancoEvasaoLinha } from '../../shared/interfaces/entities/balanco-evasao-serie.interface';

@Injectable({
  providedIn: 'root',
})
export class DashboardFacadeService {
  private readonly dashboardService = inject(DashboardService);

  readonly painelDemografico$: Observable<PainelDemograficoLinha[]> = this.dashboardService
    .obterPainelDemografico()
    .pipe(
      map((turmas) => turmas.map((turma, indice) => ({ ...turma, id: indice + 1 }))),
      shareReplay({ bufferSize: 1, refCount: true }),
    );

  readonly balancoEvasao$: Observable<BalancoEvasaoLinha[]> = this.dashboardService
    .obterBalancoEvasao()
    .pipe(
      map((series) => series.map((serie, indice) => ({ ...serie, id: indice + 1 }))),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
}
