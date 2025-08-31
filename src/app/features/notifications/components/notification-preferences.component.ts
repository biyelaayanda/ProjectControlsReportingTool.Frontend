import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Components
import { PushNotificationSetupComponent } from './push-notification-setup.component';
import { EmailTriggerConfigComponent } from './email-trigger-config.component';

// Services
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { RealTimeService } from '../../../core/services/real-time.service';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    PushNotificationSetupComponent,
    EmailTriggerConfigComponent
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

      <!-- Status Overview -->
      <mat-card class="status-overview">
        <mat-card-content>
          <div class="status-grid">
            <div class="status-item">
              <mat-icon class="status-icon email">email</mat-icon>
              <div>
                <strong>Email System</strong>
                <span class="status-label success">✅ Operational</span>
              </div>
            </div>

            <div class="status-item">
              <mat-icon class="status-icon realtime">wifi</mat-icon>
              <div>
                <strong>Real-Time</strong>
                <span [class]="'status-label ' + (isConnected() ? 'success' : 'warning')">
                  {{ isConnected() ? '✅ Connected' : '⚠️ Disconnected' }}
                </span>
              </div>
            </div>

            <div class="status-item">
              <mat-icon class="status-icon push">notifications</mat-icon>
              <div>
                <strong>Push Notifications</strong>
                <span [class]="'status-label ' + (hasPushPermission() ? 'success' : 'info')">
                  {{ hasPushPermission() ? '✅ Enabled' : 'ℹ️ Setup Available' }}
                </span>
              </div>
            </div>

            <div class="status-item">
              <mat-icon class="status-icon notifications">inbox</mat-icon>
              <div>
                <strong>Unread Notifications</strong>
                <span class="status-label info">{{ unreadCount() }} unread</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Notification Configuration Tabs -->
      <mat-card class="config-card">
        <mat-tab-group>
          <!-- Push Notifications Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>notifications_active</mat-icon>
              Browser Notifications
            </ng-template>
            
            <div class="tab-content">
              <app-push-notification-setup></app-push-notification-setup>
            </div>
          </mat-tab>

          <!-- Email Triggers Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>email</mat-icon>
              Email Triggers
            </ng-template>
            
            <div class="tab-content">
              <app-email-trigger-config></app-email-trigger-config>
            </div>
          </mat-tab>

          <!-- Quick Settings Tab -->
          <mat-tab>
            <ng-template mat-tab-label>
              <mat-icon>tune</mat-icon>
              Quick Settings
            </ng-template>
            
            <div class="tab-content">
              <div class="quick-settings">
                <mat-card>
                  <mat-card-header>
                    <mat-card-title>Quick Actions</mat-card-title>
                    <mat-card-subtitle>Common notification preferences</mat-card-subtitle>
                  </mat-card-header>

                  <mat-card-content>
                    <div class="quick-actions">
                      <button 
                        mat-raised-button 
                        color="primary" 
                        (click)="enableAllNotifications()"
                        [disabled]="loading()"
                      >
                        <mat-icon>notifications_active</mat-icon>
                        Enable All Notifications
                      </button>

                      <button 
                        mat-raised-button 
                        color="accent" 
                        (click)="refreshNotifications()"
                        [disabled]="loading()"
                      >
                        <mat-icon>refresh</mat-icon>
                        Refresh Notifications
                      </button>

                      <button 
                        mat-raised-button 
                        (click)="clearAllNotifications()"
                        [disabled]="loading()"
                      >
                        <mat-icon>clear_all</mat-icon>
                        Clear All Read
                      </button>

                      <button 
                        mat-button 
                        color="warn" 
                        (click)="testNotificationSystem()"
                        [disabled]="loading()"
                      >
                        <mat-icon>science</mat-icon>
                        Test System
                      </button>
                    </div>

                    <mat-spinner *ngIf="loading()" diameter="30"></mat-spinner>
                  </mat-card-content>
                </mat-card>

                <mat-card>
                  <mat-card-header>
                    <mat-card-title>System Information</mat-card-title>
                  </mat-card-header>

                  <mat-card-content>
                    <div class="system-info">
                      <div class="info-item">
                        <strong>Backend Email System:</strong>
                        <span>EmailNotificationService & WorkflowNotificationService operational</span>
                      </div>

                      <div class="info-item">
                        <strong>Real-Time Connection:</strong>
                        <span>{{ getConnectionInfo() }}</span>
                      </div>

                      <div class="info-item">
                        <strong>Browser Support:</strong>
                        <span>{{ getBrowserSupport() }}</span>
                      </div>

                      <div class="info-item">
                        <strong>Service Worker:</strong>
                        <span>{{ getServiceWorkerStatus() }}</span>
                      </div>
                    </div>
                  </mat-card-content>
                </mat-card>
              </div>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card>

      <!-- Help and Support -->
      <mat-card class="help-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>help</mat-icon>
            Need Help?
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div class="help-content">
            <div class="help-section">
              <h3>Getting Started</h3>
              <ul>
                <li>Enable browser notifications for instant alerts</li>
                <li>Configure email triggers for workflow events</li>
                <li>Test your settings to ensure they work correctly</li>
              </ul>
            </div>

            <div class="help-section">
              <h3>Troubleshooting</h3>
              <ul>
                <li>If notifications aren't working, check browser permissions</li>
                <li>Ensure you're connected to the internet for real-time updates</li>
                <li>Try refreshing the page if connections seem stuck</li>
              </ul>
            </div>

            <div class="help-section">
              <h3>Contact Support</h3>
              <p>For technical issues or questions about notification settings, contact your system administrator.</p>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .preferences-container {
      padding: 24px;
      max-width: 1200px;
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

    .status-overview, .config-card, .help-card {
      margin-bottom: 24px;
    }

    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .status-icon {
      padding: 8px;
      border-radius: 50%;
      color: white;
    }

    .status-icon.email {
      background: #4caf50;
    }

    .status-icon.realtime {
      background: #2196f3;
    }

    .status-icon.push {
      background: #ff9800;
    }

    .status-icon.notifications {
      background: #9c27b0;
    }

    .status-item strong {
      display: block;
      font-weight: 500;
    }

    .status-label {
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
    }

    .status-label.success {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .status-label.warning {
      background: #fff3e0;
      color: #e65100;
    }

    .status-label.info {
      background: #e3f2fd;
      color: #1565c0;
    }

    .tab-content {
      padding: 24px 0;
    }

    .quick-settings {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 16px;
    }

    .quick-actions button {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
    }

    .system-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #eee;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .help-content {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
    }

    .help-section h3 {
      margin: 0 0 12px 0;
      color: #333;
      font-weight: 500;
    }

    .help-section ul {
      margin: 0;
      padding-left: 20px;
    }

    .help-section li {
      margin-bottom: 8px;
      line-height: 1.4;
    }

    @media (max-width: 768px) {
      .preferences-container {
        padding: 16px;
      }

      .status-grid {
        grid-template-columns: 1fr;
      }

      .quick-actions {
        grid-template-columns: 1fr;
      }

      .help-content {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class NotificationPreferencesComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private realTimeService = inject(RealTimeService);

  // State
  loading = signal(false);

  // Computed properties
  unreadCount = this.notificationService.unreadCount;
  isConnected = () => this.realTimeService.connectionStatus().isConnected;

  ngOnInit() {
    console.log('Notification Preferences component initialized');
    // Load initial notification data
    this.notificationService.loadNotifications();
  }

  hasPushPermission(): boolean {
    return Notification.permission === 'granted';
  }

  async enableAllNotifications(): Promise<void> {
    this.loading.set(true);
    
    try {
      // Request push permission if not already granted
      if (Notification.permission !== 'granted') {
        await this.realTimeService.requestNotificationPermission();
      }
      
      // Enable default email triggers (this would typically call an API)
      localStorage.setItem('allNotificationsEnabled', 'true');
      
      // Refresh notifications
      await this.notificationService.loadNotifications();
      
    } catch (error) {
      console.error('Error enabling all notifications:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async refreshNotifications(): Promise<void> {
    this.loading.set(true);
    
    try {
      await this.notificationService.loadNotifications();
      await this.notificationService.loadStats();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async clearAllNotifications(): Promise<void> {
    this.loading.set(true);
    
    try {
      await this.notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      this.loading.set(false);
    }
  }

  testNotificationSystem(): void {
    // Create a comprehensive test notification
    const testNotification = {
      id: `system-test-${Date.now()}`,
      title: '🧪 Notification System Test',
      message: 'This is a comprehensive test of your notification system. All components are working correctly!',
      type: 'Success' as const,
      priority: 'Normal' as const,
      isRead: false,
      createdAt: new Date().toISOString(),
      userId: 'current-user',
      actionUrl: '/notifications/preferences',
      actionText: 'View Preferences'
    };

    this.notificationService.addNotification(testNotification);

    // Also show browser notification if enabled
    if (this.hasPushPermission()) {
      new Notification(testNotification.title, {
        body: testNotification.message,
        icon: '/assets/icons/icon-192x192.svg'
      });
    }
  }

  getConnectionInfo(): string {
    const status = this.realTimeService.connectionStatus();
    if (status.isConnected) {
      return `Connected (ID: ${status.connectionId?.substring(0, 8)}...)`;
    }
    return `Disconnected (${status.reconnectAttempts} attempts)`;
  }

  getBrowserSupport(): string {
    const features = [];
    if ('Notification' in window) features.push('Push Notifications');
    if ('serviceWorker' in navigator) features.push('Service Worker');
    if (typeof Storage !== 'undefined') features.push('Local Storage');
    
    return features.length > 0 ? features.join(', ') : 'Limited support';
  }

  getServiceWorkerStatus(): string {
    if ('serviceWorker' in navigator) {
      return 'Available and Active';
    }
    return 'Not Available';
  }
}
