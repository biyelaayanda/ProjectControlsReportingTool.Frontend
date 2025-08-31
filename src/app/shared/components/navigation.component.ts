import { Component, computed, inject, signal, ViewChild } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

import { AuthService } from '../../core/services/auth.service';
import { UserRole, Department } from '../../core/models/enums';
import { NotificationCenterComponent } from './notification-center.component';

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
    MatBadgeModule,
    MatTooltipModule,
    NotificationCenterComponent
  ],
  template: `
    <div class="app-container">
      <mat-sidenav-container class="sidenav-container">
        <!-- Side Navigation -->
        <mat-sidenav
          #drawer
          class="sidenav"
          fixedInViewport
          [attr.role]="'navigation'"
          [mode]="'over'"
          [opened]="false"
        >
          <mat-toolbar class="sidenav-header">
            <div class="nav-logo-container">
              <img src="assets/randwater-logo.png" alt="Rand Water Logo" class="logo" 
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
              <div class="nav-logo-fallback" style="display: none;">
                <mat-icon class="nav-fallback-icon">water_drop</mat-icon>
              </div>
            </div>
            <div class="app-title-container">
              <span class="app-title">Rand Water</span>
              <span class="app-subtitle">Project Controls</span>
            </div>
          </mat-toolbar>
          
          <mat-nav-list>
            @for (item of visibleMenuItems(); track item.route) {
              @if (item.children && item.children.length > 0) {
                <!-- Menu item with children -->
                <div class="menu-section">
                  <h3 mat-subheader>{{ item.label }}</h3>
                  @for (child of getVisibleChildren(item.children); track child.route) {
                    <a mat-list-item [routerLink]="child.route" routerLinkActive="active" 
                       (click)="onMenuItemClick()">
                      <mat-icon matListItemIcon>{{ child.icon }}</mat-icon>
                      <span matListItemTitle>{{ child.label }}</span>
                    </a>
                  }
                </div>
              } @else {
                <!-- Simple menu item -->
                <a mat-list-item [routerLink]="item.route" routerLinkActive="active" 
                   (click)="onMenuItemClick()">
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
            >
              <mat-icon aria-label="Side nav toggle icon">menu</mat-icon>
            </button>
            
            <span class="toolbar-spacer"></span>
            
            <!-- Notifications -->
            <app-notification-center></app-notification-center>
            
            <!-- User Menu -->
            <button 
              mat-icon-button 
              [matMenuTriggerFor]="userMenu"
              (click)="onUserMenuClick($event)"
              matTooltip="User Menu"
            >
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
              <button mat-menu-item routerLink="/notifications/preferences">
                <mat-icon>notifications_active</mat-icon>
                <span>Notification Preferences</span>
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
      width: 300px;
      background-color: #ffffff;
      box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
      border-right: 1px solid #e0e0e0;
      z-index: 1000;
    }

    .sidenav-header {
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      padding: 16px;
      background: #2E86AB; /* Fallback */
      background: -webkit-linear-gradient(315deg, #2E86AB 0%, #A23B72 50%, #F18F01 100%);
      background: -o-linear-gradient(315deg, #2E86AB 0%, #A23B72 50%, #F18F01 100%);
      background: linear-gradient(135deg, #2E86AB 0%, #A23B72 50%, #F18F01 100%);
      color: white;
      min-height: 80px;
    }

    .nav-logo-container {
      margin-right: 16px;
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
    }

    .logo {
      width: 48px;
      height: 48px;
      background: white;
      border-radius: 8px;
      padding: 4px;
      -o-object-fit: contain;
      object-fit: contain;
    }

    .nav-logo-fallback {
      width: 48px;
      height: 48px;
      background: white;
      border-radius: 8px;
      padding: 4px;
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      -webkit-box-pack: center;
      -ms-flex-pack: center;
      justify-content: center;
    }

    .nav-fallback-icon {
      font-size: 32px !important;
      color: #2E86AB;
      width: 32px;
      height: 32px;
    }

    .app-title-container {
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      flex-direction: column;
    }

    .app-title {
      font-size: 1.3rem;
      font-weight: 600;
      line-height: 1.2;
    }

    .app-subtitle {
      font-size: 0.9rem;
      font-weight: 300;
      opacity: 0.9;
      line-height: 1.2;
    }

    .main-toolbar {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: linear-gradient(90deg, #2E86AB 0%, #1976d2 100%);
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .main-content {
      padding: 20px;
      min-height: calc(100vh - 64px);
      background: linear-gradient(135deg, #f8fbff 0%, #e3f2fd 50%, #ffffff 100%);
      margin-left: 0; /* No margin since we use overlay mode for all screens */
      width: 100%;
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
      background-color: rgba(46, 134, 171, 0.1);
      color: #2E86AB;
      border-left: 4px solid #2E86AB;
    }

    mat-list-item.active mat-icon {
      color: #2E86AB;
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
      
      .sidenav-container {
        position: relative;
      }
      
      .main-toolbar {
        position: sticky;
        top: 0;
        z-index: 1000;
      }
    }

    @media (max-width: 599px) {
      .sidenav {
        width: 100vw;
        max-width: 320px;
      }
      
      .main-content {
        padding: 12px;
      }
      
      .welcome-header {
        flex-direction: column;
        text-align: center;
      }
      
      .nav-logo-container img {
        max-width: 40px;
        height: auto;
      }
      
      .app-title {
        font-size: 1rem;
      }
      
      .app-subtitle {
        font-size: 0.8rem;
      }
    }
  `]
})
export class NavigationComponent {
  @ViewChild('drawer') drawer!: MatSidenav;
  
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  currentUser = computed(() => this.authService.currentUser());
  
