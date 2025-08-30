import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileUploadComponent, UploadedFile } from './file-upload.component';
import { ApprovalStage, UserRole } from '../../core/models/enums';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-approval-document-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FileUploadComponent
  ],
  template: `
    <mat-card class="approval-upload-card">
      <mat-card-header>
        <mat-card-title>
          <mat-icon [class]="getStageIconClass()">{{ getStageIcon() }}</mat-icon>
          Upload {{ getStageName() }} Documents
        </mat-card-title>
        <mat-card-subtitle>
          {{ getStageDescription() }}
        </mat-card-subtitle>
      </mat-card-header>

      <mat-card-content>
        @if (!isUploading()) {
          <div class="upload-section">
            <mat-form-field appearance="outline" class="description-field">
              <mat-label>Document Description (Optional)</mat-label>
              <input 
                matInput 
                [(ngModel)]="description" 
                placeholder="Brief description of the documents being uploaded"
                maxlength="500">
              <mat-hint>{{ description.length }}/500</mat-hint>
            </mat-form-field>

            <app-file-upload
              [acceptedTypes]="acceptedFileTypes"
              [maxFileSize]="maxFileSize"
              [allowMultiple]="true"
              [disabled]="isUploading()"
              (filesChange)="onFilesSelected($event)">
            </app-file-upload>

            @if (selectedFiles().length > 0) {
              <div class="upload-actions">
                <button 
                  mat-raised-button 
                  color="primary"
                  (click)="uploadDocuments()"
                  [disabled]="isUploading()">
                  <mat-icon>upload</mat-icon>
                  Upload {{ selectedFiles().length }} Document(s)
                </button>
                <button 
                  mat-button 
                  (click)="clearSelection()"
                  [disabled]="isUploading()">
                  <mat-icon>clear</mat-icon>
                  Clear
                </button>
              </div>
            }
          </div>
        } @else {
          <div class="uploading-state">
            <mat-spinner diameter="40"></mat-spinner>
            <p>Uploading documents...</p>
          </div>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .approval-upload-card {
      margin: 16px 0;
      border-left: 4px solid var(--primary-color, #1976d2);
    }

    .approval-upload-card mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .stage-icon-manager {
      color: #ff9800;
    }

    .stage-icon-gm {
      color: #9c27b0;
    }

    .upload-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .description-field {
      width: 100%;
    }

    .upload-actions {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .uploading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px;
    }

    .uploading-state p {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
    }
  `]
})
export class ApprovalDocumentUploadComponent {
  @Input() reportId!: string;
  @Input() userRole!: UserRole;
  @Input() approvalStage!: ApprovalStage;
  @Input() canUpload: boolean = false;
  @Output() documentsUploaded = new EventEmitter<void>();

  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  isUploading = signal(false);
  selectedFiles = signal<UploadedFile[]>([]);
  description = '';

  acceptedFileTypes = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.txt';
  maxFileSize = 10 * 1024 * 1024; // 10MB

  onFilesSelected(files: UploadedFile[]): void {
    this.selectedFiles.set(files);
  }

  clearSelection(): void {
    this.selectedFiles.set([]);
    this.description = '';
  }

  async uploadDocuments(): Promise<void> {
    if (!this.canUpload) {
      this.snackBar.open('You are not authorized to upload documents at this stage', 'Close', {
        duration: 3000,
        panelClass: ['error-snackbar']
      });
      return;
    }

    if (this.selectedFiles().length === 0) {
      this.snackBar.open('Please select files to upload', 'Close', { duration: 3000 });
      return;
    }

    this.isUploading.set(true);

    try {
      const formData = new FormData();
      
      // Add files to form data
      this.selectedFiles().forEach(file => {
        if (file.file) {
          formData.append('files', file.file);
        }
      });

      // Add description if provided
      if (this.description.trim()) {
        formData.append('description', this.description.trim());
      }

      const uploadUrl = `${environment.apiUrl}/reports/${this.reportId}/approval-documents`;

      await this.http.post(uploadUrl, formData).toPromise();

      this.snackBar.open(
        `Successfully uploaded ${this.selectedFiles().length} document(s)`,
        'Close',
        { duration: 3000 }
      );

      // Clear the form
      this.clearSelection();

      // Notify parent component
      this.documentsUploaded.emit();

    } catch (error: any) {
      this.snackBar.open(
        `Upload failed: ${error.error?.message || 'Unknown error'}`,
        'Close',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
    } finally {
      this.isUploading.set(false);
    }
  }

  getStageIcon(): string {
    switch (this.approvalStage) {
      case ApprovalStage.ManagerReview:
        return 'supervisor_account';
      case ApprovalStage.GMReview:
        return 'business_center';
      default:
        return 'upload_file';
    }
  }

  getStageIconClass(): string {
    switch (this.approvalStage) {
      case ApprovalStage.ManagerReview:
        return 'stage-icon-manager';
      case ApprovalStage.GMReview:
        return 'stage-icon-gm';
      default:
        return '';
    }
  }

  getStageName(): string {
    switch (this.approvalStage) {
      case ApprovalStage.ManagerReview:
        return 'Manager Review';
      case ApprovalStage.GMReview:
        return 'GM Review';
      default:
        return 'Approval';
    }
  }

  getStageDescription(): string {
    switch (this.approvalStage) {
      case ApprovalStage.ManagerReview:
        return 'Upload supporting documents, analysis, or compliance materials for manager review.';
      case ApprovalStage.GMReview:
        return 'Upload strategic documents, GM summaries, or final materials for GM review.';
      default:
        return 'Upload documents for the approval process.';
    }
  }
}
