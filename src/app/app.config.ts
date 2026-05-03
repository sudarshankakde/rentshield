import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideAngularQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

const queryClient = new QueryClient();

// Expose for DevTools
(window as any).__TANSTACK_QUERY_CLIENT__ = queryClient;

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideAngularQuery(queryClient),
    // NgRx and other providers will be added here
  ]
};
