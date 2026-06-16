import { Routes } from '@angular/router';
import { autenticadoGuard } from './core/guards/autenticado.guard.js';
import { papelGuard } from './core/guards/papel.guard.js';

export const routes: Routes = [
  {
    path: 'alunos',
    canMatch: [autenticadoGuard, papelGuard('Admin', 'Coordenador', 'Docente')],
    loadChildren: () =>
      import('./shared/components/aluno-index/aluno.routes.js').then((m) => m.ALUNO_ROUTES),
  },
  {
    path: 'docentes',
    canMatch: [autenticadoGuard, papelGuard('Admin', 'Coordenador')],
    loadChildren: () =>
      import('./shared/components/docente-index.component/docente.routes.js').then(
        (m) => m.DOCENTE_ROUTES,
      ),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./shared/components/login.component/login.component.js').then(
        (m) => m.LoginComponent,
      ),
    title: 'Entrar',
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
