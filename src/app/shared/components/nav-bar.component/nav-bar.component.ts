import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { AuthFacadeService } from '../../../core/facades/auth-facade.service';
import { ITENS_MENU, pode } from '../../../core/acesso/acesso.util';

@Component({
  selector: 'app-nav-bar',
  imports: [TranslatePipe, RouterLink, RouterLinkActive],
  standalone: true,
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
})
export class NavBarComponent {
  private readonly translate = inject(TranslateService);
  private readonly auth = inject(AuthFacadeService);
  protected readonly itensMenu = computed(() =>
    ITENS_MENU.filter((item) => pode(this.auth.papel(), item.permissao)),
  );
  protected readonly idiomaAtual = signal(this.translate.getCurrentLang() ?? 'pt-BR');

  public trocarIdioma(idioma: string) {
    this.translate.use(idioma);
    this.idiomaAtual.set(idioma);
  }
}
