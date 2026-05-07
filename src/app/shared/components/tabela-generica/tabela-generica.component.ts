import { Component, Input } from '@angular/core';
import { TabelaColuna } from '../../models/tabela-coluna.interface';
import { EntidadeBaseInterface } from '../../models/entidade-base.interface';

@Component({
  selector: 'app-tabela-generica',
  standalone: true,
  imports: [],
  templateUrl: './tabela-generica.component.html',
  styleUrl: './tabela-generica.component.scss',
})
export class TabelaGenerica {
  @Input() dados: EntidadeBaseInterface[] = [];
  @Input() colunas: TabelaColuna[] = [];

}