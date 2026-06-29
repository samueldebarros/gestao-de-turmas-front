import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard-index.component.js').then((m) => m.DashboardIndexComponent),
    title: 'Dashboard',
  },
];
