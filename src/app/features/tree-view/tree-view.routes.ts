import { Routes } from '@angular/router';

export const TREE_VIEW_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./tree-view-index.component.js').then((m) => m.TreeViewIndex),
    title: 'Tree View',
  },
];
