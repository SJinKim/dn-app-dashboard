import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './shell/shell.component';

export const APP_ROUTES: Routes = [
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'members',
        pathMatch: 'full',
      },
      {
        path: 'members',
        loadChildren: () =>
          import('./features/members/members.routes').then(m => m.MEMBERS_ROUTES),
      },
      {
        path: 'ministry',
        loadChildren: () =>
          import('./features/ministry/ministry.routes').then(m => m.MINISTRY_ROUTES),
      },
      {
        path: 'attendance',
        loadChildren: () =>
          import('./features/attendance/attendance.routes').then(m => m.ATTENDANCE_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: '/members',
  },
];
