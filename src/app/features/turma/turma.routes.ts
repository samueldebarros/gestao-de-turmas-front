import { Routes } from '@angular/router';

export const TURMA_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./turma-index.component.js').then((m) => m.TurmaIndexComponent),
    title: 'Turmas',
  },
];
