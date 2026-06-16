import { Component, inject, OnInit } from '@angular/core';
import { TabelaGenerica } from '../tabela-generica/tabela-generica.component';
import { TabelaColuna } from '../../interfaces/tabela-coluna.interface';
import { DocenteFacadeService } from '../../../core/facades/docente-facade.service';
import { Observable } from 'rxjs';
import { DocenteSqlInterface } from '../../interfaces/docente-sql.interface';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-docente-index',
  imports: [TabelaGenerica, AsyncPipe],
  templateUrl: './docente-index.component.html',
  styleUrl: './docente-index.component.scss',
})
export class DocenteIndexComponent implements OnInit {
  private readonly docentesFacade = inject(DocenteFacadeService);
  public docentes$!: Observable<DocenteSqlInterface[]>;

  public colunas: TabelaColuna[] = [
    { chave: 'id', titulo: 'Id' },
    { chave: 'docenteNome', titulo: 'TABELA.COLUNAS.ALUNO.NOME' },
    { chave: 'docenteEmail', titulo: 'TABELA.COLUNAS.ALUNO.EMAIL' },
    { chave: 'disciplinaNome', titulo: 'Disciplina' },
    { chave: 'cargaHoraria', titulo: 'Carga Horária' },
  ];

  ngOnInit(): void {
    this.docentes$ = this.docentesFacade.docentes$;
  }
}
