import { HttpBackend, HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  LocalidadeInterface,
  NivelLocalidade,
} from '../../shared/interfaces/entities/localidade.interface';

interface LocalidadeIbge {
  id: number;
  nome: string;
}

const BASE = 'https://servicodados.ibge.gov.br/api/v1/localidades';

@Injectable({
  providedIn: 'root',
})
export class LocalidadeService {
  private readonly http = new HttpClient(inject(HttpBackend));

  obterRegioes(): Observable<LocalidadeInterface[]> {
    return this.buscar(`${BASE}/regioes`, 'regiao');
  }

  obterEstados(regiaoId: number): Observable<LocalidadeInterface[]> {
    return this.buscar(`${BASE}/regioes/${regiaoId}/estados`, 'uf');
  }

  obterMunicipios(estadoId: number): Observable<LocalidadeInterface[]> {
    return this.buscar(`${BASE}/estados/${estadoId}/municipios`, 'municipio');
  }

  obterDistritos(municipioId: number): Observable<LocalidadeInterface[]> {
    return this.buscar(`${BASE}/municipios/${municipioId}/distritos`, 'distrito');
  }

  private buscar(url: string, nivel: NivelLocalidade): Observable<LocalidadeInterface[]> {
    return this.http
      .get<LocalidadeIbge[]>(url)
      .pipe(map((itens) => itens.map(({ id, nome }) => ({ id, nome, nivel }))));
  }
}
