import { provideHttpClient, withFetch, withInterceptors, withXsrfConfiguration } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideIngressoOverlays } from 'components';
import {
  apiErrorInterceptor,
  AUTH_API,
  CLIENTS_API,
  HttpAuthApi,
  HttpClientsApi,
  HttpProfileApi,
  CONSENT_API,
  CONNECTED_APPS_API,
  HttpConnectedAppsApi,
  HttpConsentApi,
  PROFILE_API,
  HttpTilesApi,
  TILES_API,
} from 'api';
import { routes } from './app.routes';
import { unauthorizedInterceptor } from './shared/unauthorized.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIngressoOverlays(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(
      withFetch(),
      withXsrfConfiguration({ cookieName: 'XSRF-TOKEN', headerName: 'X-XSRF-TOKEN' }),
      withInterceptors([unauthorizedInterceptor, apiErrorInterceptor]),
    ),
    { provide: AUTH_API, useClass: HttpAuthApi },
    { provide: TILES_API, useClass: HttpTilesApi },
    { provide: CLIENTS_API, useClass: HttpClientsApi },
    { provide: PROFILE_API, useClass: HttpProfileApi },
    { provide: CONSENT_API, useClass: HttpConsentApi },
    { provide: CONNECTED_APPS_API, useClass: HttpConnectedAppsApi },
  ],
};
