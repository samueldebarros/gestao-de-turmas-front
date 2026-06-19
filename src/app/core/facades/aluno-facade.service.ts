import { inject, Injectable } from '@angular/core';
import { AlunoService } from '../services/aluno.service';
import { BehaviorSubject, debounceTime, Observable, switchMap, tap } from 'rxjs';
import { AlunoAdicionarDTO } from '../../shared/interfaces/dto/aluno-adicionar-dto.interface';
import { AlunoEditarDTO } from '../../shared/interfaces/dto/aluno-editar-dto.interface';
import { FiltroListaInterface } from '../../shared/interfaces/ui/filtro-lista.interface';
import { AlunoFiltro } from '../../shared/interfaces/ui/aluno-filtro.interface';
import { AlunoInterface } from '../../shared/interfaces/entities/aluno.interface';
import { ResultadoPaginado } from '../../shared/interfaces/ui/resultado-paginado.interface';
import { SexoEnum } from '../../shared/enums/sexo.enum';

@Injectable({
  providedIn: 'root',
})
export class AlunoFacadeService {
  private readonly alunoService = inject(AlunoService);
  private readonly _paginaState$ = new BehaviorSubject<AlunoFiltro>({
    pagina: 1,
    tamanhoPagina: 10,
    pesquisa: '',
    sexo: null,
    ativo: null,
  });

  readonly resultado$: Observable<ResultadoPaginado<AlunoInterface>> = this._paginaState$.pipe(
    debounceTime(0),
    switchMap((filtro) => this.alunoService.obterTodosOsAlunos(filtro)),
  );

  public aplicarFiltros(filtros: FiltroListaInterface): void {
    this._paginaState$.next({
      ...this._paginaState$.value,
      pagina: 1,
      pesquisa: filtros.pesquisa ?? '',
      sexo: (filtros['sexo'] as SexoEnum | null) ?? null,
      ativo: (filtros['ativo'] as boolean | null) ?? null,
    });
  }

  public mudarPagina(pagina: number): void {
    this._paginaState$.next({
      ...this._paginaState$.value,
      pagina,
    });
  }

  public adicionar(dto: AlunoAdicionarDTO): Observable<void> {
    return this.alunoService.adicionarAluno(dto).pipe(
      tap(() =>
        this._paginaState$.next({
          ...this._paginaState$.value,
        }),
      ),
    );
  }

  public editar(dto: AlunoEditarDTO): Observable<void> {
    return this.alunoService.editarAluno(dto).pipe(
      tap(() =>
        this._paginaState$.next({
          ...this._paginaState$.value,
        }),
      ),
    );
  }

  public inativar(id: number): Observable<void> {
    return this.alunoService.inativarAluno(id).pipe(
      tap(() =>
        this._paginaState$.next({
          ...this._paginaState$.value,
        }),
      ),
    );
  }

  public reativar(id: number): Observable<void> {
    return this.alunoService.reativarAluno(id).pipe(
      tap(() =>
        this._paginaState$.next({
          ...this._paginaState$.value,
        }),
      ),
    );
  }
}
