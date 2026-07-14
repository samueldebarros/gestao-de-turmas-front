import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthFacadeService } from '../../../core/facades/auth-facade.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-nav-bar',
  imports: [TranslatePipe, RouterLink, RouterLinkActive, AsyncPipe],
  standalone: true,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent {
  private readonly translate = inject(TranslateService);
  protected readonly papel$ = inject(AuthFacadeService).papel$;
  protected readonly idiomaAtual = signal(this.translate.getCurrentLang() ?? 'pt-BR');

  public trocarIdioma(idioma: string) {
    this.translate.use(idioma);
    this.idiomaAtual.set(idioma);
  }
}
