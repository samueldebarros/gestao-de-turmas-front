import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TabelaColuna } from '../../interfaces/ui/tabela-coluna.interface';
import { EntidadeBaseInterface } from '../../interfaces/entities/entidade-base.interface';
import { AcaoTabela } from '../../interfaces/ui/acao-tabela.interface';
import { EventoAcaoTabela } from '../../interfaces/ui/evento-acao-tabela.interface';
import { Botao } from '../botao/botao.component';
import { TranslatePipe } from '@ngx-translate/core';
import { OrdenacaoTabela } from '../../interfaces/ui/ordenaca-tabela.interface';
import { DirecaoOrdenacaoEnum } from '../../enums/direcao-ordenacao.enum';

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

  @Input() ordenacaoAtual: OrdenacaoTabela | null = null;
  @Output() ordenarPor = new EventEmitter<number>();

  @Input() acoes: AcaoTabela[] = [];

  @Output() acaoClicada = new EventEmitter<EventoAcaoTabela<T>>();

  dispararAcao(acaoId: string, item: T): void {
    this.acaoClicada.emit({ acaoId, item });
  }

  aoClicarCabecalho(coluna: TabelaColuna): void {
    if (coluna.chaveOrdenacao == null) return;
    this.ordenarPor.emit(coluna.chaveOrdenacao);
  }

  direcaoDaColuna(coluna: TabelaColuna): 'asc' | 'desc' | null {
    if (coluna.chaveOrdenacao == null || this.ordenacaoAtual?.campo !== coluna.chaveOrdenacao)
      return null;
    return this.ordenacaoAtual.direcao === DirecaoOrdenacaoEnum.ASC ? 'asc' : 'desc';
  }
}
