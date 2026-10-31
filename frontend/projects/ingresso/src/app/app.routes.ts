import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'ingresso',
    loadComponent: () => import('./pages/dashboard/dashboard-page').then((m) => m.DashboardPage),
  },
  {
    path: 'directory',
    title: 'Directory · ingresso',
    loadComponent: () => import('./pages/directory/directory-page').then((m) => m.DirectoryPage),
  },
  {
    path: '**',
    title: 'Page not found · ingresso',
    loadComponent: () => import('./pages/status/not-found-page').then((m) => m.NotFoundPage),
  },
];
