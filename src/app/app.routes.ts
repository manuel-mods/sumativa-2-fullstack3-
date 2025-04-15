import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/pages/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import(
        './features/auth/pages/forgot-password/forgot-password.component'
      ).then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./features/forum/pages/home/home.component').then(
        (m) => m.HomeComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'category/:id',
    loadComponent: () =>
      import(
        './features/forum/pages/category-topics/category-topics.component'
      ).then((m) => m.CategoryTopicsComponent),
    canActivate: [authGuard],
  },
  {
    path: 'topic/:id',
    loadComponent: () =>
      import('./features/forum/pages/topic-detail/topic-detail.component').then(
        (m) => m.TopicDetailComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'create-topic',
    loadComponent: () =>
      import('./features/forum/pages/create-topic/create-topic.component').then(
        (m) => m.CreateTopicComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'profile/edit',
    loadComponent: () =>
      import('./features/user/pages/profile-edit/profile-edit.component').then(
        (m) => m.ProfileEditComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'admin',
    loadComponent: () =>
      import(
        './features/admin/pages/admin-dashboard/admin-dashboard.component'
      ).then((m) => m.AdminDashboardComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin/topics',
    loadComponent: () =>
      import(
        './features/admin/pages/manage-topics/manage-topics.component'
      ).then((m) => m.ManageTopicsComponent),
    canActivate: [authGuard, adminGuard],
  },
  {
    path: 'admin/comments',
    loadComponent: () =>
      import(
        './features/admin/pages/manage-comments/manage-comments.component'
      ).then((m) => m.ManageCommentsComponent),
    canActivate: [authGuard, adminGuard],
  },
  { path: '**', redirectTo: '/' },
];
