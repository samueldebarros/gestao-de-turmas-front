import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environments';
import { HttpClient, HttpParams } from '@angular/common/http';
import { TurmaFiltro } from '../../shared/interfaces/ui/turma-filtro.interface';
import { Observable } from 'rxjs';
import { TurmaInterface } from '../../shared/interfaces/entities/turma.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { TurmaAdicionarDTO } from '../../shared/interfaces/dto/turma-adicionar-dto.interface';

@Injectable({
  providedIn: 'root',
})
export class TurmaService {
  private readonly apiUrl = `${environment.apiUrl}/turmas`;
  private readonly http = inject(HttpClient);

  obterTurmas(filtro: TurmaFiltro): Observable<ResultadoPaginado<TurmaInterface>> {
    const params = this.montarParams(filtro);

    return this.http.get<ResultadoPaginado<TurmaInterface>>(this.apiUrl, { params });
  }

  private montarParams(filtro: TurmaFiltro): HttpParams {
    return Object.entries(filtro)
      .filter(([, valor]) => valor !== null && valor !== undefined && valor !== '')
      .reduce((params, [chave, valor]) => params.set(chave, String(valor)), new HttpParams());
  }

  adicionarTurma(dto: TurmaAdicionarDTO): Observable<void> {
    return this.http.post<void>(this.apiUrl, dto);
  }
}
