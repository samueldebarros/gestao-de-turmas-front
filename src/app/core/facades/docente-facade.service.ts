import { inject, Injectable } from '@angular/core';
import { DocenteService } from '../services/docente.service';
import { shareReplay } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DocenteFacadeService {
  private readonly docenteService = inject(DocenteService);

  public readonly docentes$ = this.docenteService
    .obterDocentesDisciplinasSql()
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));
}
