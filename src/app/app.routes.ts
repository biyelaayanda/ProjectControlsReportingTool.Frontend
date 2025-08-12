import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login.component';
import { RegisterComponent } from './features/auth/pages/register.component';
import { ReportsListComponent } from './features/reports/pages/simple-reports-list.component';
import { ReportDetailsComponent } from './features/reports/components/report-details.component';
import { ProfileComponent } from './features/profile/profile.component';
import { NavigationComponent } from './shared/components/navigation.component';
import { authGuard, roleGuard } from './core/guards/auth.guard';

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
