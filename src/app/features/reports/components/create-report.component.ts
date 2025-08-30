import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { toSignal } from '@angular/core/rxjs-interop';

import { ReportsService, CreateReportDto } from '../../../core/services/reports.service';
import { AuthService } from '../../../core/services/auth.service';
import { FeatureFlagService } from '../../../core/services/feature-flag.service';
import { FileUploadComponent, UploadedFile } from '../../../shared/components/file-upload.component';
import { FileListComponent } from '../../../shared/components/file-list.component';
import { Department, UserRole } from '../../../core/models/enums';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FileUploadComponent,
    FileListComponent
  ],
  template: `
    <div class="create-report-dialog">
      <h2 mat-dialog-title>
        <mat-icon>add</mat-icon>
        Create New Report
      </h2>

      <mat-dialog-content>
        <form [formGroup]="reportForm" class="report-form">
          <!-- Title -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Report Title</mat-label>
            <input 
              matInput 
              formControlName="title"
              placeholder="Enter a descriptive title for your report"
              maxlength="200">
            <mat-hint>Required - Maximum 200 characters</mat-hint>
            <mat-error *ngIf="reportForm.get('title')?.hasError('required')">
              Title is required
            </mat-error>
            <mat-error *ngIf="reportForm.get('title')?.hasError('minlength')">
              Title must be at least 5 characters long
            </mat-error>
          </mat-form-field>

          <!-- Type -->
          <mat-form-field appearance="outline" class="full-width">
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
            <mat-hint>Select the type of report you're creating</mat-hint>
            <mat-error *ngIf="reportForm.get('type')?.hasError('required')">
              Report type is required
            </mat-error>
          </mat-form-field>

          <!-- Department -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Department</mat-label>
            <mat-select formControlName="department">
              <mat-option 
                *ngFor="let dept of availableDepartments()" 
                [value]="dept.value">
                {{ dept.label }}
              </mat-option>
            </mat-select>
            <mat-hint>
              {{ canSelectDepartment() ? 'Select the department this report is for' : 'Department is automatically set based on your role' }}
            </mat-hint>
            <mat-error *ngIf="reportForm.get('department')?.hasError('required')">
              Department is required
            </mat-error>
          </mat-form-field>

          <!-- Priority -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="Low">Low</mat-option>
              <mat-option value="Medium">Medium</mat-option>
              <mat-option value="High">High</mat-option>
              <mat-option value="Critical">Critical</mat-option>
            </mat-select>
            <mat-hint>Set the priority level for this report</mat-hint>
            <mat-error *ngIf="reportForm.get('priority')?.hasError('required')">
              Priority is required
            </mat-error>
          </mat-form-field>

          <!-- Due Date -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Due Date (Optional)</mat-label>
            <input 
              matInput 
              [matDatepicker]="picker"
              formControlName="dueDate"
              readonly>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-hint>When should this report be completed?</mat-hint>
            <mat-error *ngIf="reportForm.get('dueDate')?.hasError('pastDate')">
              Due date cannot be in the past
            </mat-error>
          </mat-form-field>

          <!-- Description -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea 
              matInput 
              formControlName="description"
              placeholder="Provide a detailed description of the report purpose, scope, and any specific requirements..."
              rows="4"
              maxlength="1000">
            </textarea>
            <mat-hint>Optional - Provide additional context (maximum 1000 characters)</mat-hint>
          </mat-form-field>

          <!-- Content Section -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Report Content</mat-label>
            <textarea 
              matInput 
              formControlName="content"
              placeholder="Enter the content for your report. Provide detailed information about the subject matter..."
              rows="8"
              maxlength="10000">
            </textarea>
            <mat-hint>Add your report content (maximum 10,000 characters)</mat-hint>
            <mat-error *ngIf="reportForm.get('content')?.hasError('required')">
              Report content is required
            </mat-error>
          </mat-form-field>

          <!-- File Attachments Section -->
          @if (isFileUploadEnabled()) {
            <div class="attachments-section full-width">
              <label class="section-label">
                <mat-icon>attach_file</mat-icon>
                Attachments (Optional)
              </label>
              
              <app-file-upload
                [allowMultiple]="true"
                [maxFileSize]="maxFileSize"
                [acceptedTypes]="acceptedFileTypes"
                [acceptedTypesText]="'PDF, Word, Excel, Images (Max 10MB each)'"
                [dropText]="'Drag & drop supporting documents here'"
                [disabled]="isSubmitting()"
                (filesChange)="onFilesChange($event)"
                (fileUploaded)="onFileUploaded($event)"
                (uploadError)="onFileUploadError($event)">
              </app-file-upload>

              <div class="attachment-note">
                <mat-icon color="primary" style="font-size: 16px; height: 16px; width: 16px;">info</mat-icon>
                <span>You can create reports with or without attachments. Supporting documents can also be added later during the review process.</span>
              </div>

              @if (attachedFiles().length > 0) {
                <div class="files-preview">
                  <app-file-list
                    [files]="attachedFiles()"
                    [showActions]="true"
                    [showSummary]="true"
                    (fileRemove)="onFileRemove($event)"
                    (filePreview)="onFilePreview($event)"
                    (fileDownload)="onFileDownload($event)">
                  </app-file-list>
                </div>
              }
            </div>
          }
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" [disabled]="isSubmitting()">
          Cancel
        </button>
        <button 
          mat-stroked-button 
          color="primary" 
          (click)="onSaveAsDraft()"
          [disabled]="!canSaveAsDraft() || isSubmitting()">
          @if (isSubmitting() && !isSubmittingForReview()) {
            <mat-spinner diameter="20" class="inline-spinner"></mat-spinner>
            Saving...
          } @else {
            <ng-container>
              <mat-icon>save</mat-icon>
              Save as Draft
            </ng-container>
          }
        </button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onSubmitForReview()"
          [disabled]="!canSubmitForReview() || isSubmitting()">
          @if (isSubmitting() && isSubmittingForReview()) {
            <mat-spinner diameter="20" class="inline-spinner"></mat-spinner>
            Submitting...
          } @else {
            <ng-container>
              <mat-icon>send</mat-icon>
              Submit for Review
            </ng-container>
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .create-report-dialog {
      width: 100%;
      max-width: 600px;
    }

    .report-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
    }

    .priority-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .priority-option.low {
      color: #4caf50;
    }

    .priority-option.medium {
      color: #ff9800;
    }

    .priority-option.high {
      color: #f44336;
    }

    .priority-option.critical {
      color: #d32f2f;
      font-weight: 500;
    }

    .inline-spinner {
      margin-right: 8px;
    }

    mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
    }

    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }

    mat-form-field {
      margin-bottom: 8px;
    }

    .mat-mdc-form-field-hint,
    .mat-mdc-form-field-error {
      font-size: 0.75rem;
    }

    textarea {
      resize: vertical;
      min-height: 60px;
    }

    /* Attachments Section Styles */
    .attachments-section {
      border: 1px solid #e3f2fd;
      border-radius: 8px;
      padding: 1.5rem;
      background: linear-gradient(135deg, #f8fbff 0%, #f0f7ff 100%);
      margin-top: 1rem;
    }

    .attachments-section .section-title {
      color: #1976d2;
      margin-bottom: 1rem;
      font-weight: 600;
    }

    .attachment-note {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #e3f2fd;
      border: 1px solid #bbdefb;
      border-radius: 6px;
      padding: 0.75rem;
      margin-top: 1rem;
      color: #0d47a1;
      font-size: 0.875rem;
    }

    .attachment-note mat-icon {
      flex-shrink: 0;
    }

    .attachment-warning {
      display: flex;
      align-items: flex-start;
      gap: 0.5rem;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 6px;
      padding: 0.75rem;
      margin-bottom: 1rem;
      color: #856404;
    }

    .attachment-warning .warning-icon {
      color: #f39c12;
      font-size: 1.2rem;
      margin-top: 0.1rem;
    }

    .attachment-warning .warning-text {
      font-size: 0.875rem;
      line-height: 1.4;
    }

    .attachment-warning strong {
      font-weight: 600;
    }

    .file-upload-info {
      font-size: 0.875rem;
      color: #666;
      background: rgba(25, 118, 210, 0.05);
      padding: 0.75rem;
      border-radius: 4px;
      border-left: 3px solid #1976d2;
      margin-bottom: 1rem;
    }

    .attached-files-list {
      margin-top: 1rem;
    }
  `]
})
export class CreateReportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reportsService = inject(ReportsService);
  private authService = inject(AuthService);
  private featureFlagService = inject(FeatureFlagService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateReportComponent>);

  isSubmitting = signal(false);
  isSubmittingForReview = signal(false);
  attachedFiles = signal<UploadedFile[]>([]);

  // File upload configuration
  readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  readonly acceptedFileTypes = '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.webp';
  
  // Get current user info as a proper signal
  private currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  reportForm: FormGroup;

  constructor() {
    this.reportForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      type: ['', Validators.required],
      department: [Department.ProjectSupport, Validators.required], // Use default until user loads
      priority: ['Medium', Validators.required],
      dueDate: ['', this.futureDateValidator],
      description: [''],
      content: ['', Validators.required]
    });

    // Effect to handle user loading and update form accordingly
    effect(() => {
      const user = this.currentUser();
      if (user) {
        // Update department to user's department if not a GM
        if (user.role !== UserRole.GM) {
          const defaultDept = user.department || Department.ProjectSupport;
          this.reportForm.get('department')?.setValue(defaultDept);
        }
        
        // Update department control state
        this.updateDepartmentControlState();
      }
    });
  }

  ngOnInit() {
    // Component initialization complete
  }

  private updateDepartmentControlState() {
    const departmentControl = this.reportForm.get('department');
    if (departmentControl) {
      if (this.canSelectDepartment()) {
        departmentControl.enable();
      } else {
        departmentControl.disable();
      }
    }
  }

  // Department logic - converted to computed signals to prevent infinite loops
  canSelectDepartment = computed(() => {
    const user = this.currentUser();
    return user?.role === UserRole.GM;
  });

  availableDepartments = computed(() => {
    const user = this.currentUser();
    
    if (user?.role === UserRole.GM) {
      // GM can create reports for any department
      return [
        { value: Department.ProjectSupport, label: 'Project Support' },
        { value: Department.DocManagement, label: 'Document Management' },
        { value: Department.QS, label: 'QS' },
        { value: Department.ContractsManagement, label: 'Contracts Management' },
        { value: Department.BusinessAssurance, label: 'Business Assurance' }
      ];
    } else {
      // Staff and Line Managers can only create for their department
      return [{ 
        value: user?.department || Department.ProjectSupport, 
        label: this.getDepartmentLabel(user?.department || Department.ProjectSupport) 
      }];
    }
  });

  private getDefaultDepartment(): Department {
    const user = this.currentUser();
    return user?.department || Department.ProjectSupport;
  }

  private getDepartmentLabel(department: Department): string {
    switch (department) {
      case Department.ProjectSupport: return 'Project Support';
      case Department.DocManagement: return 'Document Management';
      case Department.QS: return 'QS';
      case Department.ContractsManagement: return 'Contracts Management';
      case Department.BusinessAssurance: return 'Business Assurance';
      default: return 'Unknown Department';
    }
  }

  // Date validator
  private futureDateValidator(control: any) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDate < today ? { pastDate: true } : null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    this.onSaveAsDraft();
  }

  onSaveAsDraft(): void {
    if (this.canSaveAsDraft() && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      this.isSubmittingForReview.set(false);

      const formValue = this.reportForm.value;
      const createDto: CreateReportDto = {
        title: formValue.title,
        content: formValue.content || '',
        description: formValue.description || undefined,
        type: formValue.type || undefined,
        priority: formValue.priority,
        dueDate: formValue.dueDate || undefined,
        department: formValue.department || this.currentUser()?.department || Department.ProjectSupport,
        attachments: this.attachedFiles()
          .filter(f => f.file != null)
          .map(f => f.file as File)
      };

      this.reportsService.createReport(createDto).subscribe({
        next: (report) => {
          const hasAttachments = createDto.attachments && createDto.attachments.length > 0;
          let message = `Report "${report.title}" saved as draft successfully!`;
          
          if (hasAttachments) {
            message += ` ${createDto.attachments?.length} file(s) attached.`;
          }
          
          this.snackBar.open(
            message,
            'Close',
            { duration: 5000, panelClass: ['success-snackbar'] }
          );
          this.dialogRef.close(report);
        },
        error: (error) => {
          let errorMessage = 'Failed to save report. Please try again.';
          
          // Provide more specific error messages based on the error
          if (error.status === 400) {
            if (error.error && typeof error.error === 'string') {
              errorMessage = `Error: ${error.error}`;
            } else {
              errorMessage = 'Invalid report data. Please check all required fields and try again.';
            }
          } else if (error.status === 401) {
            errorMessage = 'You are not authorized to create reports. Please log in again.';
          } else if (error.status === 413) {
            errorMessage = 'File size too large. Please reduce file size and try again.';
          } else if (error.status === 415) {
            errorMessage = 'Unsupported file type. Please use supported file formats.';
          } else if (error.status >= 500) {
            errorMessage = 'Server error. Please try again later or contact support.';
          }
          
          this.snackBar.open(
            errorMessage,
            'Close',
            { duration: 7000, panelClass: ['error-snackbar'] }
          );
          this.isSubmitting.set(false);
        }
      });
    }
  }

  onSubmitForReview(): void {
    if (this.canSubmitForReview() && !this.isSubmitting()) {
      this.isSubmitting.set(true);
      this.isSubmittingForReview.set(true);

      const formValue = this.reportForm.value;
      const createDto: CreateReportDto = {
        title: formValue.title,
        content: formValue.content || '',
        description: formValue.description || undefined,
        type: formValue.type || undefined,
        priority: formValue.priority,
        dueDate: formValue.dueDate || undefined,
        department: formValue.department || this.currentUser()?.department || Department.ProjectSupport,
        attachments: this.attachedFiles()
          .filter(f => f.file != null)
          .map(f => f.file as File)
      };

      // First create the report as draft, then submit it
      this.reportsService.createReport(createDto).subscribe({
        next: (report) => {
          // Now submit the created report for review
          this.reportsService.submitReport(report.id).subscribe({
            next: (submittedReport) => {
              const hasAttachments = createDto.attachments && createDto.attachments.length > 0;
              let message = `Report "${submittedReport.title}" submitted for Line Manager review successfully!`;
              
              if (hasAttachments) {
                message += ` ${createDto.attachments?.length} file(s) attached.`;
              }
              
              this.snackBar.open(
                message,
                'Close',
                { duration: 5000, panelClass: ['success-snackbar'] }
              );
              this.dialogRef.close(submittedReport);
            },
            error: (error) => {
              this.snackBar.open(
                'Report created but failed to submit for review. You can submit it later from the reports list.',
                'Close',
                { duration: 7000, panelClass: ['warning-snackbar'] }
              );
              this.dialogRef.close(report);
            }
          });
        },
        error: (error) => {
          let errorMessage = 'Failed to create report. Please try again.';
          
          // Provide more specific error messages based on the error
          if (error.status === 400) {
            if (error.error && typeof error.error === 'string') {
              errorMessage = `Error: ${error.error}`;
            } else {
              errorMessage = 'Invalid report data. Please check all required fields and try again.';
            }
          } else if (error.status === 401) {
            errorMessage = 'You are not authorized to create reports. Please log in again.';
          } else if (error.status === 413) {
            errorMessage = 'File size too large. Please reduce file size and try again.';
          } else if (error.status === 415) {
            errorMessage = 'Unsupported file type. Please use supported file formats.';
          } else if (error.status >= 500) {
            errorMessage = 'Server error. Please try again later or contact support.';
          }
          
          this.snackBar.open(
            errorMessage,
            'Close',
            { duration: 7000, panelClass: ['error-snackbar'] }
          );
          this.isSubmitting.set(false);
          this.isSubmittingForReview.set(false);
        }
      });
    }
  }

  // File Upload Methods
  isFileUploadEnabled(): boolean {
    return this.featureFlagService.isAdvancedFileUploadEnabled();
  }

  onFilesChange(files: UploadedFile[]): void {
    this.attachedFiles.set(files);
  }

  onFileUploaded(file: UploadedFile): void {
    this.snackBar.open(
      `File "${file.name}" uploaded successfully`,
      'Close',
      { duration: 3000, panelClass: ['success-snackbar'] }
    );
  }

  onFileUploadError(event: {file: UploadedFile, error: string}): void {
    this.snackBar.open(
      `Failed to upload "${event.file.name}": ${event.error}`,
      'Close',
      { duration: 5000, panelClass: ['error-snackbar'] }
    );
  }

  onFileRemove(file: UploadedFile): void {
    const currentFiles = this.attachedFiles();
    const updatedFiles = currentFiles.filter(f => f !== file);
    this.attachedFiles.set(updatedFiles);
  }

  onFilePreview(file: UploadedFile): void {
    if (!file.url && !file.id) {
      this.snackBar.open('File not yet uploaded - preview not available', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // For newly attached files that haven't been saved yet, show a message
    if (!file.id) {
      this.snackBar.open(
        'Please save the report first to preview attachments',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    // For already saved files with IDs, use the preview URL
    if (file.url) {
      const previewUrl = file.url.replace('/download', '/preview');
      
      // For images and PDFs, open in a new tab for preview
      if (this.canPreviewInline(file.type)) {
        window.open(previewUrl, '_blank');
      } else {
        this.snackBar.open(
          `Preview not available for ${file.type || 'this file type'}. Use download instead.`,
          'Close',
          { duration: 3000 }
        );
      }
    }
  }

  onFileDownload(file: UploadedFile): void {
    if (!file.url && !file.id) {
      this.snackBar.open('File not yet uploaded - download not available', 'Close', { 
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    // For newly attached files that haven't been saved yet, show a message
    if (!file.id) {
      this.snackBar.open(
        'Please save the report first to download attachments',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    // For already saved files with URLs, trigger download
    if (file.url) {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      this.snackBar.open(`Downloading "${file.name}"...`, 'Close', { duration: 2000 });
    }
  }

  private canPreviewInline(fileType: string): boolean {
    if (!fileType) return false;
    const previewableTypes = ['image/', 'application/pdf', 'text/plain'];
    return previewableTypes.some(type => fileType.startsWith(type));
  }

  // Form validation methods
  canSaveAsDraft(): boolean {
    // For drafts, only require title and type (basic fields)
    const titleValid = this.reportForm.get('title')?.valid || false;
    const typeValid = this.reportForm.get('type')?.valid || false;
    
    return titleValid && typeValid;
  }

  canSubmitForReview(): boolean {
    // For final submission, require all fields including content
    return this.reportForm.valid;
  }
}
