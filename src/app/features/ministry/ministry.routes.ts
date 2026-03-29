import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/auth.guard';

export const MINISTRY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./ministry-list/ministry-list.component').then(m => m.MinistryListComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'new',
    loadComponent: () =>
      import('./ministry-edit/ministry-edit.component').then(m => m.MinistryEditComponent),
    canActivate: [adminGuard],
  },
  {
    path: ':publicId',
    loadComponent: () =>
      import('./ministry-detail/ministry-detail.component').then(m => m.MinistryDetailComponent),
    canActivate: [adminGuard],
  },
  {
    path: ':publicId/edit',
    loadComponent: () =>
      import('./ministry-edit/ministry-edit.component').then(m => m.MinistryEditComponent),
    canActivate: [adminGuard],
  },
];
