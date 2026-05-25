import { Component, inject, signal } from '@angular/core';
import { AlunoIndex } from './shared/components/aluno-index/aluno-index.component.js';
import { TranslateService } from '@ngx-translate/core';
import { NavBarComponent } from './shared/components/nav-bar.component/nav-bar.component.js';

@Component({
  selector: 'app-root',
  imports: [AlunoIndex, NavBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('gestao-turmas-front');
  private readonly translate = inject(TranslateService);

  constructor() {
    this.translate.addLangs(['pt-BR', 'en']);
    this.translate.setFallbackLang('pt-BR');
    this.translate.use('pt-BR');
  }
}
