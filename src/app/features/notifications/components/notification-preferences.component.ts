import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  template: `
    <div class="preferences-container">
      <div class="preferences-header">
        <h1>
          <mat-icon>settings</mat-icon>
          Notification Preferences
        </h1>
        <p class="subtitle">Configure your notification settings for the Project Controls Reporting Tool</p>
      </div>

      <mat-card class="development-notice">
        <mat-card-header>
          <mat-card-title>🚧 Under Development</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <p>The notification preferences page is currently being optimized for better performance.</p>
          <p>For now, you can:</p>
          <ul>
            <li>Use the notification center to manage individual notifications</li>
            <li>Enable browser notifications from the notification center</li>
            <li>Configure basic settings from your profile page</li>
          </ul>
          
          <div class="actions" style="margin-top: 20px;">
            <button mat-raised-button color="primary" routerLink="/notifications">
              <mat-icon>notifications</mat-icon>
              Go to Notifications
            </button>
            <button mat-button routerLink="/profile" style="margin-left: 10px;">
              <mat-icon>person</mat-icon>
              Profile Settings
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .preferences-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .preferences-header {
      margin-bottom: 24px;
      text-align: center;
    }

    .preferences-header h1 {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 28px;
      font-weight: 500;
      color: #1976d2;
      margin-bottom: 8px;
    }

    .subtitle {
      color: #666;
      font-size: 16px;
      margin: 0;
    }

    .development-notice {
      text-align: center;
    }

    .development-notice mat-card-title {
      font-size: 24px;
      color: #ff9800;
    }

    .development-notice mat-card-content {
      padding-top: 16px;
    }

    .development-notice ul {
      text-align: left;
      max-width: 400px;
      margin: 16px auto;
    }

    .actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
    }

    .actions button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 600px) {
      .preferences-container {
        padding: 16px;
      }
      
      .actions {
        flex-direction: column;
      }
      
      .actions button {
        width: 100%;
      }
    }
  `]
})
export class NotificationPreferencesComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  // Simple loading state
  loading = signal(false);

  ngOnInit() {
    console.log('Notification Preferences component initialized');
  }
}
