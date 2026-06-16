import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-botao',
  standalone: true,
  imports: [],
  templateUrl: './botao.component.html',
  styleUrl: './botao.component.scss',
})
export class Botao {
  @Input() variante: string = 'primario';
  @Input() tipo: 'button' | 'submit' | 'reset' = 'button';
  @Input() tamanho: 'padrao' | 'grande' = 'padrao';

  @Output() acaoBotao = new EventEmitter<void>();

  onClick() {
    this.acaoBotao.emit();
  }
}
