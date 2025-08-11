import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/pages/login.component';
import { RegisterComponent } from './features/auth/pages/register.component';
import { DashboardComponent } from './features/dashboard/pages/dashboard.component';
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
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
      }
    ]
  },
  
  // Fallback
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];
