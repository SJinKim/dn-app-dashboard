import { Routes } from '@angular/router';
import { adminGuard } from '../../core/guards/auth.guard';

export const MEMBERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./members-list/members-list.component').then(m => m.MembersListComponent),
  },
  {
    path: 'new',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./member-edit/member-edit.component').then(m => m.MemberEditComponent),
  },
  {
    path: ':publicId',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./member-detail/member-detail.component').then(m => m.MemberDetailComponent),
  },
  {
    path: ':publicId/edit',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./member-edit/member-edit.component').then(m => m.MemberEditComponent),
  },
];
