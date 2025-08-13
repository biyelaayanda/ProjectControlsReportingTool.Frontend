import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';

import { Report } from '../../../core/services/reports.service';
import { ReportStatus, Department } from '../../../core/models/enums';

export interface ReviewReportDialogData {
  report: Report;
  action: 'approve' | 'reject';
}

export interface ReviewReportDialogResult {
  action: 'approve' | 'reject';
  comments: string;
}

@Component({
  selector: 'app-review-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule
  ],
  template: `
    <div class="review-dialog">
      <h2 mat-dialog-title class="dialog-title">
        <mat-icon [class]="getActionIconClass()">{{ getActionIcon() }}</mat-icon>
        {{ getActionTitle() }} Report
      </h2>

      <mat-dialog-content class="dialog-content">
        <!-- Report Summary -->
        <mat-card class="report-summary">
          <mat-card-header>
            <mat-card-title>{{ data.report.title }}</mat-card-title>
            <mat-card-subtitle>{{ data.report.type }}</mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <div class="report-meta">
              <div class="meta-item">
                <strong>Created by:</strong> {{ data.report.creatorName }}
              </div>
              <div class="meta-item">
                <strong>Department:</strong> {{ getDepartmentDisplay(data.report.department) }}
              </div>
              <div class="meta-item">
                <strong>Current Status:</strong> 
                <mat-chip [ngClass]="'status-' + getStatusDisplay(data.report.status).toLowerCase().replace(' ', '')">
                  {{ getStatusDisplay(data.report.status) }}
                </mat-chip>
              </div>
              @if (data.report.priority) {
                <div class="meta-item">
                  <strong>Priority:</strong> 
                  <mat-chip [ngClass]="getPriorityClass(data.report.priority)">
                    {{ getPriorityDisplay(data.report.priority) }}
                  </mat-chip>
                </div>
              }
              @if (data.report.dueDate) {
                <div class="meta-item">
                  <strong>Due Date:</strong> {{ data.report.dueDate | date:'MMM dd, yyyy' }}
                </div>
              }
            </div>
            @if (data.report.description) {
              <div class="report-description">
                <strong>Description:</strong>
                <p>{{ data.report.description }}</p>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Review Form -->
        <form [formGroup]="reviewForm" class="review-form">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ getCommentsLabel() }}</mat-label>
            <textarea 
              matInput 
              formControlName="comments"
              [placeholder]="getCommentsPlaceholder()"
              rows="4"
              maxlength="1000">
            </textarea>
            <mat-hint align="end">{{ reviewForm.get('comments')?.value?.length || 0 }}/1000</mat-hint>
            @if (reviewForm.get('comments')?.hasError('required')) {
              <mat-error>{{ getCommentsLabel() }} is required</mat-error>
            }
          </mat-form-field>
        </form>

        <!-- Action Confirmation -->
        <div class="action-confirmation" [ngClass]="getConfirmationClass()">
          <mat-icon>{{ getActionIcon() }}</mat-icon>
          <div class="confirmation-text">
            <h4>{{ getConfirmationTitle() }}</h4>
            <p>{{ getConfirmationMessage() }}</p>
          </div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions class="dialog-actions">
        <button mat-button (click)="onCancel()">
          <mat-icon>cancel</mat-icon>
          Cancel
        </button>
        <button 
          mat-raised-button 
          [color]="getActionButtonColor()" 
          (click)="onConfirm()"
          [disabled]="!reviewForm.valid || isSubmitting()">
          <mat-icon>{{ getActionIcon() }}</mat-icon>
          @if (isSubmitting()) {
            Processing...
          } @else {
            {{ getActionTitle() }}
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .review-dialog {
      min-width: 600px;
      max-width: 800px;
    }

    .dialog-title {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      padding: 24px 24px 0 24px;
    }

    .dialog-title.approve-action {
      color: #2e7d32;
    }

    .dialog-title.reject-action {
      color: #c62828;
    }

    .dialog-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }

    .report-summary {
      margin-bottom: 24px;
    }

    .report-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .meta-item strong {
      font-size: 0.875rem;
      color: #666;
    }

    .report-description {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .report-description p {
      margin: 8px 0 0 0;
      color: #555;
      line-height: 1.5;
    }

    .review-form {
      margin-bottom: 24px;
    }

    .full-width {
      width: 100%;
    }

    .action-confirmation {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .action-confirmation.approve {
      background-color: #e8f5e8;
      border: 1px solid #c8e6c9;
    }

    .action-confirmation.reject {
      background-color: #ffebee;
      border: 1px solid #ffcdd2;
    }

    .action-confirmation mat-icon {
      margin-top: 2px;
    }

    .action-confirmation.approve mat-icon {
      color: #2e7d32;
    }

    .action-confirmation.reject mat-icon {
      color: #c62828;
    }

    .confirmation-text h4 {
      margin: 0 0 8px 0;
      font-size: 1rem;
    }

    .confirmation-text p {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }

    .dialog-actions {
      padding: 0 24px 24px 24px;
      gap: 12px;
    }

    /* Status chips */
    .status-draft { background-color: #f3e5f5; color: #7b1fa2; }
    .status-submitted { background-color: #e3f2fd; color: #1976d2; }
    .status-managerreview { background-color: #fff8e1; color: #f9a825; }
    .status-managerapproved { background-color: #e8f5e8; color: #2e7d32; }
    .status-executivereview { background-color: #fce4ec; color: #c2185b; }
    .status-approved { background-color: #e8f5e8; color: #2e7d32; }
    .status-rejected { background-color: #ffebee; color: #c62828; }

    /* Priority chips */
    .priority-low { background-color: #f1f8e9; color: #558b2f; }
    .priority-medium { background-color: #fff8e1; color: #f9a825; }
    .priority-high { background-color: #fff3e0; color: #ef6c00; }
    .priority-critical { background-color: #ffebee; color: #c62828; }

    @media (max-width: 768px) {
      .review-dialog {
        min-width: unset;
        width: 100%;
        max-width: 100%;
      }

      .report-meta {
        grid-template-columns: 1fr;
      }

      .dialog-title {
        padding: 16px 16px 0 16px;
      }

      .dialog-content {
        padding: 16px;
      }

      .dialog-actions {
        padding: 0 16px 16px 16px;
      }
    }
  `]
})
export class ReviewReportDialogComponent {
  reviewForm: FormGroup;
  isSubmitting = signal(false);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ReviewReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReviewReportDialogData
  ) {
    this.reviewForm = this.fb.group({
      comments: ['', data.action === 'reject' ? [Validators.required] : []]
    });
  }

  getActionTitle(): string {
    return this.data.action === 'approve' ? 'Approve' : 'Reject';
  }

  getActionIcon(): string {
    return this.data.action === 'approve' ? 'check_circle' : 'cancel';
  }

  getActionIconClass(): string {
    return this.data.action === 'approve' ? 'approve-action' : 'reject-action';
  }

  getActionButtonColor(): string {
    return this.data.action === 'approve' ? 'primary' : 'warn';
  }

  getCommentsLabel(): string {
    return this.data.action === 'approve' ? 'Approval Comments (Optional)' : 'Rejection Reason *';
  }

  getCommentsPlaceholder(): string {
    if (this.data.action === 'approve') {
      return 'Add any comments about your approval decision...';
    } else {
      return 'Please provide a clear reason for rejecting this report...';
    }
  }

  getConfirmationClass(): string {
    return this.data.action;
  }

  getConfirmationTitle(): string {
    return this.data.action === 'approve' 
      ? 'Ready to approve this report?' 
      : 'Ready to reject this report?';
  }

  getConfirmationMessage(): string {
    if (this.data.action === 'approve') {
      return 'This report will be marked as approved and the creator will be notified.';
    } else {
      return 'This report will be rejected and sent back to the creator for revision.';
    }
  }

  getStatusDisplay(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.Draft: return 'Draft';
      case ReportStatus.Submitted: return 'Submitted';
      case ReportStatus.ManagerReview: return 'Manager Review';
      case ReportStatus.ManagerApproved: return 'Manager Approved';
      case ReportStatus.ExecutiveReview: return 'Executive Review';
      case ReportStatus.Completed: return 'Completed';
      case ReportStatus.Rejected: return 'Rejected';
      default: return 'Unknown';
    }
  }

  getDepartmentDisplay(department: Department): string {
    switch (department) {
      case Department.ProjectSupport: return 'Project Support';
      case Department.DocManagement: return 'Document Management';
      case Department.QS: return 'Quantity Surveying';
      case Department.ContractsManagement: return 'Contracts Management';
      case Department.BusinessAssurance: return 'Business Assurance';
      default: return 'Unknown Department';
    }
  }

  getPriorityClass(priority: string | undefined): string {
    if (!priority) return 'priority-medium';
    return 'priority-' + priority.toLowerCase();
  }

  getPriorityDisplay(priority: string | undefined): string {
    return priority || 'Medium';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.reviewForm.valid) return;

    this.isSubmitting.set(true);

    const result: ReviewReportDialogResult = {
      action: this.data.action,
      comments: this.reviewForm.get('comments')?.value || ''
    };

    // Close dialog with result
    this.dialogRef.close(result);
  }
}
