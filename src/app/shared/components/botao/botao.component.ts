import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-botao',
  standalone: true,
  imports: [],
  templateUrl: './botao.component.html',
  styleUrl: './botao.component.scss',
})
export class Botao {

  @Input() variante: 'primario' | 'secundario' | 'perigo' = 'primario';
  
  @Output() acaoBotao = new EventEmitter<void>();

  onClick() {
    this.acaoBotao.emit();
  }
}
