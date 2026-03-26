import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const APP_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/members',
    pathMatch: 'full',
  },
  {
    path: 'members',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/members/members.routes').then(m => m.MEMBERS_ROUTES),
  },
  {
    path: '**',
    redirectTo: '/members',
  },
];
