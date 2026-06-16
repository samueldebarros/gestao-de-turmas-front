import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-paginacao',
  imports: [],
  templateUrl: './paginacao.component.html',
  styleUrl: './paginacao.component.scss',
})
export class PaginacaoComponent {
  @Input() paginaAtual: number = 1;
  @Input() totalPaginas: number = 1;
  @Output() mudarPagina = new EventEmitter<number>();

  get temPaginaAnterior(): boolean {
    return this.paginaAtual > 1;
  }

  get temProximaPagina(): boolean {
    return this.paginaAtual < this.totalPaginas;
  }

  get paginas(): number[] {
    return Array.from({ length: this.totalPaginas }, (_, index) => index + 1);
  }

  irParaPagina(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas || pagina === this.paginaAtual) return;
    this.mudarPagina.emit(pagina);
  }

  paginaAnterior(): void {
    this.irParaPagina(this.paginaAtual - 1);
  }

  proximaPagina(): void {
    this.irParaPagina(this.paginaAtual + 1);
  }
}
