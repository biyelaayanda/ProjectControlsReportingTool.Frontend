import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { AuthService } from '../../core/services/auth.service';
import { UserRole, Department } from '../../core/models/enums';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles?: UserRole[];
  children?: MenuItem[];
}

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    MatListModule,
    MatDividerModule,
    MatBadgeModule
  ],
  template: `
    <div class="app-container">
      <mat-sidenav-container class="sidenav-container">
        <!-- Side Navigation -->
        <mat-sidenav
          #drawer
          class="sidenav"
          fixedInViewport
          [attr.role]="isHandset() ? 'dialog' : 'navigation'"
          [mode]="isHandset() ? 'over' : 'side'"
          [opened]="!isHandset()"
        >
          <mat-toolbar class="sidenav-header">
            <img src="assets/logo.svg" alt="Logo" class="logo" />
            <span class="app-title">Project Controls</span>
          </mat-toolbar>
          
          <mat-nav-list>
            @for (item of visibleMenuItems(); track item.route) {
              @if (item.children && item.children.length > 0) {
                <!-- Menu item with children -->
                <div class="menu-section">
                  <h3 mat-subheader>{{ item.label }}</h3>
                  @for (child of getVisibleChildren(item.children); track child.route) {
                    <a mat-list-item [routerLink]="child.route" routerLinkActive="active">
                      <mat-icon matListItemIcon>{{ child.icon }}</mat-icon>
                      <span matListItemTitle>{{ child.label }}</span>
                    </a>
                  }
                </div>
              } @else {
                <!-- Simple menu item -->
                <a mat-list-item [routerLink]="item.route" routerLinkActive="active">
                  <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
                  <span matListItemTitle>{{ item.label }}</span>
                </a>
              }
            }
          </mat-nav-list>
        </mat-sidenav>

        <!-- Main Content Area -->
        <mat-sidenav-content>
          <!-- Top Toolbar -->
          <mat-toolbar color="primary" class="main-toolbar">
            <button
              type="button"
              aria-label="Toggle sidenav"
              mat-icon-button
              (click)="drawer.toggle()"
              *ngIf="isHandset()"
            >
              <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
            </button>
            
            <span class="toolbar-spacer"></span>
            
            <!-- Notifications -->
            <button mat-icon-button>
              <mat-icon matBadge="3" matBadgeColor="accent">notifications</mat-icon>
            </button>
            
            <!-- User Menu -->
            <button mat-icon-button [matMenuTriggerFor]="userMenu">
              <mat-icon>account_circle</mat-icon>
            </button>
            
            <mat-menu #userMenu="matMenu">
              <div class="user-info">
                <div class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</div>
                <div class="user-role">{{ getRoleDisplayName(currentUser()?.role) }}</div>
                <div class="user-department">{{ getDepartmentDisplayName(currentUser()?.department) }}</div>
              </div>
              <mat-divider></mat-divider>
              <button mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon>
                <span>Profile</span>
              </button>
              <button mat-menu-item routerLink="/settings">
                <mat-icon>settings</mat-icon>
                <span>Settings</span>
              </button>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon>
                <span>Logout</span>
              </button>
            </mat-menu>
          </mat-toolbar>

          <!-- Page Content -->
          <div class="main-content">
            <router-outlet></router-outlet>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .app-container {
      height: 100vh;
    }

    .sidenav-container {
      height: 100%;
    }

    .sidenav {
      width: 250px;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      padding: 16px;
      background-color: #1976d2;
      color: white;
    }

    .logo {
      width: 32px;
      height: 32px;
      margin-right: 12px;
    }

    .app-title {
      font-size: 1.1rem;
      font-weight: 500;
    }

    .main-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .main-content {
      padding: 20px;
      min-height: calc(100vh - 64px);
      background-color: #f5f5f5;
    }

    .user-info {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .user-name {
      font-weight: 500;
      font-size: 1rem;
      color: #333;
    }

    .user-role,
    .user-department {
      font-size: 0.875rem;
      color: #666;
      margin-top: 2px;
    }

    .menu-section {
      margin-bottom: 16px;
    }

    .menu-section h3 {
      color: #666;
      font-size: 0.875rem;
      font-weight: 500;
      margin: 16px 0 8px 0;
    }

    mat-list-item {
      border-radius: 8px;
      margin: 4px 8px;
    }

    mat-list-item.active {
      background-color: rgba(25, 118, 210, 0.1);
      color: #1976d2;
    }

    mat-list-item.active mat-icon {
      color: #1976d2;
    }

    mat-list-item:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    @media (max-width: 768px) {
      .main-content {
        padding: 16px;
      }
      
      .sidenav {
        width: 280px;
      }
    }
  `]
})
export class NavigationComponent {
  private breakpointObserver = inject(BreakpointObserver);
  private authService = inject(AuthService);
  private router = inject(Router);

