import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { DisciplinaInterface } from '../../shared/interfaces/entities/disciplina.interface';
import { DisciplinaService } from '../services/disciplina.service';

@Injectable({
  providedIn: 'root',
})
export class DisciplinaFacadeService {
  private readonly disciplinaService = inject(DisciplinaService);

  public readonly disciplinas$: Observable<DisciplinaInterface[]> = this.disciplinaService
    .obterDisciplinas()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));
}
