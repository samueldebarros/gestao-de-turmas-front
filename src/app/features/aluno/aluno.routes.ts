import { Routes } from '@angular/router';

export const ALUNO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./aluno-index.component.js').then((m) => m.AlunoIndex),
    title: 'Alunos',
  },
];
