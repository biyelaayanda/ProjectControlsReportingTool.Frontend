import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

export interface NotificationChannel {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  available: boolean;
}

export interface NotificationPreferences {
  userId: string;
  email: {
    enabled: boolean;
    reportSubmission: boolean;
    approvalRequired: boolean;
    reportApproved: boolean;
    reportRejected: boolean;
    dueDateReminders: boolean;
    escalations: boolean;
    systemAlerts: boolean;
  };
  push: {
    enabled: boolean;
    reportSubmission: boolean;
    approvalRequired: boolean;
    reportApproved: boolean;
    reportRejected: boolean;
    dueDateReminders: boolean;
    escalations: boolean;
    systemAlerts: boolean;
  };
  sms: {
    enabled: boolean;
    urgentOnly: boolean;
    escalations: boolean;
    overdue: boolean;
    phoneNumber?: string;
  };
  teams: {
    enabled: boolean;
    channelId?: string;
    reportSubmission: boolean;
    approvals: boolean;
    teamUpdates: boolean;
  };
  slack: {
    enabled: boolean;
    channelId?: string;
    reportSubmission: boolean;
    approvals: boolean;
    teamUpdates: boolean;
  };
  general: {
    quietHours: {
      enabled: boolean;
      startTime: string;
      endTime: string;
    };
    priority: {
      critical: boolean;
      high: boolean;
      normal: boolean;
      low: boolean;
    };
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  };
}

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  template: `
    <div class="notification-preferences">
      <div class="page-header">
        <h1>
          <mat-icon>settings</mat-icon>
          Notification Preferences
        </h1>
        <p>Configure how and when you receive notifications about report workflow events.</p>
      </div>

      <div class="preferences-container" *ngIf="!loading(); else loadingTemplate">
        <!-- Email Notifications -->
        <mat-card class="notification-channel-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>email</mat-icon>
            <mat-card-title>Email Notifications</mat-card-title>
            <mat-card-subtitle>Receive notifications via email</mat-card-subtitle>
            <div class="header-toggle">
              <mat-slide-toggle 
                [(ngModel)]="preferences().email.enabled"
                (change)="onPreferenceChange()"
                color="primary"
              ></mat-slide-toggle>
            </div>
          </mat-card-header>
          
          <mat-card-content *ngIf="preferences().email.enabled">
            <div class="notification-options">
              <div class="option-group">
                <h4>Workflow Events</h4>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().email.reportSubmission"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Report submissions</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().email.approvalRequired"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Approval requests</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().email.reportApproved"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Report approvals</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().email.reportRejected"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Report rejections</span>
                </div>
              </div>

              <div class="option-group">
                <h4>Reminders & Alerts</h4>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().email.dueDateReminders"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Due date reminders</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().email.escalations"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Escalations</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().email.systemAlerts"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>System alerts</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Push Notifications -->
        <mat-card class="notification-channel-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>notifications</mat-icon>
            <mat-card-title>Push Notifications</mat-card-title>
            <mat-card-subtitle>Browser notifications for real-time alerts</mat-card-subtitle>
            <div class="header-toggle">
              <mat-slide-toggle 
                [(ngModel)]="preferences().push.enabled"
                (change)="onPushToggle()"
                color="primary"
              ></mat-slide-toggle>
            </div>
          </mat-card-header>
          
          <mat-card-content *ngIf="preferences().push.enabled">
            <div class="notification-options">
              <div class="option-group">
                <h4>Workflow Events</h4>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().push.reportSubmission"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Report submissions</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().push.approvalRequired"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Approval requests</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().push.reportApproved"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Report approvals</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().push.reportRejected"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Report rejections</span>
                </div>
              </div>

              <div class="option-group">
                <h4>Reminders & Alerts</h4>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().push.dueDateReminders"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Due date reminders</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().push.escalations"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Escalations</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().push.systemAlerts"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>System alerts</span>
                </div>
              </div>
            </div>

            <div class="browser-permission" *ngIf="browserPermissionStatus() !== 'granted'">
              <mat-icon>warning</mat-icon>
              <span>Browser permission required for push notifications</span>
              <button mat-raised-button color="primary" (click)="requestBrowserPermission()">
                Grant Permission
              </button>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- SMS Notifications -->
        <mat-card class="notification-channel-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>sms</mat-icon>
            <mat-card-title>SMS Notifications</mat-card-title>
            <mat-card-subtitle>Text messages for urgent alerts</mat-card-subtitle>
            <div class="header-toggle">
              <mat-slide-toggle 
                [(ngModel)]="preferences().sms.enabled"
                (change)="onPreferenceChange()"
                color="primary"
              ></mat-slide-toggle>
            </div>
          </mat-card-header>
          
          <mat-card-content *ngIf="preferences().sms.enabled">
            <mat-form-field appearance="outline" class="phone-field">
              <mat-label>Phone Number</mat-label>
              <mat-input 
                [(ngModel)]="preferences().sms.phoneNumber"
                (ngModelChange)="onPreferenceChange()"
                placeholder="+1 (555) 123-4567"
                type="tel"
              ></mat-input>
              <mat-icon matSuffix>phone</mat-icon>
            </mat-form-field>

            <div class="notification-options">
              <div class="option-group">
                <h4>SMS Alerts</h4>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().sms.urgentOnly"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Urgent notifications only</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().sms.escalations"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Escalations</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().sms.overdue"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Overdue reports</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- Teams Integration -->
        <mat-card class="notification-channel-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>groups</mat-icon>
            <mat-card-title>Microsoft Teams</mat-card-title>
            <mat-card-subtitle>Team collaboration notifications</mat-card-subtitle>
            <div class="header-toggle">
              <mat-slide-toggle 
                [(ngModel)]="preferences().teams.enabled"
                (change)="onPreferenceChange()"
                color="primary"
              ></mat-slide-toggle>
            </div>
          </mat-card-header>
          
          <mat-card-content *ngIf="preferences().teams.enabled">
            <mat-form-field appearance="outline" class="channel-field">
              <mat-label>Teams Channel</mat-label>
              <mat-select [(ngModel)]="preferences().teams.channelId" (selectionChange)="onPreferenceChange()">
                <mat-option value="general">General</mat-option>
                <mat-option value="reports">Reports</mat-option>
                <mat-option value="management">Management</mat-option>
                <mat-option value="engineering">Engineering</mat-option>
              </mat-select>
            </mat-form-field>

            <div class="notification-options">
              <div class="option-group">
                <h4>Team Notifications</h4>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().teams.reportSubmission"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Report submissions</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().teams.approvals"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Approval requests</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().teams.teamUpdates"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Team updates</span>
                </div>
              </div>
            </div>
          </mat-card-content>
        </mat-card>

        <!-- General Settings -->
        <mat-card class="notification-channel-card">
          <mat-card-header>
            <mat-icon mat-card-avatar>tune</mat-icon>
            <mat-card-title>General Settings</mat-card-title>
            <mat-card-subtitle>Overall notification preferences</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="general-settings">
              <div class="setting-group">
                <h4>Quiet Hours</h4>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().general.quietHours.enabled"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Enable quiet hours</span>
                </div>
                
                <div class="time-settings" *ngIf="preferences().general.quietHours.enabled">
                  <mat-form-field appearance="outline">
                    <mat-label>Start Time</mat-label>
                    <mat-input 
                      [(ngModel)]="preferences().general.quietHours.startTime"
                      (ngModelChange)="onPreferenceChange()"
                      type="time"
                    ></mat-input>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline">
                    <mat-label>End Time</mat-label>
                    <mat-input 
                      [(ngModel)]="preferences().general.quietHours.endTime"
                      (ngModelChange)="onPreferenceChange()"
                      type="time"
                    ></mat-input>
                  </mat-form-field>
                </div>
              </div>

              <div class="setting-group">
                <h4>Priority Levels</h4>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().general.priority.critical"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Critical priority</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().general.priority.high"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>High priority</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().general.priority.normal"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Normal priority</span>
                </div>
                <div class="toggle-option">
                  <mat-slide-toggle 
                    [(ngModel)]="preferences().general.priority.low"
                    (change)="onPreferenceChange()"
                  ></mat-slide-toggle>
                  <span>Low priority</span>
                </div>
              </div>

              <div class="setting-group">
                <h4>Notification Frequency</h4>
                <mat-form-field appearance="outline">
                  <mat-label>Frequency</mat-label>
                  <mat-select 
                    [(ngModel)]="preferences().general.frequency"
                    (selectionChange)="onPreferenceChange()"
                  >
                    <mat-option value="immediate">Immediate</mat-option>
                    <mat-option value="hourly">Hourly digest</mat-option>
                    <mat-option value="daily">Daily digest</mat-option>
                    <mat-option value="weekly">Weekly digest</mat-option>
                  </mat-select>
                </mat-form-field>
              </div>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <ng-template #loadingTemplate>
        <div class="loading-container">
          <mat-spinner></mat-spinner>
          <p>Loading notification preferences...</p>
        </div>
      </ng-template>

      <!-- Action Buttons -->
      <div class="action-buttons">
        <button mat-raised-button color="primary" (click)="savePreferences()" [disabled]="saving()">
          <mat-icon>save</mat-icon>
          {{ saving() ? 'Saving...' : 'Save Preferences' }}
        </button>
        <button mat-button (click)="resetToDefaults()">
          <mat-icon>restore</mat-icon>
          Reset to Defaults
        </button>
        <button mat-button (click)="testNotifications()">
          <mat-icon>send</mat-icon>
          Test Notifications
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification-preferences {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 500;
    }

    .page-header p {
      margin: 0;
      color: #666;
      font-size: 16px;
    }

    .preferences-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .notification-channel-card {
      transition: box-shadow 0.3s ease;
    }

    .notification-channel-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .notification-channel-card mat-card-header {
      padding: 16px 16px 0 16px;
      display: flex;
      align-items: center;
      position: relative;
    }

    .header-toggle {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
    }

    .notification-options {
      display: flex;
      flex-direction: column;
      gap: 24px;
      margin-top: 16px;
    }

    .option-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .option-group h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .toggle-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .toggle-option span {
      font-size: 14px;
      color: #666;
    }

    .phone-field,
    .channel-field {
      width: 100%;
      margin-bottom: 16px;
    }

    .browser-permission {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #fff3e0;
      border-radius: 8px;
      margin-top: 16px;
    }

    .browser-permission mat-icon {
      color: #ff9800;
    }

    .browser-permission span {
      flex: 1;
      font-size: 14px;
      color: #e65100;
    }

    .general-settings {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .setting-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .setting-group h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
      color: #333;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .time-settings {
      display: flex;
      gap: 16px;
      margin-top: 8px;
    }

    .time-settings mat-form-field {
      flex: 1;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px;
      gap: 24px;
    }

    .loading-container p {
      font-size: 16px;
      color: #666;
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #eee;
    }

    .action-buttons button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .notification-preferences {
        padding: 16px;
      }

      .action-buttons {
        flex-direction: column;
      }

      .time-settings {
        flex-direction: column;
      }
    }
  `]
})
export class NotificationPreferencesComponent implements OnInit {
  loading = signal(false);
  saving = signal(false);
  browserPermissionStatus = signal<NotificationPermission>('default');