  isHandset = computed(() => 
    this.breakpointObserver.isMatched([Breakpoints.Handset, Breakpoints.Small, '(max-width: 768px)'])
  );

  private readonly menuItems: MenuItem[] = [
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
          label: 'My Dashboard',
          icon: 'dashboard',
          route: '/reports'
        },
        {
          label: 'Create Report',
          icon: 'add_circle',
          route: '/reports/create'
        },
        {
          label: 'Department Reviews',
          icon: 'rate_review',
          route: '/reports/review',
          roles: [UserRole.LineManager, UserRole.GM]
        },
        {
          label: 'All Reports',
          icon: 'list_alt',
          route: '/reports/all',
          roles: [UserRole.GM]
        }
      ]
    },
    {
      label: 'Notifications',
      icon: 'notifications',
      route: '/notifications'
    },
    {
      label: 'Analytics',
      icon: 'analytics',
      route: '/analytics',
      roles: [UserRole.LineManager, UserRole.GM]
    },
    {
      label: 'Users',
      icon: 'people',
      route: '/users',
      roles: [UserRole.GM],
      children: [
        {
          label: 'All Users',
          icon: 'group',
          route: '/users/all',
          roles: [UserRole.GM]
        },
        {
          label: 'User Management',
          icon: 'admin_panel_settings',
          route: '/users/manage',
          roles: [UserRole.GM]
        }
      ]
    },
    {
      label: 'Administration',
      icon: 'admin_panel_settings',
      route: '/admin',
      roles: [UserRole.GM],
      children: [
        {
          label: 'System Settings',
          icon: 'settings',
          route: '/admin/settings',
          roles: [UserRole.GM]
        },
        {
          label: 'Audit Logs',
          icon: 'history',
          route: '/admin/audit-logs',
          roles: [UserRole.GM]
        },
        {
          label: 'Department Management',
          icon: 'business',
          route: '/admin/departments'
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
      case UserRole.GM:
        return 'GM';
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

  onUserMenuClick(event: Event): void {
    console.log('User menu clicked', event);
    // The mat-menu will handle opening automatically
    // This is just for debugging
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  onMenuItemClick(): void {
    // Always close sidebar when menu item is clicked (for all screen sizes)
    if (this.drawer) {
      this.drawer.close();
    }
  }
}
