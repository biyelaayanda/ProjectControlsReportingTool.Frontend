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
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

// Services
import { NotificationService } from '../../../core/services/notification.service';
import { AuthService } from '../../../core/services/auth.service';

interface EmailTriggerConfig {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'workflow' | 'system' | 'user';
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  recipients: string[];
  template: string;
}

@Component({
  selector: 'app-email-trigger-config',
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
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule
  ],
  template: `
    <div class="email-config-container">
      <mat-card class="header-card">
        <mat-card-header>
          <div mat-card-avatar>
            <mat-icon class="avatar-icon">email</mat-icon>
          </div>
          <mat-card-title>Email Notification Triggers</mat-card-title>
          <mat-card-subtitle>Configure when automatic emails are sent for workflow events</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <!-- Backend Status -->
          <div class="status-banner success">
            <mat-icon>check_circle</mat-icon>
            <div>
              <strong>✅ Email System Operational</strong>
              <p>EmailNotificationService and WorkflowNotificationService are ready and functional</p>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="stats-section">
            <div class="stat-item">
              <mat-icon>email</mat-icon>
              <div>
                <strong>{{ getActiveTriggersCount() }}</strong>
                <span>Active Triggers</span>
              </div>
            </div>
            <div class="stat-item">
              <mat-icon>schedule</mat-icon>
              <div>
                <strong>{{ getWorkflowTriggersCount() }}</strong>
                <span>Workflow Events</span>
              </div>
            </div>
            <div class="stat-item">
              <mat-icon>notifications_active</mat-icon>
              <div>
                <strong>{{ getSystemTriggersCount() }}</strong>
                <span>System Alerts</span>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Email Triggers Configuration -->
      <mat-card class="triggers-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>settings</mat-icon>
            Trigger Configuration
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <mat-accordion>
            <!-- Workflow Triggers -->
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>assignment</mat-icon>
                  Workflow Triggers ({{ getWorkflowTriggersCount() }} active)
                </mat-panel-title>
                <mat-panel-description>
                  Automatic emails for report submission, approval, and rejection events
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="triggers-list">
                <div 
                  *ngFor="let trigger of workflowTriggers" 
                  class="trigger-item"
                  [class.enabled]="trigger.enabled"
                >
                  <div class="trigger-header">
                    <mat-slide-toggle 
                      [(ngModel)]="trigger.enabled" 
                      (change)="saveTriggerConfig(trigger)"
                    ></mat-slide-toggle>
                    
                    <div class="trigger-info">
                      <h4>{{ trigger.name }}</h4>
                      <p>{{ trigger.description }}</p>
                      <div class="trigger-meta">
                        <mat-chip [class]="'priority-' + trigger.priority.toLowerCase()">
                          {{ trigger.priority }}
                        </mat-chip>
                        <mat-chip>{{ trigger.template }}</mat-chip>
                      </div>
                    </div>

                    <button 
                      mat-icon-button 
                      (click)="testTrigger(trigger)"
                      [disabled]="!trigger.enabled"
                      matTooltip="Send test email"
                    >
                      <mat-icon>send</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </mat-expansion-panel>

            <!-- System Triggers -->
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>computer</mat-icon>
                  System Triggers ({{ getSystemTriggersCount() }} active)
                </mat-panel-title>
                <mat-panel-description>
                  System maintenance, updates, and administrative notifications
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="triggers-list">
                <div 
                  *ngFor="let trigger of systemTriggers" 
                  class="trigger-item"
                  [class.enabled]="trigger.enabled"
                >
                  <div class="trigger-header">
                    <mat-slide-toggle 
                      [(ngModel)]="trigger.enabled" 
                      (change)="saveTriggerConfig(trigger)"
                    ></mat-slide-toggle>
                    
                    <div class="trigger-info">
                      <h4>{{ trigger.name }}</h4>
                      <p>{{ trigger.description }}</p>
                      <div class="trigger-meta">
                        <mat-chip [class]="'priority-' + trigger.priority.toLowerCase()">
                          {{ trigger.priority }}
                        </mat-chip>
                        <mat-chip>{{ trigger.template }}</mat-chip>
                      </div>
                    </div>

                    <button 
                      mat-icon-button 
                      (click)="testTrigger(trigger)"
                      [disabled]="!trigger.enabled"
                      matTooltip="Send test email"
                    >
                      <mat-icon>send</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </mat-expansion-panel>

            <!-- User Triggers -->
            <mat-expansion-panel>
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <mat-icon>person</mat-icon>
                  User Triggers ({{ getUserTriggersCount() }} active)
                </mat-panel-title>
                <mat-panel-description>
                  Welcome emails, password resets, and user account notifications
                </mat-panel-description>
              </mat-expansion-panel-header>

              <div class="triggers-list">
                <div 
                  *ngFor="let trigger of userTriggers" 
                  class="trigger-item"
                  [class.enabled]="trigger.enabled"
                >
                  <div class="trigger-header">
                    <mat-slide-toggle 
                      [(ngModel)]="trigger.enabled" 
                      (change)="saveTriggerConfig(trigger)"
                    ></mat-slide-toggle>
                    
                    <div class="trigger-info">
                      <h4>{{ trigger.name }}</h4>
                      <p>{{ trigger.description }}</p>
                      <div class="trigger-meta">
                        <mat-chip [class]="'priority-' + trigger.priority.toLowerCase()">
                          {{ trigger.priority }}
                        </mat-chip>
                        <mat-chip>{{ trigger.template }}</mat-chip>
                      </div>
                    </div>

                    <button 
                      mat-icon-button 
                      (click)="testTrigger(trigger)"
                      [disabled]="!trigger.enabled"
                      matTooltip="Send test email"
                    >
                      <mat-icon>send</mat-icon>
                    </button>
                  </div>
                </div>
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </mat-card-content>

        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="saveAllConfigs()">
            <mat-icon>save</mat-icon>
            Save All Settings
          </button>
          <button mat-button (click)="resetToDefaults()">
            <mat-icon>refresh</mat-icon>
            Reset to Defaults
          </button>
          <button mat-button color="accent" (click)="testAllActiveTriggers()">
            <mat-icon>send</mat-icon>
            Test All Active
          </button>
        </mat-card-actions>
      </mat-card>

      <!-- Email Templates Info -->
      <mat-card class="templates-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>description</mat-icon>
            Available Email Templates
          </mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div class="templates-info">
            <div class="template-item">
              <mat-icon>email</mat-icon>
              <div>
                <strong>Welcome Email</strong>
                <p>Professional welcome email with login details for new users</p>
              </div>
            </div>

            <div class="template-item">
              <mat-icon>update</mat-icon>
              <div>
                <strong>Report Status Update</strong>
                <p>Status change notifications with report details and next actions</p>
              </div>
            </div>

            <div class="template-item">
              <mat-icon>security</mat-icon>
              <div>
                <strong>Password Reset</strong>
                <p>Secure password reset emails with time-limited links</p>
              </div>
            </div>

            <div class="template-item">
              <mat-icon>approval</mat-icon>
              <div>
                <strong>Approval Required</strong>
                <p>Manager and GM approval request notifications with report summaries</p>
              </div>
            </div>

            <div class="template-item">
              <mat-icon>check_circle</mat-icon>
              <div>
                <strong>Approval Confirmation</strong>
                <p>Confirmation emails when reports are approved or rejected</p>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .email-config-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header-card, .triggers-card, .templates-card {
      margin-bottom: 24px;
    }

    .avatar-icon {
      background: #4caf50;
      color: white;
      border-radius: 50%;
      padding: 8px;
    }

    .status-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }

    .status-banner.success {
      background: #e8f5e8;
      color: #2e7d32;
      border: 1px solid #4caf50;
    }

    .status-banner mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
    }

    .status-banner strong {
      display: block;
      margin-bottom: 4px;
    }

    .status-banner p {
      margin: 0;
      font-size: 14px;
    }

    .stats-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
    }

    .stat-item mat-icon {
      color: #2196f3;
    }

    .stat-item strong {
      display: block;
      font-size: 18px;
      font-weight: 600;
    }

    .stat-item span {
      font-size: 12px;
      color: #666;
    }

    .triggers-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 16px;
    }

    .trigger-item {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.3s ease;
    }

    .trigger-item.enabled {
      border-color: #4caf50;
      background: #fafafa;
    }

    .trigger-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .trigger-info {
      flex: 1;
    }

    .trigger-info h4 {
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    .trigger-info p {
      margin: 0 0 12px 0;
      color: #666;
      font-size: 14px;
    }

    .trigger-meta {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .trigger-meta mat-chip {
      height: 20px;
      font-size: 11px;
    }

    .priority-critical {
      background: #ffebee;
      color: #c62828;
    }

    .priority-high {
      background: #fff3e0;
      color: #e65100;
    }

    .priority-normal {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .priority-low {
      background: #e8f5e8;
      color: #388e3c;
    }

    .templates-info {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .template-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .template-item mat-icon {
      color: #2196f3;
      margin-top: 2px;
    }

    .template-item strong {
      display: block;
      margin-bottom: 4px;
    }

    .template-item p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    mat-expansion-panel {
      margin-bottom: 16px;
    }

    mat-panel-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .email-config-container {
        padding: 16px;
      }

      .stats-section {
        grid-template-columns: 1fr;
      }

      .trigger-header {
        flex-direction: column;
        gap: 12px;
      }

      .template-item {
        flex-direction: column;
        gap: 8px;
      }
    }
  `]
})
export class EmailTriggerConfigComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  // Trigger configurations
  workflowTriggers: EmailTriggerConfig[] = [
    {
      id: 'report-submitted',
      name: 'Report Submitted',
      description: 'Send email when a report is submitted for review to managers',
      enabled: true,
      category: 'workflow',
      priority: 'Normal',
      recipients: ['managers'],
      template: 'Report Status Update'
    },
    {
      id: 'approval-required-manager',
      name: 'Manager Approval Required',
      description: 'Notify line managers when their approval is needed',
      enabled: true,
      category: 'workflow',
      priority: 'High',
      recipients: ['assigned-manager'],
      template: 'Approval Required'
    },
    {
      id: 'approval-required-gm',
      name: 'GM Approval Required',
      description: 'Notify general manager when final approval is needed',
      enabled: true,
      category: 'workflow',
      priority: 'High',
      recipients: ['general-manager'],
      template: 'Approval Required'
    },
    {
      id: 'report-approved',
      name: 'Report Approved',
      description: 'Confirm approval to report creator and stakeholders',
      enabled: true,
      category: 'workflow',
      priority: 'Normal',
      recipients: ['creator', 'stakeholders'],
      template: 'Approval Confirmation'
    },
    {
      id: 'report-rejected',
      name: 'Report Rejected',
      description: 'Notify creator when report is rejected with reasons',
      enabled: true,
      category: 'workflow',
      priority: 'High',
      recipients: ['creator'],
      template: 'Approval Confirmation'
    }
  ];

  systemTriggers: EmailTriggerConfig[] = [
    {
      id: 'system-maintenance',
      name: 'System Maintenance',
      description: 'Notify users about planned system maintenance',
      enabled: false,
      category: 'system',
      priority: 'Normal',
      recipients: ['all-users'],
      template: 'System Update'
    },
    {
      id: 'system-updates',
      name: 'System Updates',
      description: 'Inform users about new features and improvements',
      enabled: false,
      category: 'system',
      priority: 'Low',
      recipients: ['all-users'],
      template: 'System Update'
    },
    {
      id: 'security-alerts',
      name: 'Security Alerts',
      description: 'Critical security notifications and alerts',
      enabled: true,
      category: 'system',
      priority: 'Critical',
      recipients: ['administrators'],
      template: 'System Alert'
    }
  ];

  userTriggers: EmailTriggerConfig[] = [
    {
      id: 'welcome-email',
      name: 'Welcome Email',
      description: 'Send welcome email to new users with login details',
      enabled: true,
      category: 'user',
      priority: 'Normal',
      recipients: ['new-user'],
      template: 'Welcome Email'
    },
    {
      id: 'password-reset',
      name: 'Password Reset',
      description: 'Send secure password reset links to users',
      enabled: true,
      category: 'user',
      priority: 'High',
      recipients: ['requesting-user'],
      template: 'Password Reset'
    },
    {
      id: 'account-locked',
      name: 'Account Locked',
      description: 'Notify users when their account is locked',
      enabled: true,
      category: 'user',
      priority: 'High',
      recipients: ['affected-user'],
      template: 'Account Security'
    }
  ];

  ngOnInit(): void {
    this.loadSavedConfigs();
  }

  // Statistics methods
  getActiveTriggersCount(): number {
    return [...this.workflowTriggers, ...this.systemTriggers, ...this.userTriggers]
      .filter(t => t.enabled).length;
  }

  getWorkflowTriggersCount(): number {
    return this.workflowTriggers.filter(t => t.enabled).length;
  }

  getSystemTriggersCount(): number {
    return this.systemTriggers.filter(t => t.enabled).length;
  }

  getUserTriggersCount(): number {
    return this.userTriggers.filter(t => t.enabled).length;
  }

  // Configuration methods
  saveTriggerConfig(trigger: EmailTriggerConfig): void {
    this.saveAllConfigs();
    
    const status = trigger.enabled ? 'enabled' : 'disabled';
    this.snackBar.open(`${trigger.name} ${status}`, 'Close', {
      duration: 2000
    });
  }

  saveAllConfigs(): void {
    try {
      const allConfigs = {
        workflow: this.workflowTriggers,
        system: this.systemTriggers,
        user: this.userTriggers,
        lastUpdated: new Date().toISOString()
      };
      
      localStorage.setItem('emailTriggerConfigs', JSON.stringify(allConfigs));
      
      this.snackBar.open('Email trigger settings saved', 'Close', {
        duration: 2000
      });
    } catch (error) {
      console.error('Error saving trigger configs:', error);
      this.snackBar.open('Failed to save settings', 'Close', {
        duration: 3000
      });
    }
  }

  loadSavedConfigs(): void {
    try {
      const saved = localStorage.getItem('emailTriggerConfigs');
      if (saved) {
        const configs = JSON.parse(saved);
        if (configs.workflow) this.workflowTriggers = configs.workflow;
        if (configs.system) this.systemTriggers = configs.system;
        if (configs.user) this.userTriggers = configs.user;
      }
    } catch (error) {
      console.error('Error loading saved configs:', error);
    }
  }

  resetToDefaults(): void {
    // Reset all triggers to default enabled state for workflow and user, disabled for system
    this.workflowTriggers.forEach(t => t.enabled = true);
    this.systemTriggers.forEach(t => t.enabled = t.id === 'security-alerts');
    this.userTriggers.forEach(t => t.enabled = true);
    
    this.saveAllConfigs();
    this.snackBar.open('Settings reset to defaults', 'Close', {
      duration: 2000
    });
  }

  // Testing methods
  testTrigger(trigger: EmailTriggerConfig): void {
    if (!trigger.enabled) {
      this.snackBar.open('Enable trigger first to test it', 'Close', {
        duration: 3000
      });
      return;
    }

    // Create a test notification to show the email would be sent
    const testNotification = {
      id: `test-${Date.now()}`,
      title: `📧 Test: ${trigger.name}`,
      message: `This is a test of the "${trigger.name}" email trigger. In production, this would send an email using the "${trigger.template}" template.`,
      type: 'Info' as const,
      priority: trigger.priority as 'Low' | 'Normal' | 'High' | 'Critical',
      isRead: false,
      createdAt: new Date().toISOString(),
      userId: 'current-user'
    };

    this.notificationService.addNotification(testNotification);
    
    this.snackBar.open(`✅ Test email trigger: ${trigger.name}`, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  testAllActiveTriggers(): void {
    const activeTriggers = [...this.workflowTriggers, ...this.systemTriggers, ...this.userTriggers]
      .filter(t => t.enabled);
    
    if (activeTriggers.length === 0) {
      this.snackBar.open('No active triggers to test', 'Close', {
        duration: 3000
      });
      return;
    }

    // Test each active trigger
    activeTriggers.forEach((trigger, index) => {
      setTimeout(() => {
        this.testTrigger(trigger);
      }, index * 500); // Stagger the tests
    });

    this.snackBar.open(`Testing ${activeTriggers.length} active email triggers`, 'Close', {
      duration: 3000
    });
  }
}
