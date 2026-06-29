import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { PainelDemograficoTurma } from '../../shared/interfaces/entities/painel-demografico-turma.interface';
import { BalancoEvasaoSerie } from '../../shared/interfaces/entities/balanco-evasao-serie.interface';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;
  private readonly http = inject(HttpClient);

  obterPainelDemografico(): Observable<PainelDemograficoTurma[]> {
    return this.http.get<PainelDemograficoTurma[]>(`${this.apiUrl}/painel-demografico`);
  }

  obterBalancoEvasao(): Observable<BalancoEvasaoSerie[]> {
    return this.http.get<BalancoEvasaoSerie[]>(`${this.apiUrl}/balanco-evasao`);
  }
}
