import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { DocenteSqlInterface } from '../../shared/interfaces/entities/docente-sql.interface';
import { DocenteListaInterface } from '../../shared/interfaces/entities/docente-lista.interface';
import { DocenteDetalheInterface } from '../../shared/interfaces/entities/docente-detalhe.interface';
import { DocenteAdicionarDTO } from '../../shared/interfaces/dto/docente-adicionar-dto.interface';
import { DocenteEditarDTO } from '../../shared/interfaces/dto/docente-editar-dto.interface';
import { DocenteFiltro } from '../../shared/interfaces/ui/docente-filtro.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

@Injectable({
  providedIn: 'root',
})
export class DocenteService {
  private readonly apiUrl = `${environment.apiUrl}/docentes`;
  private readonly http = inject(HttpClient);

  obterDocentesDisciplinasSql(): Observable<DocenteSqlInterface[]> {
    return this.http.get<DocenteSqlInterface[]>(this.apiUrl, {});
  }

  buscarDocentes(filtro: DocenteFiltro): Observable<ResultadoPaginado<DocenteListaInterface>> {
    return this.http.post<ResultadoPaginado<DocenteListaInterface>>(
      `${this.apiUrl}/buscar`,
      filtro,
    );
  }

  obterDocentePorId(docenteId: number): Observable<DocenteDetalheInterface> {
    return this.http.get<DocenteDetalheInterface>(`${this.apiUrl}/${docenteId}`);
  }

  adicionarDocente(docente: DocenteAdicionarDTO): Observable<void> {
    return this.http.post<void>(this.apiUrl, docente);
  }

  editarDocente(docente: DocenteEditarDTO): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${docente.id}`, docente);
  }

  inativarDocente(docenteId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${docenteId}/inativar`, {});
  }

  reativarDocente(docenteId: number): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${docenteId}/reativar`, {});
  }
}
