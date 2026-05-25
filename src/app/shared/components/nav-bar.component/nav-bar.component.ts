import { Component, inject } from '@angular/core';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Botao } from '../botao/botao.component';

@Component({
  selector: 'app-nav-bar',
  imports: [Botao, TranslatePipe],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent {
  private readonly translate = inject(TranslateService);

  public trocarIdioma(idioma: string) {
    this.translate.use(idioma);
  }
}
