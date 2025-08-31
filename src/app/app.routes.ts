import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login.component';
import { RegisterComponent } from './features/auth/pages/register.component';
import { ReportsListComponent } from './features/reports/pages/simple-reports-list.component';
import { ReportDetailsComponent } from './features/reports/components/report-details.component';
import { ProfileComponent } from './features/profile/profile.component';
import { NotificationsComponent } from './features/notifications/pages/notifications.component';
import { NotificationPreferencesComponent } from './features/notifications/components/notification-preferences.component';
import { NotificationManagementComponent } from './features/notifications/pages/notification-management.component';
import { UserManagementComponent } from './features/users/user-management/user-management.component';
import { UserListComponent } from './features/users/user-list/user-list.component';
import { NavigationComponent } from './shared/components/navigation.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Public routes
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  
  // Protected routes with navigation
  {
    path: '',
    component: NavigationComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'reports',
        component: ReportsListComponent
      },
      {
        path: 'reports/review',
        component: ReportsListComponent
      },
      {
        path: 'reports/:id',
        component: ReportDetailsComponent
      },
      {
        path: 'notifications',
        component: NotificationsComponent
      },
      {
        path: 'notifications/preferences',
        component: NotificationPreferencesComponent
      },
      {
        path: 'notifications/setup',
        component: NotificationPreferencesComponent // Will use tabs to show setup
      },
      {
        path: 'notifications/manage',
        component: NotificationManagementComponent
      },
      {
        path: 'users/manage',
        component: UserManagementComponent
      },
      {
        path: 'users/all',
        component: UserListComponent
      },
      {
        path: 'profile',
        component: ProfileComponent
      },
      {
        path: '',
        redirectTo: '/reports',
        pathMatch: 'full'
      }
    ]
  },
  
  // Fallback
  {
    path: '**',
    redirectTo: '/reports'
  }
];
