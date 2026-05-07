import { Component, signal } from '@angular/core';
import { AlunoIndex } from "./shared/components/aluno-index/aluno-index.component.js";

@Component({
  selector: 'app-root',
  imports: [AlunoIndex],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('gestao-turmas-front');
}
