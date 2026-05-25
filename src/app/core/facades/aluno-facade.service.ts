import { inject, Injectable } from '@angular/core';
import { AlunoService } from '../services/aluno.service';
import { BehaviorSubject, Observable, shareReplay, switchMap, tap } from 'rxjs';
import { AlunoModel } from '../../shared/models/aluno.model';
import { AlunoAdicionarDTO } from '../../shared/interfaces/aluno-adicionar-dto.interface';
import { AlunoEditarDTO } from '../../shared/interfaces/aluno-editar-dto.interface';

@Injectable({
  providedIn: 'root',
})
export class AlunoFacadeService {
  private readonly alunoService = inject(AlunoService);
  private readonly refreshTrigger$ = new BehaviorSubject<void>(undefined);
  private readonly paginaState$ = new BehaviorSubject<{ pagina: number; tamanhoPagina: number }>({
    pagina: 1,
    tamanhoPagina: 10,
  });

  readonly alunos$: Observable<AlunoModel[]> = this.refreshTrigger$.pipe(
    switchMap(() => {
      const filtro = this.paginaState$.value;
      return this.alunoService.obterTodosOsAlunos(filtro.pagina, filtro.tamanhoPagina);
    }),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  public refresh(): void {
    this.refreshTrigger$.next();
  }

  public adicionar(dto: AlunoAdicionarDTO): Observable<void> {
    return this.alunoService.adicionarAluno(dto).pipe(tap(() => this.refresh()));
  }

  public editar(dto: AlunoEditarDTO): Observable<void> {
    return this.alunoService.editarAluno(dto).pipe(tap(() => this.refresh()));
  }

  public inativar(id: number): Observable<void> {
    return this.alunoService.inativarAluno(id).pipe(tap(() => this.refresh()));
  }

  public reativar(id: number): Observable<void> {
    return this.alunoService.reativarAluno(id).pipe(tap(() => this.refresh()));
  }
}
