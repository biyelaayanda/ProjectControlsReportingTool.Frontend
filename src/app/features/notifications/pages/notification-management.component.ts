import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface EmailTestResult {
  success: boolean;
  message: string;
  testTime: string;
  testEmail: string;
}

interface BulkEmailResult {
  totalEmails: number;
  successfulEmails: number;
  failedEmails: number;
  results: EmailResult[];
}

interface EmailResult {
  email: string;
  name: string;
  success: boolean;
  error?: string;
}

@Component({
  selector: 'app-notification-management',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule,
    FormsModule,
    ReactiveFormsModule
  ],
  template: `
    <div class="notification-management-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>📧 Email Notification Management</mat-card-title>
          <mat-card-subtitle>Test and manage email notification system</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <mat-tab-group>
            <!-- Email Testing Tab -->
            <mat-tab label="📧 Email Testing">
              <div class="tab-content">
                <h3>Test Email Configuration</h3>
                <form [formGroup]="emailTestForm" (ngSubmit)="testEmailConfiguration()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Test Email Address</mat-label>
                    <input matInput formControlName="testEmail" placeholder="test@example.com">
                    <mat-icon matSuffix>email</mat-icon>
                    <mat-error *ngIf="emailTestForm.get('testEmail')?.hasError('required')">
                      Email address is required
                    </mat-error>
                    <mat-error *ngIf="emailTestForm.get('testEmail')?.hasError('email')">
                      Please enter a valid email address
                    </mat-error>
                  </mat-form-field>

                  <div class="action-buttons">
                    <button mat-raised-button color="primary" type="submit" 
                            [disabled]="emailTestForm.invalid || testing()">
                      <mat-icon>send</mat-icon>
                      {{ testing() ? 'Sending...' : 'Send Test Email' }}
                    </button>
                  </div>
                </form>

                <!-- Test Results -->
                <div class="test-results" *ngIf="testResult()">
                  <mat-divider style="margin: 20px 0;"></mat-divider>
                  <h4>Test Results</h4>
                  <div class="result-card" [ngClass]="testResult()?.success ? 'success' : 'error'">
                    <mat-icon>{{ testResult()?.success ? 'check_circle' : 'error' }}</mat-icon>
                    <div class="result-content">
                      <div class="result-message">{{ testResult()?.message }}</div>
                      <div class="result-details">
                        <strong>Test Time:</strong> {{ testResult()?.testTime | date:'medium' }}<br>
                        <strong>Email:</strong> {{ testResult()?.testEmail }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Workflow Notifications Tab -->
            <mat-tab label="🔄 Workflow Notifications">
              <div class="tab-content">
                <h3>Send Workflow Notifications</h3>
                
                <div class="workflow-actions">
                  <button mat-raised-button color="accent" (click)="sendDueReminders()"
                          [disabled]="sendingReminders()">
                    <mat-icon>schedule</mat-icon>
                    {{ sendingReminders() ? 'Sending...' : 'Send Due Report Reminders' }}
                  </button>

                  <button mat-raised-button color="warn" (click)="sendOverdueNotifications()"
                          [disabled]="sendingOverdue()">
                    <mat-icon>warning</mat-icon>
                    {{ sendingOverdue() ? 'Sending...' : 'Send Overdue Notifications' }}
                  </button>

                  <button mat-raised-button color="primary" (click)="sendReviewReminders()"
                          [disabled]="sendingReviews()">
                    <mat-icon>rate_review</mat-icon>
                    {{ sendingReviews() ? 'Sending...' : 'Send Review Reminders' }}
                  </button>
                </div>

                <!-- Results Display -->
                <div class="workflow-results" *ngIf="workflowResults().length > 0">
                  <mat-divider style="margin: 20px 0;"></mat-divider>
                  <h4>Recent Results</h4>
                  <div class="results-list">
                    <div class="result-item" *ngFor="let result of workflowResults()">
                      <mat-icon [color]="result.success ? 'primary' : 'warn'">
                        {{ result.success ? 'check_circle' : 'error' }}
                      </mat-icon>
                      <div class="result-text">
                        <strong>{{ result.action }}</strong>: {{ result.message }}
                        <small>{{ result.timestamp | date:'short' }}</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Broadcast Messages Tab -->
            <mat-tab label="📢 Broadcast Messages">
              <div class="tab-content">
                <h3>Send Broadcast Notification</h3>
                <form [formGroup]="broadcastForm" (ngSubmit)="sendBroadcast()">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Subject</mat-label>
                    <input matInput formControlName="subject" placeholder="Enter subject">
                    <mat-error *ngIf="broadcastForm.get('subject')?.hasError('required')">
                      Subject is required
                    </mat-error>
                  </mat-form-field>

                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Message</mat-label>
                    <textarea matInput formControlName="body" rows="6" 
                              placeholder="Enter your message (HTML supported)"></textarea>
                    <mat-error *ngIf="broadcastForm.get('body')?.hasError('required')">
                      Message is required
                    </mat-error>
                  </mat-form-field>

                  <div class="broadcast-options">
                    <mat-checkbox formControlName="sendEmail">Send as Email</mat-checkbox>
                    <mat-checkbox formControlName="sendInApp">Send as In-App Notification</mat-checkbox>
                  </div>

                  <div class="action-buttons">
                    <button mat-raised-button color="primary" type="submit" 
                            [disabled]="broadcastForm.invalid || broadcasting()">
                      <mat-icon>send</mat-icon>
                      {{ broadcasting() ? 'Sending...' : 'Send Broadcast' }}
                    </button>
                    <button mat-button type="button" (click)="resetBroadcastForm()">
                      <mat-icon>refresh</mat-icon>
                      Reset
                    </button>
                  </div>
                </form>

                <!-- Broadcast Results -->
                <div class="broadcast-results" *ngIf="broadcastResult()">
                  <mat-divider style="margin: 20px 0;"></mat-divider>
                  <h4>Broadcast Results</h4>
                  <div class="result-summary">
                    <div class="summary-card">
                      <mat-icon color="primary">people</mat-icon>
                      <div>
                        <div class="summary-number">{{ broadcastResult()?.totalEmails }}</div>
                        <div class="summary-label">Total Recipients</div>
                      </div>
                    </div>
                    <div class="summary-card">
                      <mat-icon color="accent">check_circle</mat-icon>
                      <div>
                        <div class="summary-number">{{ broadcastResult()?.successfulEmails }}</div>
                        <div class="summary-label">Successful</div>
                      </div>
                    </div>
                    <div class="summary-card">
                      <mat-icon color="warn">error</mat-icon>
                      <div>
                        <div class="summary-number">{{ broadcastResult()?.failedEmails }}</div>
                        <div class="summary-label">Failed</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>

            <!-- Email Templates Tab -->
            <mat-tab label="📝 Email Templates">
              <div class="tab-content">
                <h3>Email Template Management</h3>
                <p>Manage email templates for different notification types.</p>
                
                <div class="template-actions">
                  <button mat-raised-button color="primary" (click)="loadTemplates()">
                    <mat-icon>refresh</mat-icon>
                    Refresh Templates
                  </button>
                  <button mat-raised-button color="accent" (click)="createDefaultTemplates()">
                    <mat-icon>add_circle</mat-icon>
                    Create Default Templates
                  </button>
                </div>

                <div class="templates-list" *ngIf="templates().length > 0">
                  <mat-divider style="margin: 20px 0;"></mat-divider>
                  <div class="template-item" *ngFor="let template of templates()">
                    <div class="template-info">
                      <div class="template-name">{{ template.name }}</div>
                      <div class="template-type">{{ template.type }}</div>
                    </div>
                    <div class="template-actions">
                      <button mat-icon-button color="primary" [title]="'Edit template'">
                        <mat-icon>edit</mat-icon>
                      </button>
                      <button mat-icon-button color="accent" [title]="'Preview template'">
                        <mat-icon>visibility</mat-icon>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .notification-management-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .tab-content {
      padding: 24px 0;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .action-buttons {
      display: flex;
      gap: 16px;
      margin-top: 16px;
    }

    .workflow-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }

    .test-results, .broadcast-results {
      margin-top: 24px;
    }

    .result-card {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 8px;
      margin-top: 16px;
    }

    .result-card.success {
      background-color: #e8f5e8;
      border-left: 4px solid #4caf50;
    }

    .result-card.error {
      background-color: #ffeaea;
      border-left: 4px solid #f44336;
    }

    .result-content {
      flex: 1;
    }

    .result-message {
      font-weight: 500;
      margin-bottom: 8px;
    }

    .result-details {
      font-size: 0.875rem;
      color: #666;
    }

    .workflow-results {
      margin-top: 24px;
    }

    .results-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .result-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background-color: #f5f5f5;
      border-radius: 8px;
    }

    .result-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .result-text small {
      color: #666;
      font-size: 0.75rem;
    }

    .broadcast-options {
      display: flex;
      gap: 24px;
      margin: 16px 0;
    }

    .result-summary {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 16px;
    }

    .summary-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background-color: #f5f5f5;
      border-radius: 8px;
      min-width: 150px;
    }

    .summary-number {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1976d2;
    }

    .summary-label {
      font-size: 0.875rem;
      color: #666;
    }

    .template-actions {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }

    .templates-list {
      margin-top: 24px;
    }

    .template-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .template-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .template-name {
      font-weight: 500;
    }

    .template-type {
      font-size: 0.875rem;
      color: #666;
    }

    .template-actions {
      display: flex;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .notification-management-container {
        padding: 16px;
      }

      .workflow-actions {
        flex-direction: column;
      }

      .result-summary {
        flex-direction: column;
      }

      .summary-card {
        min-width: unset;
      }
    }
  `]
})
export class NotificationManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);

  // Signals for reactive state
  testing = signal(false);
  sendingReminders = signal(false);
  sendingOverdue = signal(false);
  sendingReviews = signal(false);
  broadcasting = signal(false);
  
  testResult = signal<EmailTestResult | null>(null);
  broadcastResult = signal<BulkEmailResult | null>(null);
  workflowResults = signal<any[]>([]);
  templates = signal<any[]>([]);

  // Form groups
  emailTestForm: FormGroup;
  broadcastForm: FormGroup;

  constructor() {
    this.emailTestForm = this.fb.group({
      testEmail: ['', [Validators.required, Validators.email]]
    });

    this.broadcastForm = this.fb.group({
      subject: ['', Validators.required],
      body: ['', Validators.required],
      sendEmail: [true],
      sendInApp: [true]
    });
  }

  ngOnInit() {
    this.loadTemplates();
  }

  async testEmailConfiguration() {
    if (this.emailTestForm.invalid) return;

    this.testing.set(true);
    try {
      const testEmail = this.emailTestForm.get('testEmail')?.value;
      const response = await this.http.post<any>(`${environment.apiUrl}/email-templates/test`, {
        testEmail
      }).toPromise();

      if (response?.success && response.data) {
        this.testResult.set(response.data);
        this.snackBar.open('Test email sent successfully!', 'Close', { duration: 3000 });
      } else {
        this.snackBar.open('Failed to send test email', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error testing email configuration:', error);
      this.snackBar.open('Error testing email configuration', 'Close', { duration: 3000 });
    } finally {
      this.testing.set(false);
    }
  }

  async sendDueReminders() {
    this.sendingReminders.set(true);
    try {
      const response = await this.http.post<any>(`${environment.apiUrl}/email-templates/due-reminders`, {}).toPromise();
      
      if (response?.success) {
        const remindersSent = response.data?.remindersSent || 0;
        this.addWorkflowResult('Due Reminders', `Sent ${remindersSent} due report reminders`, true);
        this.snackBar.open(`Sent ${remindersSent} due report reminders`, 'Close', { duration: 3000 });
      } else {
        this.addWorkflowResult('Due Reminders', 'Failed to send due reminders', false);
        this.snackBar.open('Failed to send due reminders', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error sending due reminders:', error);
      this.addWorkflowResult('Due Reminders', 'Error sending due reminders', false);
      this.snackBar.open('Error sending due reminders', 'Close', { duration: 3000 });
    } finally {
      this.sendingReminders.set(false);
    }
  }

  async sendOverdueNotifications() {
    this.sendingOverdue.set(true);
    try {
      const response = await this.http.post<any>(`${environment.apiUrl}/email-templates/overdue-reminders`, {}).toPromise();
      
      if (response?.success) {
        const remindersSent = response.data?.overdueRemindersSent || 0;
        this.addWorkflowResult('Overdue Notifications', `Sent ${remindersSent} overdue notifications`, true);
        this.snackBar.open(`Sent ${remindersSent} overdue notifications`, 'Close', { duration: 3000 });
      } else {
        this.addWorkflowResult('Overdue Notifications', 'Failed to send overdue notifications', false);
        this.snackBar.open('Failed to send overdue notifications', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error sending overdue notifications:', error);
      this.addWorkflowResult('Overdue Notifications', 'Error sending overdue notifications', false);
      this.snackBar.open('Error sending overdue notifications', 'Close', { duration: 3000 });
    } finally {
      this.sendingOverdue.set(false);
    }
  }

  async sendReviewReminders() {
    this.sendingReviews.set(true);
    try {
      // This would be implemented when we have the endpoint
      this.addWorkflowResult('Review Reminders', 'Review reminders endpoint not yet implemented', false);
      this.snackBar.open('Review reminders endpoint not yet implemented', 'Close', { duration: 3000 });
    } catch (error) {
      console.error('Error sending review reminders:', error);
      this.addWorkflowResult('Review Reminders', 'Error sending review reminders', false);
      this.snackBar.open('Error sending review reminders', 'Close', { duration: 3000 });
    } finally {
      this.sendingReviews.set(false);
    }
  }

  async sendBroadcast() {
    if (this.broadcastForm.invalid) return;

    this.broadcasting.set(true);
    try {
      const formValue = this.broadcastForm.value;
      const response = await this.http.post<any>(`${environment.apiUrl}/email-templates/broadcast`, {
        subject: formValue.subject,
        body: formValue.body
      }).toPromise();

      if (response?.success && response.data) {
        this.broadcastResult.set(response.data);
        this.snackBar.open('Broadcast sent successfully!', 'Close', { duration: 3000 });
        this.resetBroadcastForm();
      } else {
        this.snackBar.open('Failed to send broadcast', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      this.snackBar.open('Error sending broadcast', 'Close', { duration: 3000 });
    } finally {
      this.broadcasting.set(false);
    }
  }

  resetBroadcastForm() {
    this.broadcastForm.reset({
      subject: '',
      body: '',
      sendEmail: true,
      sendInApp: true
    });
    this.broadcastResult.set(null);
  }

  async loadTemplates() {
    try {
      const response = await this.http.get<any>(`${environment.apiUrl}/email-templates`).toPromise();
      
      if (response?.success && response.data) {
        this.templates.set(response.data);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  }

  async createDefaultTemplates() {
    try {
      const response = await this.http.post<any>(`${environment.apiUrl}/email-templates/system/create-defaults`, {}).toPromise();
      
      if (response?.success) {
        const createdCount = response.data || 0;
        this.snackBar.open(`Created ${createdCount} default templates`, 'Close', { duration: 3000 });
        this.loadTemplates();
      } else {
        this.snackBar.open('Failed to create default templates', 'Close', { duration: 3000 });
      }
    } catch (error) {
      console.error('Error creating default templates:', error);
      this.snackBar.open('Error creating default templates', 'Close', { duration: 3000 });
    }
  }

  private addWorkflowResult(action: string, message: string, success: boolean) {
    const result = {
      action,
      message,
      success,
      timestamp: new Date()
    };
    
    const current = this.workflowResults();
    this.workflowResults.set([result, ...current.slice(0, 9)]); // Keep last 10 results
  }
}
