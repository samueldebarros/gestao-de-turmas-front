import { Component, Input } from '@angular/core';
import { TabelaColuna } from '../../interfaces/tabela-coluna.interface';
import { EntidadeBaseInterface } from '../../interfaces/entidade-base.interface';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-tabela-generica',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './tabela-generica.component.html',
  styleUrl: './tabela-generica.component.scss',
})
export class TabelaGenerica {
  @Input() dados: EntidadeBaseInterface[] = [];
  @Input() colunas: TabelaColuna[] = [];
}
