import { Routes } from '@angular/router';
import { AppShell } from './shell/app-shell';

export const routes: Routes = [
  {
    path: 'sign-in',
    title: 'Sign in · ingresso',
    loadComponent: () => import('./pages/sign-in/sign-in-page').then((m) => m.SignInPage),
  },
  {
    path: 'verify-email',
    title: 'Verify your email · ingresso',
    loadComponent: () => import('./pages/verify-email/verify-email-page').then((m) => m.VerifyEmailPage),
  },
  {
    // Every other screen sits inside the shell: header, main region and footer.
    path: '',
    component: AppShell,
    children: [
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
    ],
  },
];
