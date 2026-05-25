import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TabelaColuna } from '../../interfaces/tabela-coluna.interface';
import { EntidadeBaseInterface } from '../../interfaces/entidade-base.interface';
import { AcaoTabela } from '../../interfaces/acao-tabela.interface';
import { EventoAcaoTabela } from '../../interfaces/evento-acao-tabela.interface';
import { Botao } from '../botao/botao.component';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-tabela-generica',
  standalone: true,
  imports: [Botao, TranslatePipe],
  templateUrl: './tabela-generica.component.html',
  styleUrl: './tabela-generica.component.scss',
})
export class TabelaGenerica<T extends EntidadeBaseInterface> {
  @Input() dados: T[] = [];
  @Input() colunas: TabelaColuna[] = [];

  @Input() acoes: AcaoTabela[] = [];

  @Output() acaoClicada = new EventEmitter<EventoAcaoTabela<T>>();

  dispararAcao(acaoId: string, item: T): void {
    this.acaoClicada.emit({ acaoId, item });
  }
}
