import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';

// Services
import { RealTimeService } from '../../../core/services/real-time.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-push-notification-setup',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatDividerModule
  ],
  template: `
    <div class="push-setup-container">
      <mat-card class="setup-card">
        <mat-card-header>
          <div mat-card-avatar>
            <mat-icon class="avatar-icon">notifications_active</mat-icon>
          </div>
          <mat-card-title>Browser Push Notifications</mat-card-title>
          <mat-card-subtitle>Get instant notifications even when the app is closed</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Current Status -->
          <div class="status-section">
            <h3>Current Status</h3>
            <div class="status-item">
              <mat-icon [class]="getPermissionIconClass()">{{ getPermissionIcon() }}</mat-icon>
              <span>Browser Permission: </span>
              <mat-chip [class]="getPermissionChipClass()">{{ getPermissionStatus() }}</mat-chip>
            </div>

            <div class="status-item">
              <mat-icon [class]="getConnectionIconClass()">{{ getConnectionIcon() }}</mat-icon>
              <span>Real-time Connection: </span>
              <mat-chip [class]="getConnectionChipClass()">{{ getConnectionStatus() }}</mat-chip>
            </div>

            <div class="status-item" *ngIf="hasServiceWorker()">
              <mat-icon class="status-success">verified</mat-icon>
              <span>Service Worker: </span>
              <mat-chip class="status-success">Active</mat-chip>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Setup Actions -->
          <div class="setup-section">
            <h3>Setup Push Notifications</h3>
            
            <!-- Step 1: Browser Permission -->
            <div class="setup-step" [class.completed]="isPermissionGranted()">
              <div class="step-header">
                <mat-icon>{{ isPermissionGranted() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <h4>Step 1: Enable Browser Notifications</h4>
              </div>
              <p>Allow this website to show notifications in your browser.</p>
              <button 
                mat-raised-button 
                color="primary" 
                [disabled]="isPermissionGranted() || requesting()"
                (click)="requestPermission()"
              >
                <mat-spinner diameter="20" *ngIf="requesting()"></mat-spinner>
                <mat-icon *ngIf="!requesting()">notifications</mat-icon>
                {{ getPermissionButtonText() }}
              </button>
            </div>

            <!-- Step 2: Test Notification -->
            <div class="setup-step" [class.completed]="testNotificationSent()">
              <div class="step-header">
                <mat-icon>{{ testNotificationSent() ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
                <h4>Step 2: Test Push Notification</h4>
              </div>
              <p>Send a test notification to verify everything is working.</p>
              <button 
                mat-raised-button 
                color="accent" 
                [disabled]="!isPermissionGranted() || sending()"
                (click)="sendTestNotification()"
              >
                <mat-spinner diameter="20" *ngIf="sending()"></mat-spinner>
                <mat-icon *ngIf="!sending()">send</mat-icon>
                Send Test Notification
              </button>
            </div>

            <!-- Step 3: Configure Settings -->
            <div class="setup-step">
              <div class="step-header">
                <mat-icon>settings</mat-icon>
                <h4>Step 3: Notification Preferences</h4>
              </div>
              <p>Configure which types of notifications you want to receive.</p>
              
              <div class="notification-toggles">
                <mat-slide-toggle 
                  [(ngModel)]="preferences.reportSubmissions"
                  [disabled]="!isPermissionGranted()"
                  (change)="savePreferences()"
                >
                  Report Submissions
                </mat-slide-toggle>

                <mat-slide-toggle 
                  [(ngModel)]="preferences.approvalRequests"
                  [disabled]="!isPermissionGranted()"
                  (change)="savePreferences()"
                >
                  Approval Requests
                </mat-slide-toggle>

                <mat-slide-toggle 
                  [(ngModel)]="preferences.statusUpdates"
                  [disabled]="!isPermissionGranted()"
                  (change)="savePreferences()"
                >
                  Status Updates
                </mat-slide-toggle>

                <mat-slide-toggle 
                  [(ngModel)]="preferences.systemAlerts"
                  [disabled]="!isPermissionGranted()"
                  (change)="savePreferences()"
                >
                  System Alerts
                </mat-slide-toggle>
              </div>
            </div>
          </div>

          <mat-divider></mat-divider>

          <!-- Help Section -->
          <div class="help-section">
            <h3>Need Help?</h3>
            <div class="help-content">
              <div class="help-item">
                <mat-icon>help</mat-icon>
                <div>
                  <strong>Notifications not working?</strong>
                  <p>Make sure notifications are enabled in your browser settings and you're connected to the internet.</p>
                </div>
              </div>

              <div class="help-item">
                <mat-icon>privacy_tip</mat-icon>
                <div>
                  <strong>Privacy</strong>
                  <p>Notifications are sent securely and only contain information relevant to your work. You can disable them at any time.</p>
                </div>
              </div>

              <div class="help-item">
                <mat-icon>schedule</mat-icon>
                <div>
                  <strong>Timing</strong>
                  <p>Push notifications are sent immediately when events occur, even when you're not actively using the app.</p>
                </div>
              </div>
            </div>
          </div>
        </mat-card-content>

        <mat-card-actions>
          <button mat-button (click)="refreshStatus()">
            <mat-icon>refresh</mat-icon>
            Refresh Status
          </button>
          <button mat-button color="warn" (click)="disableNotifications()" [disabled]="!isPermissionGranted()">
            <mat-icon>notifications_off</mat-icon>
            Disable Notifications
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .push-setup-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    .setup-card {
      margin-bottom: 24px;
    }

    .avatar-icon {
      background: #2196f3;
      color: white;
      border-radius: 50%;
      padding: 8px;
    }

    .status-section, .setup-section, .help-section {
      margin: 24px 0;
    }

    .status-section h3, .setup-section h3, .help-section h3 {
      margin-bottom: 16px;
      color: #333;
      font-weight: 500;
    }

    .status-item {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding: 8px;
      border-radius: 8px;
      background: #f5f5f5;
    }

    .status-success {
      color: #4caf50;
    }

    .status-warning {
      color: #ff9800;
    }

    .status-error {
      color: #f44336;
    }

    .setup-step {
      margin: 24px 0;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      transition: all 0.3s ease;
    }

    .setup-step.completed {
      border-color: #4caf50;
      background: #f1f8e9;
    }

    .step-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .step-header h4 {
      margin: 0;
      font-weight: 500;
    }

    .step-header mat-icon {
      color: #4caf50;
    }

    .setup-step:not(.completed) .step-header mat-icon {
      color: #ccc;
    }

    .notification-toggles {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
    }

    .help-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .help-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .help-item mat-icon {
      color: #2196f3;
      margin-top: 2px;
    }

    .help-item div {
      flex: 1;
    }

    .help-item strong {
      display: block;
      margin-bottom: 4px;
    }

    .help-item p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    mat-chip.status-success {
      background: #e8f5e8;
      color: #2e7d32;
    }

    mat-chip.status-warning {
      background: #fff3e0;
      color: #e65100;
    }

    mat-chip.status-error {
      background: #ffebee;
      color: #c62828;
    }

    @media (max-width: 768px) {
      .push-setup-container {
        padding: 16px;
      }

      .setup-step {
        padding: 12px;
      }

      .help-item {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class PushNotificationSetupComponent implements OnInit {
  private readonly realTimeService = inject(RealTimeService);
  private readonly notificationService = inject(NotificationService);
  private readonly snackBar = inject(MatSnackBar);

  // State signals
  requesting = signal(false);
  sending = signal(false);
  testNotificationSent = signal(false);

  // Notification preferences
  preferences = {
    reportSubmissions: true,
    approvalRequests: true,
    statusUpdates: true,
    systemAlerts: false
  };

  ngOnInit(): void {
    this.loadPreferences();
  }

  // Permission methods
  isPermissionGranted(): boolean {
    return Notification.permission === 'granted';
  }

  async requestPermission(): Promise<void> {
    this.requesting.set(true);
    
    try {
      const granted = await this.realTimeService.requestNotificationPermission();
      
      if (granted) {
        this.snackBar.open('✅ Browser notifications enabled successfully!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      } else {
        this.snackBar.open('❌ Notification permission denied. You can enable it later in browser settings.', 'Close', {
          duration: 5000,
          panelClass: ['warning-snackbar']
        });
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      this.snackBar.open('Failed to request notification permission', 'Close', {
        duration: 3000
      });
    } finally {
      this.requesting.set(false);
    }
  }

  async sendTestNotification(): Promise<void> {
    if (!this.isPermissionGranted()) {
      this.snackBar.open('Please enable browser notifications first', 'Close', {
        duration: 3000
      });
      return;
    }

    this.sending.set(true);

    try {
      // Send test notification via service
      const testNotification = {
        title: '🔔 Test Notification',
        message: 'This is a test notification from Project Controls Reporting Tool. Your push notifications are working correctly!',
        type: 'Info' as const,
        priority: 'Normal' as const,
        actionUrl: '/notifications',
        actionText: 'View Notifications'
      };

      // Create a mock notification for testing
      const mockNotification = {
        id: `test-${Date.now()}`,
        ...testNotification,
        isRead: false,
        createdAt: new Date().toISOString(),
        userId: 'current-user'
      };

      // Add to notification service
      this.notificationService.addNotification(mockNotification);

      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const browserNotification = new Notification(testNotification.title, {
          body: testNotification.message,
          icon: '/assets/icons/icon-192x192.svg',
          badge: '/assets/icons/icon-72x72.png',
          tag: 'test-notification',
          requireInteraction: false
        });

        browserNotification.onclick = () => {
          window.focus();
          browserNotification.close();
        };

        setTimeout(() => browserNotification.close(), 5000);
      }

      this.testNotificationSent.set(true);
      this.snackBar.open('✅ Test notification sent successfully!', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar']
      });

    } catch (error) {
      console.error('Error sending test notification:', error);
      this.snackBar.open('Failed to send test notification', 'Close', {
        duration: 3000
      });
    } finally {
      this.sending.set(false);
    }
  }

  savePreferences(): void {
    try {
      localStorage.setItem('pushNotificationPreferences', JSON.stringify(this.preferences));
      this.snackBar.open('Preferences saved', 'Close', {
        duration: 2000
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
    }
  }

  loadPreferences(): void {
    try {
      const saved = localStorage.getItem('pushNotificationPreferences');
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  }

  refreshStatus(): void {
    // Force refresh component state
    this.testNotificationSent.set(false);
    this.snackBar.open('Status refreshed', 'Close', {
      duration: 1000
    });
  }

  disableNotifications(): void {
    if (this.isPermissionGranted()) {
      this.snackBar.open(
        'To disable notifications, go to your browser settings and block notifications for this site.',
        'Close',
        { duration: 5000 }
      );
    }
  }

  hasServiceWorker(): boolean {
    return 'serviceWorker' in navigator;
  }

  // Status helper methods
  getPermissionStatus(): string {
    switch (Notification.permission) {
      case 'granted': return 'Enabled';
      case 'denied': return 'Blocked';
      default: return 'Not Set';
    }
  }

  getPermissionIcon(): string {
    switch (Notification.permission) {
      case 'granted': return 'check_circle';
      case 'denied': return 'block';
      default: return 'help';
    }
  }

  getPermissionIconClass(): string {
    switch (Notification.permission) {
      case 'granted': return 'status-success';
      case 'denied': return 'status-error';
      default: return 'status-warning';
    }
  }

  getPermissionChipClass(): string {
    switch (Notification.permission) {
      case 'granted': return 'status-success';
      case 'denied': return 'status-error';
      default: return 'status-warning';
    }
  }

  getPermissionButtonText(): string {
    if (this.requesting()) return 'Requesting...';
    if (this.isPermissionGranted()) return 'Already Enabled';
    if (Notification.permission === 'denied') return 'Blocked - Check Browser Settings';
    return 'Enable Notifications';
  }

  getConnectionStatus(): string {
    const status = this.realTimeService.connectionStatus();
    return status.isConnected ? 'Connected' : 'Disconnected';
  }

  getConnectionIcon(): string {
    const status = this.realTimeService.connectionStatus();
    return status.isConnected ? 'wifi' : 'wifi_off';
  }

  getConnectionIconClass(): string {
    const status = this.realTimeService.connectionStatus();
    return status.isConnected ? 'status-success' : 'status-error';
  }

  getConnectionChipClass(): string {
    const status = this.realTimeService.connectionStatus();
    return status.isConnected ? 'status-success' : 'status-error';
  }
}