  // Default preferences
  preferences = signal<NotificationPreferences>({
    userId: '',
    email: {
      enabled: true,
      reportSubmission: true,
      approvalRequired: true,
      reportApproved: true,
      reportRejected: true,
      dueDateReminders: true,
      escalations: true,
      systemAlerts: false
    },
    push: {
      enabled: true,
      reportSubmission: false,
      approvalRequired: true,
      reportApproved: true,
      reportRejected: true,
      dueDateReminders: true,
      escalations: true,
      systemAlerts: false
    },
    sms: {
      enabled: false,
      urgentOnly: true,
      escalations: true,
      overdue: true,
      phoneNumber: ''
    },
    teams: {
      enabled: false,
      channelId: 'general',
      reportSubmission: true,
      approvals: true,
      teamUpdates: false
    },
    slack: {
      enabled: false,
      channelId: '',
      reportSubmission: true,
      approvals: true,
      teamUpdates: false
    },
    general: {
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      },
      priority: {
        critical: true,
        high: true,
        normal: true,
        low: false
      },
      frequency: 'immediate'
    }
  });

  constructor(
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadPreferences();
    this.checkBrowserPermission();
  }

  async loadPreferences(): Promise<void> {
    this.loading.set(true);
    
    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) return;

      const response = await fetch(`/api/users/${currentUser.id}/notification-preferences`, {
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });

      if (response.ok) {
        const prefs = await response.json();
        this.preferences.set({ ...this.preferences(), ...prefs });
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error);
      this.snackBar.open('Failed to load preferences', 'Close', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  async savePreferences(): Promise<void> {
    this.saving.set(true);

    try {
      const currentUser = this.authService.currentUser();
      if (!currentUser) return;

      const response = await fetch(`/api/users/${currentUser.id}/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authService.getToken()}`
        },
        body: JSON.stringify(this.preferences())
      });

      if (response.ok) {
        this.snackBar.open('Preferences saved successfully', 'Close', { duration: 3000 });
      } else {
        throw new Error('Failed to save preferences');
      }
    } catch (error) {
      console.error('Failed to save notification preferences:', error);
      this.snackBar.open('Failed to save preferences', 'Close', { duration: 3000 });
    } finally {
      this.saving.set(false);
    }
  }

  onPreferenceChange(): void {
    // Auto-save after a delay (could be implemented)
    // For now, just mark as changed
  }

  async onPushToggle(): Promise<void> {
    if (this.preferences().push.enabled) {
      await this.requestBrowserPermission();
    }
  }

  async requestBrowserPermission(): Promise<void> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      this.browserPermissionStatus.set(permission);
      
      if (permission === 'granted') {
        this.snackBar.open('Browser notifications enabled', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Browser notifications permission denied', 'Close', { duration: 3000 });
        // Disable push notifications if permission denied
        const prefs = this.preferences();
        prefs.push.enabled = false;
        this.preferences.set(prefs);
      }
    }
  }

  checkBrowserPermission(): void {
    if ('Notification' in window) {
      this.browserPermissionStatus.set(Notification.permission);
    }
  }

  resetToDefaults(): void {
    const currentUserId = this.preferences().userId;
    const defaultPrefs = {
      userId: currentUserId,
      email: {
        enabled: true,
        reportSubmission: true,
        approvalRequired: true,
        reportApproved: true,
        reportRejected: true,
        dueDateReminders: true,
        escalations: true,
        systemAlerts: false
      },
      push: {
        enabled: true,
        reportSubmission: false,
        approvalRequired: true,
        reportApproved: true,
        reportRejected: true,
        dueDateReminders: true,
        escalations: true,
        systemAlerts: false
      },
      sms: {
        enabled: false,
        urgentOnly: true,
        escalations: true,
        overdue: true,
        phoneNumber: ''
      },
      teams: {
        enabled: false,
        channelId: 'general',
        reportSubmission: true,
        approvals: true,
        teamUpdates: false
      },
      slack: {
        enabled: false,
        channelId: '',
        reportSubmission: true,
        approvals: true,
        teamUpdates: false
      },
      general: {
        quietHours: {
          enabled: false,
          startTime: '22:00',
          endTime: '08:00'
        },
        priority: {
          critical: true,
          high: true,
          normal: true,
          low: false
        },
        frequency: 'immediate' as const
      }
    };

    this.preferences.set(defaultPrefs);
    this.snackBar.open('Preferences reset to defaults', 'Close', { duration: 3000 });
  }

  async testNotifications(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authService.getToken()}`
        },
        body: JSON.stringify({
          channels: {
            email: this.preferences().email.enabled,
            push: this.preferences().push.enabled,
            sms: this.preferences().sms.enabled,
            teams: this.preferences().teams.enabled
          }
        })
      });

      if (response.ok) {
        this.snackBar.open('Test notifications sent', 'Close', { duration: 3000 });
      } else {
        throw new Error('Failed to send test notifications');
      }
    } catch (error) {
      console.error('Failed to send test notifications:', error);
      this.snackBar.open('Failed to send test notifications', 'Close', { duration: 3000 });
    }
  }
}
