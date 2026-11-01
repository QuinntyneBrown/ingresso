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
    // Outside the shell: an app's sign-in request may come from someone who is signed out (L2-094).
    path: 'authorize-error',
    title: 'Can’t sign in to this app · ingresso',
    loadComponent: () => import('./pages/status/authorize-error-page').then((m) => m.AuthorizeErrorPage),
  },
  {
    // Outside the shell, like signing in for an app: it is part of an app's sign-in request (L2-121, ADR 0018).
    path: 'consent',
    title: 'Approve an app · ingresso',
    loadComponent: () => import('./pages/consent/consent-page').then((m) => m.ConsentPage),
  },
  {
    // Outside the shell: the session has already ended (L2-100, L2-101).
    path: 'signed-out',
    title: 'Signed out · ingresso',
    loadComponent: () => import('./pages/signed-out/signed-out-page').then((m) => m.SignedOutPage),
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
        path: 'settings',
        title: 'Settings · ingresso',
        loadComponent: () => import('./pages/settings/settings-page').then((m) => m.SettingsPage),
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
