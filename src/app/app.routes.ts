import { Routes } from '@angular/router';
import { autenticadoGuard } from './core/guards/autenticado.guard.js';
import { papelGuard } from './core/guards/papel.guard.js';

export const routes: Routes = [
  {
    path: 'alunos',
    canMatch: [autenticadoGuard, papelGuard('Admin', 'Coordenador', 'Docente')],
    loadChildren: () => import('./features/aluno/aluno.routes.js').then((m) => m.ALUNO_ROUTES),
  },
  {
    path: 'docentes',
    canMatch: [autenticadoGuard, papelGuard('Admin', 'Coordenador')],
    loadChildren: () =>
      import('./features/docente/docente.routes.js').then((m) => m.DOCENTE_ROUTES),
  },
  {
    path: 'dashboard',
    canMatch: [autenticadoGuard, papelGuard('Admin', 'Coordenador')],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes.js').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component.js').then((m) => m.LoginComponent),
    title: 'Entrar',
  },
  {
    path: 'sem-permissao',
    loadComponent: () =>
      import('./features/sem-permissao.component/sem-permissao.component.js').then(
        (m) => m.SemPermissaoComponent,
      ),
    title: 'Acesso Negado',
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: '' },
];
