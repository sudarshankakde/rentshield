import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService, UserRole } from './core/services/auth.service';
import { routeModules } from './core/services/route-definitions';

const roleGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (!auth.isAuthenticated()) {
    // Return false to cancel navigation. 
    // We don't redirect to '/' because if we're already at '/', it causes an infinite loop.
    // AppComponent shows the login page when !isAuthenticated() regardless of the route.
    return false;
  }

  const path = route.routeConfig?.path ?? '';
  if (path === '' || path === 'auth') {
    return true;
  }

  if (!auth.is2faVerified()) {
    router.navigate(['/auth/two-factor']);
    return false;
  }

  if (!auth.isAuthorized(path)) {
    router.navigate(['/']);
    return false;
  }

  return true;
};

const allRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [roleGuard]
  },
  ...routeModules.map(module => ({
    path: module.path,
    loadComponent: module.loadComponent,
    canActivate: [roleGuard]
  })),
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.AUTH_ROUTES)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

export function createRoutes(role: UserRole | null = null): Routes {
  if (!role) {
    return allRoutes;
  }

  const allowed = routeModules.filter(m => m.roles.includes(role)).map(m => m.path);
  return allRoutes.filter(route => {
    const path = route.path ?? '';
    return path === '' || path === 'auth' || allowed.includes(path);
  });
}

export const routes: Routes = createRoutes();
