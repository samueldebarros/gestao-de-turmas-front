import { Routes } from '@angular/router';

export const DOCENTE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./docente-index.component.js').then((m) => m.DocenteIndexComponent),
    title: 'Docentes',
  },
];
