import { Routes } from '@angular/router';
import { autenticadoGuard } from './core/guards/autenticado.guard.js';
import { acessoGuard } from './core/guards/acesso.guard.js';

export const routes: Routes = [
  {
    path: 'alunos',
    canMatch: [autenticadoGuard, acessoGuard('alunos.acessar')],
    loadChildren: () => import('./features/aluno/aluno.routes.js').then((m) => m.ALUNO_ROUTES),
  },
  {
    path: 'docentes',
    canMatch: [autenticadoGuard, acessoGuard('docentes.acessar')],
    loadChildren: () =>
      import('./features/docente/docente.routes.js').then((m) => m.DOCENTE_ROUTES),
  },
  {
    path: 'dashboard',
    canMatch: [autenticadoGuard, acessoGuard('dashboard.acessar')],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes.js').then((m) => m.DASHBOARD_ROUTES),
  },
  {
    path: 'turmas',
    canMatch: [autenticadoGuard, acessoGuard('turmas.acessar')],
    loadChildren: () => import('./features/turma/turma.routes.js').then((m) => m.TURMA_ROUTES),
  },
  {
    path: 'tree-view',
    canMatch: [autenticadoGuard, acessoGuard('tree-view.acessar')],
    loadChildren: () =>
      import('./features/tree-view/tree-view.routes.js').then((m) => m.TREE_VIEW_ROUTES),
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
