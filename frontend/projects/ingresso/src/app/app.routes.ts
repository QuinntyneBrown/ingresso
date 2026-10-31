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
    path: 'forbidden',
    title: 'No access · ingresso',
    loadComponent: () => import('./pages/status/forbidden-page').then((m) => m.ForbiddenPage),
  },
  {
    path: 'error',
    title: 'Something went wrong · ingresso',
    loadComponent: () => import('./pages/status/server-error-page').then((m) => m.ServerErrorPage),
  },
  {
    path: 'offline',
    title: 'Offline · ingresso',
    loadComponent: () => import('./pages/status/offline-page').then((m) => m.OfflinePage),
  },
  {
    path: '**',
    title: 'Page not found · ingresso',
    loadComponent: () => import('./pages/status/not-found-page').then((m) => m.NotFoundPage),
  },
];