  currentUser = computed(() => this.authService.currentUser());
  
  isHandset = computed(() => 
    this.breakpointObserver.isMatched(Breakpoints.Handset)
  );

  private menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard'
    },
    {
      label: 'Reports',
      icon: 'description',
      route: '/reports',
      children: [
        {
          label: 'My Reports',
          icon: 'folder',
          route: '/reports/my-reports'
        },
        {
          label: 'Create Report',
          icon: 'add_circle',
          route: '/reports/create'
        },
        {
          label: 'Review Reports',
          icon: 'rate_review',
          route: '/reports/review',
          roles: [UserRole.LineManager, UserRole.Executive]
        },
        {
          label: 'All Reports',
          icon: 'list_alt',
          route: '/reports/all',
          roles: [UserRole.Executive]
        }
      ]
    },
    {
      label: 'Analytics',
      icon: 'analytics',
      route: '/analytics',
      roles: [UserRole.LineManager, UserRole.Executive]
    },
    {
      label: 'Users',
      icon: 'people',
      route: '/users',
      roles: [UserRole.Executive],
      children: [
        {
          label: 'All Users',
          icon: 'group',
          route: '/users/all',
          roles: [UserRole.Executive]
        },
        {
          label: 'User Management',
          icon: 'admin_panel_settings',
          route: '/users/manage',
          roles: [UserRole.Executive]
        }
      ]
    },
    {
      label: 'Administration',
      icon: 'admin_panel_settings',
      route: '/admin',
      roles: [UserRole.Executive],
      children: [
        {
          label: 'System Settings',
          icon: 'settings',
          route: '/admin/settings',
          roles: [UserRole.Executive]
        },
        {
          label: 'Audit Logs',
          icon: 'history',
          route: '/admin/audit-logs',
          roles: [UserRole.Executive]
        },
        {
          label: 'Department Management',
          icon: 'business',
          route: '/admin/departments',
          roles: [UserRole.Executive]
        }
      ]
    }
  ];

  visibleMenuItems = computed(() => {
    const userRole = this.currentUser()?.role;
    if (!userRole) return [];

    return this.menuItems.filter(item => 
      !item.roles || item.roles.includes(userRole)
    );
  });

  getVisibleChildren(children: MenuItem[]): MenuItem[] {
    const userRole = this.currentUser()?.role;
    if (!userRole) return [];

    return children.filter(child => 
      !child.roles || child.roles.includes(userRole)
    );
  }

  getRoleDisplayName(role?: UserRole): string {
    switch (role) {
      case UserRole.GeneralStaff:
        return 'General Staff';
      case UserRole.LineManager:
        return 'Line Manager';
      case UserRole.Executive:
        return 'Executive';
      default:
        return '';
    }
  }

  getDepartmentDisplayName(department?: Department): string {
    switch (department) {
      case Department.ProjectSupport:
        return 'Project Support';
      case Department.DocManagement:
        return 'Document Management';
      case Department.QS:
        return 'QS';
      case Department.ContractsManagement:
        return 'Contracts Management';
      case Department.BusinessAssurance:
        return 'Business Assurance';
      default:
        return '';
    }
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
