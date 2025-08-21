import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

import { ReportsService, Report, UpdateReportDto } from '../../../core/services/reports.service';
import { AuthService } from '../../../core/services/auth.service';
import { Department, UserRole, ReportStatus, ApprovalStage } from '../../../core/models/enums';
import { ConfirmationDialogComponent, ConfirmationDialogData, ConfirmationDialogResult } from '../../../shared/components/confirmation-dialog.component';
import { WorkflowTrackerComponent } from '../../../shared/components/workflow-tracker.component';
import { FileListComponent } from '../../../shared/components/file-list.component';
import { UploadedFile } from '../../../shared/components/file-upload.component';
import { ApprovalDocumentUploadComponent } from '../../../shared/components/approval-document-upload.component';
import { ApprovalStageDocumentsComponent } from '../../../shared/components/approval-stage-documents.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-report-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatMenuModule,
    MatDividerModule,
    WorkflowTrackerComponent,
    FileListComponent,
    ApprovalDocumentUploadComponent,
    ApprovalStageDocumentsComponent
  ],
  template: `
    <div class="report-details-container">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="50"></mat-spinner>
          <p>Loading report details...</p>
        </div>
      } @else if (report()) {
        <!-- Header Section -->
        <div class="report-header">
          <div class="header-content">
            <div class="header-text">
              <button mat-icon-button (click)="goBack()" class="back-button">
                <mat-icon>arrow_back</mat-icon>
              </button>
              <div class="title-section">
                <h1 class="report-title">{{ report()?.title }}</h1>
                <div class="status-badges">
                  <mat-chip [class]="getStatusClass(report()?.status!)">
                    <mat-icon>{{ getStatusIcon(report()?.status!) }}</mat-icon>
                    {{ getStatusDisplay(report()?.status!) }}
                  </mat-chip>
                  <mat-chip [class]="getPriorityClass(report()?.priority)">
                    <mat-icon>{{ getPriorityIcon(report()?.priority) }}</mat-icon>
                    {{ report()?.priority || 'Medium' }} Priority
                  </mat-chip>
                </div>
                
                <!-- Quick Report Details - Always Visible -->
                <div class="quick-details">
                  <div class="quick-detail-item">
                    <span class="quick-label">Type:</span>
                    <span class="quick-value">{{ report()?.type || 'Not specified' }}</span>
                  </div>
                  <div class="quick-detail-item">
                    <span class="quick-label">Department:</span>
                    <span class="quick-value">{{ getDepartmentDisplay(report()?.department!) }}</span>
                  </div>
                  <div class="quick-detail-item">
                    <span class="quick-label">Created by:</span>
                    <span class="quick-value">{{ report()?.creatorName }}</span>
                  </div>
                  <div class="quick-detail-item">
                    <span class="quick-label">Created:</span>
                    <span class="quick-value">{{ report()?.createdDate | date:'medium' }}</span>
                  </div>
                  @if (report()?.dueDate) {
                    <div class="quick-detail-item">
                      <span class="quick-label">Due Date:</span>
                      <span class="quick-value" [class]="getDueDateClass(report()?.dueDate!)">
                        {{ report()?.dueDate | date:'medium' }}
                      </span>
                    </div>
                  }
                  @if (report()?.description) {
                    <div class="quick-detail-item full-width">
                      <span class="quick-label">Description:</span>
                      <span class="quick-value description">{{ report()?.description }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>
            <div class="header-actions">
              @if (canView()) {
                @if (canEdit()) {
                  <button mat-raised-button color="primary" (click)="toggleEditMode()" [disabled]="isSaving()">
                    @if (isEditMode()) {
                      <ng-container>
                        <mat-icon>visibility</mat-icon>
                        View Mode
                      </ng-container>
                    } @else {
                      <ng-container>
                        <mat-icon>edit</mat-icon>
                        Edit Report
                      </ng-container>
                    }
                  </button>
                } @else {
                  <div class="view-mode-indicator">
                    <mat-icon>visibility</mat-icon>
                    <span>View Only</span>
                  </div>
                }
              }
              @if (canSubmit() && !isEditMode()) {
                <button mat-raised-button color="accent" (click)="submitReport()" [disabled]="isSaving()">
                  <mat-icon>send</mat-icon>
                  Submit for Review
                </button>
              }
              @if (canApprove() && !isEditMode()) {
                <button [matMenuTriggerFor]="actionsMenu" mat-raised-button color="primary">
                  <mat-icon>more_vert</mat-icon>
                  Actions
                </button>
                <mat-menu #actionsMenu="matMenu">
                  <button mat-menu-item (click)="approveReport()">
                    <mat-icon>check_circle</mat-icon>
                    Approve Report
                  </button>
                  <button mat-menu-item (click)="rejectReport()">
                    <mat-icon>cancel</mat-icon>
                    Reject Report
                  </button>
                  <mat-divider></mat-divider>
                  <button mat-menu-item (click)="downloadReport()">
                    <mat-icon>download</mat-icon>
                    Download PDF
                  </button>
                </mat-menu>
              }
              @if (!canView()) {
                <div class="no-access-indicator">
                  <mat-icon>lock</mat-icon>
                  <span>No Access</span>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Content Tabs -->
        <mat-card class="content-card">
          <mat-tab-group animationDuration="0ms">
            <!-- Details Tab -->
            <mat-tab label="Report Details">
              <div class="tab-content">
                @if (isEditMode()) {
                  <form [formGroup]="editForm" class="edit-form">
                    <div class="form-grid">
                      <!-- Title -->
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Report Title</mat-label>
                        <input matInput formControlName="title" maxlength="200">
                        <mat-error *ngIf="editForm.get('title')?.hasError('required')">
                          Title is required
                        </mat-error>
                      </mat-form-field>

                      <!-- Type -->
                      <mat-form-field appearance="outline">
                        <mat-label>Report Type</mat-label>
                        <mat-select formControlName="type">
                          <mat-option value="Weekly Progress">Weekly Progress</mat-option>
                          <mat-option value="Monthly Summary">Monthly Summary</mat-option>
                          <mat-option value="Project Status">Project Status</mat-option>
                          <mat-option value="Risk Assessment">Risk Assessment</mat-option>
                          <mat-option value="Budget Analysis">Budget Analysis</mat-option>
                          <mat-option value="Quality Assurance">Quality Assurance</mat-option>
                          <mat-option value="Contract Review">Contract Review</mat-option>
                          <mat-option value="Compliance Check">Compliance Check</mat-option>
                          <mat-option value="Other">Other</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <!-- Priority -->
                      <mat-form-field appearance="outline">
                        <mat-label>Priority</mat-label>
                        <mat-select formControlName="priority">
                          <mat-option value="Low">Low Priority</mat-option>
                          <mat-option value="Medium">Medium Priority</mat-option>
                          <mat-option value="High">High Priority</mat-option>
                          <mat-option value="Critical">Critical Priority</mat-option>
                        </mat-select>
                      </mat-form-field>

                      <!-- Due Date -->
                      <mat-form-field appearance="outline">
                        <mat-label>Due Date</mat-label>
                        <input matInput [matDatepicker]="picker" formControlName="dueDate" readonly>
                        <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
                        <mat-datepicker #picker></mat-datepicker>
                      </mat-form-field>

                      <!-- Description -->
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Description</mat-label>
                        <textarea matInput formControlName="description" rows="3" maxlength="1000"></textarea>
                      </mat-form-field>

                      <!-- Content -->
                      <mat-form-field appearance="outline" class="full-width">
                        <mat-label>Report Content</mat-label>
                        <textarea matInput formControlName="content" rows="8" maxlength="5000"></textarea>
                      </mat-form-field>
                    </div>

                    <div class="form-actions">
                      <button mat-raised-button color="primary" (click)="saveReport()" [disabled]="editForm.invalid || isSaving()">
                        @if (isSaving()) {
                          <mat-spinner diameter="20" class="inline-spinner"></mat-spinner>
                          Saving...
                        } @else {
                          <ng-container>
                            <mat-icon>save</mat-icon>
                            Save Changes
                          </ng-container>
                        }
                      </button>
                      <button mat-stroked-button (click)="cancelEdit()" [disabled]="isSaving()">
                        <mat-icon>cancel</mat-icon>
                        Cancel
                      </button>
                      @if (editForm.dirty) {
                        <span class="unsaved-changes">
                          <mat-icon>warning</mat-icon>
                          You have unsaved changes
                        </span>
                      }
                    </div>
                  </form>
                } @else {
                  <!-- View Mode - Read Only Display -->
                  <div class="details-grid">
                    <div class="section-header">
                      <h3>Report Information</h3>
                      @if (canEdit()) {
                        <span class="edit-hint">
                          <mat-icon>info</mat-icon>
                          Click "Edit Report" to modify this report
                        </span>
                      }
                    </div>
                    
                    <div class="detail-row">
                      <span class="label">Report ID:</span>
                      <span class="value">{{ report()?.id }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Report Type:</span>
                      <span class="value">{{ report()?.type || 'Not specified' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Priority:</span>
                      <span class="value priority" [class]="getPriorityClass(report()?.priority)">
                        <mat-icon>{{ getPriorityIcon(report()?.priority) }}</mat-icon>
                        {{ report()?.priority || 'Medium' }} Priority
                      </span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Department:</span>
                      <span class="value">{{ getDepartmentDisplay(report()?.department!) }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Created By:</span>
                      <span class="value">{{ report()?.creatorName }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Created Date:</span>
                      <span class="value">{{ report()?.createdDate | date:'full' }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="label">Last Modified:</span>
                      <span class="value">{{ report()?.lastModified | date:'full' }}</span>
                    </div>
                    @if (report()?.reportNumber) {
                      <div class="detail-row">
                        <span class="label">Report Number:</span>
                        <span class="value">{{ report()?.reportNumber }}</span>
                      </div>
                    }
                    @if (report()?.submittedDate) {
                      <div class="detail-row">
                        <span class="label">Submitted Date:</span>
                        <span class="value">{{ report()?.submittedDate | date:'full' }}</span>
                      </div>
                    }
                    @if (report()?.managerApprovedDate) {
                      <div class="detail-row">
                        <span class="label">Manager Approved:</span>
                        <span class="value">{{ report()?.managerApprovedDate | date:'full' }}</span>
                      </div>
                    }
                    @if (report()?.executiveApprovedDate) {
                      <div class="detail-row">
                        <span class="label">Executive Approved:</span>
                        <span class="value">{{ report()?.executiveApprovedDate | date:'full' }}</span>
                      </div>
                    }
                    @if (report()?.completedDate) {
                      <div class="detail-row">
                        <span class="label">Completed Date:</span>
                        <span class="value">{{ report()?.completedDate | date:'full' }}</span>
                      </div>
                    }
                    @if (report()?.rejectedDate) {
                      <div class="detail-row">
                        <span class="label">Rejected Date:</span>
                        <span class="value rejected">
                          <mat-icon>cancel</mat-icon>
                          {{ report()?.rejectedDate | date:'full' }}
                        </span>
                      </div>
                    }
                    @if (report()?.dueDate) {
                      <div class="detail-row">
                        <span class="label">Due Date:</span>
                        <span class="value" [class]="getDueDateClass(report()?.dueDate!)">
                          <mat-icon>event</mat-icon>
                          {{ report()?.dueDate | date:'full' }}
                        </span>
                      </div>
                    }
                    @if (report()?.rejectionReason) {
                      <div class="detail-row full-width">
                        <span class="label">Rejection Reason:</span>
                        <div class="value rejection-reason">
                          <mat-icon>warning</mat-icon>
                          <p>{{ report()?.rejectionReason }}</p>
                        </div>
                      </div>
                    }
                    @if (report()?.description) {
                      <div class="detail-row full-width">
                        <span class="label">Description:</span>
                        <div class="value description">
                          <p>{{ report()?.description }}</p>
                        </div>
                      </div>
                    }
                    @if (report()?.content) {
                      <div class="detail-row full-width">
                        <span class="label">Content:</span>
                        <div class="value content">
                          <div class="content-display">
                            <pre>{{ report()?.content }}</pre>
                          </div>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            </mat-tab>

            <!-- History Tab -->
            <mat-tab label="History & Workflow">
              <div class="tab-content">
                @if (report() && currentUser()) {
                  <app-workflow-tracker
                    [currentStatus]="report()!.status"
                    [userRole]="getCurrentUserRole()"
                    [userDepartment]="currentUser()!.department"
                    [reportDepartment]="report()!.department"
                    [createdBy]="report()!.creatorName"
                    [currentUserEmail]="currentUser()!.email"
                    [creatorRole]="report()!.creatorRole">
                  </app-workflow-tracker>
                } @else {
                  <div class="loading-container">
                    <mat-spinner diameter="30"></mat-spinner>
                    <p>Loading workflow information...</p>
                  </div>
                }
              </div>
            </mat-tab>

            <!-- Attachments Tab -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>attach_file</mat-icon>
                Attachments
                @if (report()?.attachments && report()!.attachments!.length > 0) {
                  <span class="tab-badge">{{ report()!.attachments!.length }}</span>
                }
              </ng-template>
              <div class="tab-content">
                @if (report()?.attachments && report()!.attachments!.length > 0) {
                  <div class="attachments-section">
                    <h3>Report Attachments</h3>
                    <p class="attachments-description">
                      The following files were attached to this report by {{ report()!.creatorName }}:
                    </p>
                    <app-file-list
                      [files]="getAttachmentsAsUploadedFiles()"
                      [showActions]="true"
                      (filePreview)="onFilePreview($event)"
                      (fileDownload)="onFileDownload($event)">
                    </app-file-list>
                  </div>
                } @else {
                  <div class="no-attachments">
                    <mat-icon>attach_file</mat-icon>
                    <h3>No Attachments</h3>
                    <p>This report has no attached files.</p>
                  </div>
                }
              </div>
            </mat-tab>

            <!-- Approval Documents Tab -->
            <mat-tab>
              <ng-template mat-tab-label>
                <mat-icon>folder_shared</mat-icon>
                Approval Documents
                @if (hasApprovalDocuments()) {
                  <span class="tab-badge">{{ getTotalApprovalDocuments() }}</span>
                }
              </ng-template>
              <div class="tab-content">
                <!-- Temporary: Always show upload section for debugging -->
                <div class="approval-upload-section">
                  <h3>Upload Approval Documents</h3>
                  <p class="section-description">
                    Upload documents related to the approval process for this report.
                    <br><small style="color: #666;">
                      Debug: Status={{ report()?.status }}, UserRole={{ getCurrentUserRole() }}, CanUpload={{ canUploadApprovalDocuments() }}
                    </small>
                  </p>
                  <app-approval-document-upload
                    [reportId]="report()!.id"
                    [approvalStage]="getCurrentApprovalStage()"
                    [userRole]="getCurrentUserRole()"
                    [canUpload]="canUploadApprovalDocuments()"
                    (documentsUploaded)="onApprovalDocumentsUploaded($event)">
                  </app-approval-document-upload>
                  <mat-divider class="section-divider"></mat-divider>
                </div>
                
                <div class="approval-documents-section">
                  <h3>Approval Documents by Stage</h3>
                  <p class="section-description">
                    View documents uploaded during each stage of the approval process.
                  </p>
                  <app-approval-stage-documents
                    [attachmentsByStage]="getApprovalAttachmentsByStage()"
                    [userRole]="getCurrentUserRole()"
                    (filePreview)="onFilePreview($event)"
                    (fileDownload)="onFileDownload($event)">
                  </app-approval-stage-documents>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </mat-card>
      } @else {
        <div class="error-container">
          <mat-icon>error_outline</mat-icon>
          <h2>Report Not Found</h2>
          <p>The requested report could not be found or you don't have permission to view it.</p>
          <button mat-raised-button color="primary" (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Go Back
          </button>
        </div>
      }
    </div>
    
  `,
  styles: [`
    .report-details-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .loading-container, .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .report-header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 20px;
      flex-wrap: wrap;
    }

    .header-text {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      flex: 1;
    }

    .back-button {
      margin-top: 8px;
    }

    .title-section {
      flex: 1;
    }

    .report-title {
      margin: 0 0 12px 0;
      color: #1976d2;
      font-size: 2rem;
      font-weight: 500;
    }

    .status-badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .quick-details {
      margin-top: 16px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #1976d2;
    }

    .quick-detail-item {
      display: flex;
      gap: 8px;
      margin-bottom: 8px;
      align-items: flex-start;
    }

    .quick-detail-item.full-width {
      flex-direction: column;
      gap: 4px;
    }

    .quick-detail-item:last-child {
      margin-bottom: 0;
    }

    .quick-label {
      font-weight: 500;
      color: #666;
      min-width: 80px;
      flex-shrink: 0;
    }

    .quick-value {
      color: #333;
      flex: 1;
    }

    .quick-value.description {
      line-height: 1.5;
      color: #555;
    }

    .due-date-overdue {
      color: #d32f2f !important;
      font-weight: 500;
    }

    .due-date-soon {
      color: #f57c00 !important;
      font-weight: 500;
    }

    .due-date-normal {
      color: #333;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      align-items: center;
    }

    .view-mode-indicator,
    .no-access-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: #f5f5f5;
      border-radius: 4px;
      color: #666;
      font-size: 0.9rem;
    }

    .no-access-indicator {
      background: #ffebee;
      color: #c62828;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e0e0e0;
      grid-column: 1 / -1;
    }

    .section-header h3 {
      margin: 0;
      color: #1976d2;
      font-size: 1.4rem;
      font-weight: 500;
    }

    .edit-hint {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #666;
      font-size: 0.9rem;
      font-style: italic;
    }

    .priority {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .value.rejected {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #d32f2f;
    }

    .rejection-reason {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #ffebee;
      padding: 12px;
      border-radius: 4px;
      border-left: 4px solid #d32f2f;
    }

    .rejection-reason p {
      margin: 0;
      color: #c62828;
      line-height: 1.6;
    }

    .content-display {
      background: #f8f9fa;
      border: 1px solid #e9ecef;
      border-radius: 4px;
      padding: 16px;
      margin-top: 8px;
    }

    .content-card {
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .tab-content {
      padding: 24px;
      min-height: 400px;
    }

    .edit-form {
      width: 100%;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .full-width {
      grid-column: 1 / -1;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      align-items: center;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }

    .unsaved-changes {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #ff9800;
      font-size: 0.9rem;
      margin-left: auto;
    }

    .details-grid {
      display: grid;
      gap: 16px;
    }

    .detail-row {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 16px;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .detail-row.full-width {
      grid-template-columns: 1fr;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      color: #333;
    }

    .value.description {
      line-height: 1.6;
      margin: 0;
    }

    .value.content pre {
      white-space: pre-wrap;
      word-wrap: break-word;
      font-family: inherit;
      margin: 0;
      line-height: 1.6;
    }

    .workflow-timeline {
      max-width: 600px;
    }

    .timeline {
      position: relative;
      padding-left: 30px;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 12px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e0e0e0;
    }

    .timeline-item {
      position: relative;
      margin-bottom: 30px;
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .timeline-item mat-icon {
      background: #fff;
      border: 2px solid #e0e0e0;
      border-radius: 50%;
      padding: 8px;
      color: #999;
      margin-left: -18px;
      z-index: 1;
    }

    .timeline-item.completed mat-icon {
      border-color: #4caf50;
      background: #4caf50;
      color: white;
    }

    .timeline-content h4 {
      margin: 0 0 4px 0;
      color: #333;
    }

    .timeline-content p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    /* Status classes */
    .status-draft { background-color: #9e9e9e !important; color: white !important; }
    .status-submitted { background-color: #2196f3 !important; color: white !important; }
    .status-manager-review { background-color: #ff9800 !important; color: white !important; }
    .status-manager-approved { background-color: #4caf50 !important; color: white !important; }
    .status-executive-review { background-color: #9c27b0 !important; color: white !important; }
    .status-completed { background-color: #4caf50 !important; color: white !important; }
    .status-rejected { background-color: #f44336 !important; color: white !important; }

    /* Priority classes */
    .priority-low { background-color: #4caf50 !important; color: white !important; }
    .priority-medium { background-color: #ff9800 !important; color: white !important; }
    .priority-high { background-color: #f44336 !important; color: white !important; }
    .priority-critical { background-color: #d32f2f !important; color: white !important; }

    /* Due date classes */
    .due-date-overdue { color: #f44336; font-weight: 500; }
    .due-date-soon { color: #ff9800; font-weight: 500; }
    .due-date-normal { color: #333; }

    .inline-spinner {
      margin-right: 8px;
    }

    @media (max-width: 768px) {
      .report-details-container {
        padding: 12px;
      }

      .header-content {
        flex-direction: column;
        align-items: stretch;
      }

      .header-actions {
        justify-content: stretch;
      }

      .header-actions button {
        flex: 1;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }

      .detail-row {
        grid-template-columns: 1fr;
        gap: 8px;
      }

      .report-title {
        font-size: 1.5rem;
      }

      .quick-details {
        margin-top: 12px;
        padding: 12px;
      }

      .quick-detail-item {
        flex-direction: column;
        gap: 4px;
        margin-bottom: 12px;
      }

      .quick-label {
        min-width: auto;
        font-size: 0.9rem;
      }
    }

    /* Attachments Section */
    .attachments-section {
      padding: 20px 0;
    }

    .attachments-section h3 {
      margin: 0 0 8px 0;
      color: #1976d2;
      font-weight: 500;
    }

    .attachments-description {
      margin: 0 0 16px 0;
      color: #666;
      font-size: 0.9rem;
    }

    .no-attachments {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .no-attachments mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-attachments h3 {
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    .tab-badge {
      background: #1976d2;
      color: white;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 0.7rem;
      margin-left: 8px;
      min-width: 16px;
      text-align: center;
    }

    /* Approval Documents Styles */
    .approval-upload-section {
      margin-bottom: 24px;
    }

    .approval-documents-section h3,
    .approval-upload-section h3 {
      margin: 0 0 8px 0;
      color: #1976d2;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-description {
      color: #666;
      margin: 0 0 16px 0;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .section-divider {
      margin: 24px 0;
    }
  `]
})
export class ReportDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private reportsService = inject(ReportsService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private http = inject(HttpClient);

  // Signals
  isLoading = signal(false);
  isSaving = signal(false);
  isEditMode = signal(false);
  report = signal<Report | null>(null);

  // Computed
  currentUser = computed(() => this.authService.currentUser());

  editForm: FormGroup;

  constructor() {
    this.editForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      type: ['', Validators.required],
      priority: ['', Validators.required],
      dueDate: [''],
      description: [''],
      content: ['']
    });
  }

  ngOnInit() {
    const reportId = this.route.snapshot.paramMap.get('id');
    if (reportId) {
      this.loadReport(reportId);
    }
  }

  loadReport(id: string) {
    this.isLoading.set(true);
    this.reportsService.getReport(id).subscribe({
      next: (report) => {
        this.report.set(report);
        this.populateEditForm(report);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading report:', error);
        this.snackBar.open('Failed to load report', 'Close', { duration: 5000 });
        this.isLoading.set(false);
      }
    });
  }

  populateEditForm(report: Report) {
    this.editForm.patchValue({
      title: report.title,
      type: report.type,
      priority: report.priority,
      dueDate: report.dueDate,
      description: report.description,
      content: report.content
    });
  }

  // Permission checks
  canEdit(): boolean {
    const user = this.currentUser();
    const report = this.report();
    
    if (!user || !report) return false;
    
    // General Staff can edit their own reports in Draft status
    if (user.role === UserRole.GeneralStaff) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      return report.creatorName === userFullName && report.status === ReportStatus.Draft;
    }
    
    // Line managers can edit:
    // 1. Their own reports in Draft or Submitted status
    // 2. Reports from their department staff in Draft or Submitted status
    if (user.role === UserRole.LineManager) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      const isOwnReport = report.creatorName === userFullName;
      const isDepartmentReport = report.department === user.department;
      
      if (isOwnReport) {
        return report.status === ReportStatus.Draft || report.status === ReportStatus.Submitted;
      }
      
      if (isDepartmentReport) {
        return report.status === ReportStatus.Draft || report.status === ReportStatus.Submitted;
      }
    }
    
    // Executives can edit:
    // 1. Their own reports in any editable status
    // 2. Any report in certain statuses for administrative purposes
    if (user.role === UserRole.Executive) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      const isOwnReport = report.creatorName === userFullName;
      
      if (isOwnReport) {
        return report.status === ReportStatus.Draft || 
               report.status === ReportStatus.Submitted ||
               report.status === ReportStatus.ManagerApproved;
      }
      
      // Executives can edit reports under review for corrections
      return report.status === ReportStatus.Submitted || 
             report.status === ReportStatus.ManagerApproved;
    }
    
    return false;
  }

  canView(): boolean {
    const user = this.currentUser();
    const report = this.report();
    
    if (!user || !report) return false;
    
    // General Staff can view their own reports
    if (user.role === UserRole.GeneralStaff) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      return report.creatorName === userFullName;
    }
    
    // Line Managers can view reports from their department (all statuses including Completed)
    if (user.role === UserRole.LineManager) {
      return report.department === user.department;
    }
    
    // Executives can view all reports
    return user.role === UserRole.Executive;
  }

  canSubmit(): boolean {
    const user = this.currentUser();
    const report = this.report();
    
    if (!user || !report) return false;
    
    const userFullName = `${user.firstName} ${user.lastName}`;
    return user.role === UserRole.GeneralStaff && 
           report.creatorName === userFullName && 
           report.status === ReportStatus.Draft;
  }

  canApprove(): boolean {
    const user = this.currentUser();
    const report = this.report();
    
    if (!user || !report) return false;
    
    if (user.role === UserRole.LineManager) {
      return report.department === user.department && 
             report.status === ReportStatus.ManagerReview;
    }
    
    if (user.role === UserRole.Executive) {
      return report.status === ReportStatus.ExecutiveReview;
    }
    
    return false;
  }

  getCurrentUserRole(): UserRole {
    const user = this.currentUser();
    return user?.role || UserRole.GeneralStaff;
  }

  // Actions
  toggleEditMode() {
    this.isEditMode.update(mode => !mode);
    if (!this.isEditMode()) {
      // Reset form to original values
      this.populateEditForm(this.report()!);
    }
  }

  cancelEdit() {
    this.isEditMode.set(false);
    // Reset form to original values
    this.populateEditForm(this.report()!);
  }

  saveReport() {
    if (this.editForm.valid && !this.isSaving()) {
      this.isSaving.set(true);
      
      const updateDto: UpdateReportDto = {
        title: this.editForm.value.title,
        type: this.editForm.value.type,
        priority: this.editForm.value.priority,
        dueDate: this.editForm.value.dueDate || undefined,
        description: this.editForm.value.description || undefined,
        content: this.editForm.value.content || undefined
      };

      this.reportsService.updateReport(this.report()!.id, updateDto).subscribe({
        next: (updatedReport) => {
          this.report.set(updatedReport);
          this.isEditMode.set(false);
          this.isSaving.set(false);
          this.snackBar.open('Report updated successfully', 'Close', { 
            duration: 5000, 
            panelClass: ['success-snackbar'] 
          });
        },
        error: (error) => {
          console.error('Error updating report:', error);
          this.snackBar.open('Failed to update report', 'Close', { 
            duration: 5000, 
            panelClass: ['error-snackbar'] 
          });
          this.isSaving.set(false);
        }
      });
    }
  }

  submitReport() {
    const report = this.report();
    if (!report) return;

    const dialogData: ConfirmationDialogData = {
      title: 'Submit Report for Review',
      message: `Are you sure you want to submit "${report.title}" for review? Once submitted, you will no longer be able to edit this report until it is returned to you.`,
      confirmText: 'Submit for Review',
      cancelText: 'Cancel',
      requireInput: false,
      type: 'confirm'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: ConfirmationDialogResult) => {
      if (result?.confirmed) {
        this.isSaving.set(true);
        
        this.reportsService.submitReport(report.id).subscribe({
          next: (updatedReport) => {
            this.report.set(updatedReport);
            this.isSaving.set(false);
            this.snackBar.open(
              'Report submitted for review successfully!',
              'Close',
              { duration: 5000, panelClass: ['success-snackbar'] }
            );
          },
          error: (error) => {
            console.error('Error submitting report:', error);
            this.snackBar.open(
              'Failed to submit report. Please try again.',
              'Close',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
            this.isSaving.set(false);
          }
        });
      }
    });
  }

  approveReport() {
    const report = this.report();
    if (!report) return;

    const dialogData: ConfirmationDialogData = {
      title: 'Approve Report',
      message: `Are you sure you want to approve "${report.title}"? This action will move the report to the next stage in the approval workflow.`,
      confirmText: 'Approve Report',
      cancelText: 'Cancel',
      requireInput: true,
      inputLabel: 'Approval Comments (Optional)',
      inputPlaceholder: 'Add any comments about your approval...',
      inputRequired: false,
      type: 'approve'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: ConfirmationDialogResult) => {
      if (result?.confirmed) {
        this.isSaving.set(true);
        
        this.reportsService.approveReport(report.id, result.inputValue).subscribe({
          next: (response) => {
            // Reload the report to get updated status
            this.loadReport(report.id);
            this.isSaving.set(false);
            this.snackBar.open(
              'Report approved successfully!',
              'Close',
              { duration: 5000, panelClass: ['success-snackbar'] }
            );
          },
          error: (error) => {
            console.error('Error approving report:', error);
            this.snackBar.open(
              'Failed to approve report. Please try again.',
              'Close',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
            this.isSaving.set(false);
          }
        });
      }
    });
  }

  rejectReport() {
    const report = this.report();
    if (!report) return;

    const dialogData: ConfirmationDialogData = {
      title: 'Reject Report',
      message: `Are you sure you want to reject "${report.title}"? Please provide a reason for rejection. The report will be sent back to the author for revision.`,
      confirmText: 'Reject Report',
      cancelText: 'Cancel',
      requireInput: true,
      inputLabel: 'Rejection Reason (Required)',
      inputPlaceholder: 'Please provide a detailed reason for rejecting this report...',
      inputRequired: true,
      type: 'reject'
    };

    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '500px',
      data: dialogData,
      disableClose: true
    });

    dialogRef.afterClosed().subscribe((result: ConfirmationDialogResult) => {
      if (result?.confirmed && result.inputValue) {
        this.isSaving.set(true);
        
        this.reportsService.rejectReport(report.id, result.inputValue).subscribe({
          next: (response) => {
            // Reload the report to get updated status
            this.loadReport(report.id);
            this.isSaving.set(false);
            this.snackBar.open(
              'Report rejected successfully!',
              'Close',
              { duration: 5000, panelClass: ['success-snackbar'] }
            );
          },
          error: (error) => {
            console.error('Error rejecting report:', error);
            this.snackBar.open(
              'Failed to reject report. Please try again.',
              'Close',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
            this.isSaving.set(false);
          }
        });
      }
    });
  }

  downloadReport() {
    const report = this.report();
    if (!report) return;

    this.isSaving.set(true);
    
    this.reportsService.exportReport(report.id, 'pdf').subscribe({
      next: (blob) => {
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_report.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        this.isSaving.set(false);
        this.snackBar.open(
          'Report downloaded successfully!',
          'Close',
          { duration: 3000, panelClass: ['success-snackbar'] }
        );
      },
      error: (error) => {
        console.error('Error downloading report:', error);
        this.snackBar.open(
          'Failed to download report. Please try again.',
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
        this.isSaving.set(false);
      }
    });
  }

  goBack() {
    this.router.navigate(['/reports']);
  }

  // Helper methods
  getStatusDisplay(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.Draft: return 'Draft';
      case ReportStatus.Submitted: return 'Submitted';
      case ReportStatus.ManagerReview: return 'Manager Review';
      case ReportStatus.ManagerApproved: return 'Manager Approved';
      case ReportStatus.ExecutiveReview: return 'Executive Review';
      case ReportStatus.Completed: return 'Completed';
      case ReportStatus.Rejected: return 'Rejected';
      case ReportStatus.ManagerRejected: return 'Rejected by Manager';
      case ReportStatus.ExecutiveRejected: return 'Rejected by Executive';
      default: return 'Unknown';
    }
  }

  getStatusClass(status: ReportStatus): string {
    return `status-${this.getStatusDisplay(status).toLowerCase().replace(/\s+/g, '-')}`;
  }

  getStatusIcon(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.Draft: return 'draft';
      case ReportStatus.Submitted: return 'send';
      case ReportStatus.ManagerReview: return 'rate_review';
      case ReportStatus.ManagerApproved: return 'check_circle';
      case ReportStatus.ExecutiveReview: return 'supervisor_account';
      case ReportStatus.Completed: return 'verified';
      case ReportStatus.Rejected: return 'cancel';
      case ReportStatus.ManagerRejected: return 'cancel';
      case ReportStatus.ExecutiveRejected: return 'cancel';
      default: return 'help';
    }
  }

  getPriorityClass(priority: string | undefined): string {
    if (!priority) return 'priority-medium'; // Default fallback
    return `priority-${priority.toLowerCase()}`;
  }

  getPriorityIcon(priority: string | undefined): string {
    if (!priority) return 'help'; // Default fallback
    switch (priority) {
      case 'Low': return 'keyboard_arrow_down';
      case 'Medium': return 'remove';
      case 'High': return 'keyboard_arrow_up';
      case 'Critical': return 'warning';
      default: return 'help';
    }
  }

  getDepartmentDisplay(department: Department): string {
    switch (department) {
      case Department.ProjectSupport: return 'Project Support';
      case Department.DocManagement: return 'Document Management';
      case Department.QS: return 'QS';
      case Department.ContractsManagement: return 'Contracts Management';
      case Department.BusinessAssurance: return 'Business Assurance';
      default: return 'Unknown Department';
    }
  }

  getDueDateClass(dueDate: Date | string): string {
    if (!dueDate) return 'due-date-normal';
    
    const today = new Date();
    const targetDate = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    
    // Check if the date is valid
    if (isNaN(targetDate.getTime())) return 'due-date-normal';
    
    const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'due-date-overdue';
    if (daysDiff <= 3) return 'due-date-soon';
    return 'due-date-normal';
  }

  isStatusCompleted(statusLevel: number): boolean {
    const currentStatus = this.report()?.status;
    if (!currentStatus) return false;
    return currentStatus >= statusLevel;
  }

  getAttachmentsAsUploadedFiles(): UploadedFile[] {
    const attachments = this.report()?.attachments || [];
    return attachments.map(attachment => ({
      id: attachment.id,
      name: attachment.originalFileName,
      size: attachment.fileSize,
      type: attachment.mimeType || this.inferMimeTypeFromFilename(attachment.originalFileName),
      url: `/api/reports/${this.report()?.id}/attachments/${attachment.id}/download`,
      isUploading: false,
      uploadProgress: 100
    }));
  }

  private inferMimeTypeFromFilename(filename: string): string {
    if (!filename) return 'application/octet-stream';
    
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls': return 'application/vnd.ms-excel';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'ppt': return 'application/vnd.ms-powerpoint';
      case 'pptx': return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      case 'txt': return 'text/plain';
      case 'jpg': case 'jpeg': return 'image/jpeg';
      case 'png': return 'image/png';
      case 'gif': return 'image/gif';
      case 'webp': return 'image/webp';
      default: return 'application/octet-stream';
    }
  }

  onFilePreview(file: UploadedFile): void {
    if (!file.id || !this.report()?.id) {
      this.snackBar.open('Unable to preview file - missing file information', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // Check if file type can be previewed
    if (!this.canPreviewInline(file.type)) {
      this.snackBar.open(
        `Preview not available for ${file.type || 'this file type'}. Use download instead.`,
        'Close',
        { duration: 3000 }
      );
      return;
    }

    const previewUrl = `${environment.apiUrl}/reports/${this.report()?.id}/attachments/${file.id}/preview`;
    
    this.snackBar.open('Loading preview...', '', { duration: 1000 });

    // Use HTTP client to fetch with authentication
    this.http.get(previewUrl, { 
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        const blob = response.body;
        if (blob) {
          // Create object URL from blob
          const objectUrl = URL.createObjectURL(blob);
          // Open in new tab
          const newWindow = window.open(objectUrl, '_blank');
          if (!newWindow) {
            this.snackBar.open('Popup blocked. Please allow popups for this site.', 'Close', { 
              duration: 3000 
            });
          }
          // Clean up object URL after a delay to allow the browser to load it
          setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
        }
      },
      error: (error) => {
        console.error('Preview error:', error);
        this.snackBar.open(
          `Failed to preview file: ${error.status === 401 ? 'Unauthorized' : 'Server error'}`,
          'Close',
          { duration: 3000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  onFileDownload(file: UploadedFile): void {
    if (!file.id || !this.report()?.id) {
      this.snackBar.open('Unable to download file - missing file information', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    const downloadUrl = `${environment.apiUrl}/reports/${this.report()?.id}/attachments/${file.id}/download`;
    
    this.snackBar.open(`Downloading "${file.name}"...`, 'Close', { duration: 2000 });

    // Use HTTP client to download with authentication
    this.http.get(downloadUrl, { 
      responseType: 'blob',
      observe: 'response'
    }).subscribe({
      next: (response) => {
        const blob = response.body;
        if (blob) {
          // Create object URL from blob and trigger download
          const objectUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = objectUrl;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          // Clean up object URL
          URL.revokeObjectURL(objectUrl);
        }
      },
      error: (error) => {
        console.error('Download error:', error);
        this.snackBar.open(
          `Failed to download file: ${error.status === 401 ? 'Unauthorized' : 'Server error'}`,
          'Close',
          { duration: 3000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  private canPreviewInline(fileType: string): boolean {
    if (!fileType) return false;
    const previewableTypes = ['image/', 'application/pdf', 'text/plain'];
    return previewableTypes.some(type => fileType.startsWith(type));
  }

  // Approval Document Management Methods

  hasApprovalDocuments(): boolean {
    const attachments = this.report()?.attachments || [];
    return attachments.some(att => att.approvalStage !== undefined);
  }

  getTotalApprovalDocuments(): number {
    const attachments = this.report()?.attachments || [];
    return attachments.filter(att => att.approvalStage !== undefined).length;
  }

  canUploadApprovalDocuments(): boolean {
    const currentUser = this.currentUser();
    const report = this.report();
    
    if (!currentUser || !report) return false;

    // User can upload if they have the permission to approve at the current stage
    const userRole = this.getCurrentUserRole();
    const status = report.status;

    // Check if report is in a state where approval documents can be uploaded
    switch (status) {
      case ReportStatus.ManagerReview:
        return userRole === UserRole.LineManager || userRole === UserRole.Executive;
      case ReportStatus.ExecutiveReview:
        return userRole === UserRole.Executive;
      default:
        return false;
    }
  }

  getCurrentApprovalStage(): ApprovalStage {
    const report = this.report();
    if (!report) return ApprovalStage.Initial;

    switch (report.status) {
      case ReportStatus.Draft:
      case ReportStatus.Submitted:
        return ApprovalStage.Initial;
      case ReportStatus.ManagerReview:
      case ReportStatus.ManagerApproved:
      case ReportStatus.ManagerRejected:
        return ApprovalStage.ManagerReview;
      case ReportStatus.ExecutiveReview:
      case ReportStatus.ExecutiveRejected:
      case ReportStatus.Completed:
        return ApprovalStage.ExecutiveReview;
      default:
        return ApprovalStage.Initial;
    }
  }

  onApprovalDocumentsUploaded(event: any): void {
    const uploadedFiles = Array.isArray(event) ? event : (event?.files || []);
    
    this.snackBar.open(
      `Successfully uploaded ${uploadedFiles.length} approval document(s)`,
      'Close',
      { duration: 3000, panelClass: ['success-snackbar'] }
    );

    // Refresh the report to get updated attachments
    const reportId = this.report()?.id;
    if (reportId) {
      this.reportsService.getReport(reportId).subscribe({
        next: (updatedReport) => {
          this.report.set(updatedReport);
        },
        error: (error) => {
          console.error('Error refreshing report after upload:', error);
        }
      });
    }
  }

  getApprovalAttachmentsByStage(): { [key in ApprovalStage]: UploadedFile[] } {
    const attachments = this.report()?.attachments || [];
    const result: { [key in ApprovalStage]: UploadedFile[] } = {
      [ApprovalStage.Initial]: [],
      [ApprovalStage.ManagerReview]: [],
      [ApprovalStage.ExecutiveReview]: []
    };

    attachments.forEach(attachment => {
      if (attachment.approvalStage !== undefined) {
        const uploadedFile: UploadedFile = {
          id: attachment.id,
          name: attachment.originalFileName,
          size: attachment.fileSize,
          type: attachment.mimeType || this.inferMimeTypeFromFilename(attachment.originalFileName),
          url: `/api/reports/${this.report()?.id}/attachments/${attachment.id}/download`,
          isUploading: false,
          uploadProgress: 100,
          approvalStage: attachment.approvalStage,
          uploadedByName: attachment.uploadedByName,
          uploadedDate: attachment.uploadedDate
        };
        result[attachment.approvalStage].push(uploadedFile);
      }
    });

    return result;
  }
}
