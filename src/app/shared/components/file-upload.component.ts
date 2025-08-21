import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpEventType, HttpProgressEvent } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ApprovalStage, UserRole } from '../../core/models/enums';

export interface UploadedFile {
  id?: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
  isUploading?: boolean;
  uploadError?: string;
  file?: File; // Keep reference to original file for form submission
  // Approval stage information
  approvalStage?: ApprovalStage;
  approvalStageName?: string;
  uploadedByRole?: UserRole;
  uploadedByRoleName?: string;
  uploadedByName?: string;
  uploadedDate?: Date;
}

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule
  ],
  template: `
    <div class="file-upload-container">
      <!-- Drag & Drop Zone -->
      <div 
        class="drop-zone"
        [class.drag-over]="isDragOver()"
        [class.disabled]="disabled"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="triggerFileInput()">
        
        <input 
          #fileInput
          type="file"
          class="hidden-file-input"
          [multiple]="allowMultiple"
          [accept]="acceptedTypes"
          [disabled]="disabled"
          (change)="onFilesSelected($event)">

        <div class="drop-zone-content">
          @if (isDragOver()) {
            <mat-icon class="drop-icon">cloud_upload</mat-icon>
            <p class="drop-text">Drop files here</p>
          } @else {
            <mat-icon class="upload-icon">attach_file</mat-icon>
            <p class="upload-text">
              {{ dropText || 'Drag & drop files here or click to browse' }}
            </p>
            <p class="upload-hint">
              {{ acceptedTypesText || 'Supported formats: PDF, Word, Excel, Images' }}
              @if (maxFileSize) {
                <br>Maximum file size: {{ formatFileSize(maxFileSize) }}
              }
            </p>
          }
        </div>
      </div>

      <!-- File List -->
      @if (files().length > 0) {
        <div class="files-list">
          <h4 class="files-header">
            <mat-icon>folder</mat-icon>
            Attached Files ({{ files().length }})
          </h4>
          
          @for (file of files(); track file.name) {
            <div class="file-item" [class.uploading]="file.isUploading" [class.error]="file.uploadError">
              <div class="file-info">
                <mat-icon class="file-type-icon">{{ getFileTypeIcon(file.type) }}</mat-icon>
                <div class="file-details">
                  <span class="file-name" [title]="file.name">{{ file.name }}</span>
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  @if (file.uploadError) {
                    <span class="file-error">
                      <mat-icon>error</mat-icon>
                      {{ file.uploadError }}
                    </span>
                  }
                </div>
              </div>

              <!-- Progress Bar for Uploading Files -->
              @if (file.isUploading && file.uploadProgress !== undefined) {
                <div class="upload-progress">
                  <mat-progress-bar 
                    mode="determinate" 
                    [value]="file.uploadProgress">
                  </mat-progress-bar>
                  <span class="progress-text">{{ file.uploadProgress }}%</span>
                </div>
              }

              <!-- File Actions -->
              <div class="file-actions">
                @if (file.url && !file.isUploading) {
                  <button 
                    mat-icon-button 
                    color="primary"
                    matTooltip="Download"
                    (click)="downloadFile(file)">
                    <mat-icon>download</mat-icon>
                  </button>
                }
                
                @if (file.url && !file.isUploading && canPreview(file.type)) {
                  <button 
                    mat-icon-button 
                    color="accent"
                    matTooltip="Preview"
                    (click)="previewFile(file)">
                    <mat-icon>visibility</mat-icon>
                  </button>
                }

                <button 
                  mat-icon-button 
                  color="warn"
                  matTooltip="Remove"
                  [disabled]="file.isUploading"
                  (click)="removeFile(file)">
                  <mat-icon>delete</mat-icon>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Upload Summary -->
      @if (files().length > 0) {
        <div class="upload-summary">
          <div class="summary-stats">
            <span class="total-files">
              <mat-icon>description</mat-icon>
              {{ files().length }} file{{ files().length !== 1 ? 's' : '' }}
            </span>
            <span class="total-size">
              <mat-icon>storage</mat-icon>
              {{ formatFileSize(getTotalSize()) }}
            </span>
            @if (getUploadingCount() > 0) {
              <span class="uploading-count">
                <mat-icon>cloud_upload</mat-icon>
                {{ getUploadingCount() }} uploading...
              </span>
            }
          </div>
          
          @if (allowMultiple && !disabled) {
            <button 
              mat-stroked-button 
              color="primary"
              (click)="triggerFileInput()">
              <mat-icon>add</mat-icon>
              Add More Files
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .file-upload-container {
      width: 100%;
    }

    .drop-zone {
      border: 2px dashed #ddd;
      border-radius: 8px;
      padding: 32px 16px;
      text-align: center;
      background: #fafafa;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .drop-zone:hover {
      border-color: #2196f3;
      background: #f5f9ff;
    }

    .drop-zone.drag-over {
      border-color: #2196f3;
      background: #e3f2fd;
      border-style: solid;
    }

    .drop-zone.disabled {
      opacity: 0.6;
      cursor: not-allowed;
      background: #f5f5f5;
    }

    .hidden-file-input {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
      z-index: -1;
    }

    .drop-zone-content {
      pointer-events: none;
    }

    .upload-icon,
    .drop-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
      margin-bottom: 8px;
    }

    .drop-icon {
      color: #2196f3;
      animation: bounce 0.5s ease-in-out;
    }

    @keyframes bounce {
      0%, 20%, 60%, 100% { transform: translateY(0); }
      40% { transform: translateY(-10px); }
      80% { transform: translateY(-5px); }
    }

    .upload-text {
      font-size: 1.1rem;
      font-weight: 500;
      margin: 8px 0 4px 0;
      color: #333;
    }

    .drop-text {
      font-size: 1.2rem;
      font-weight: 600;
      margin: 8px 0;
      color: #2196f3;
    }

    .upload-hint {
      font-size: 0.875rem;
      color: #666;
      margin: 0;
    }

    .files-list {
      margin-top: 24px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
    }

    .files-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      font-size: 0.875rem;
      font-weight: 500;
      color: #333;
    }

    .files-header mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .file-item {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #f0f0f0;
      transition: background-color 0.2s ease;
    }

    .file-item:last-child {
      border-bottom: none;
    }

    .file-item:hover {
      background: #f8f9fa;
    }

    .file-item.uploading {
      background: #fff3e0;
    }

    .file-item.error {
      background: #ffebee;
    }

    .file-info {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 12px;
      min-width: 0;
    }

    .file-type-icon {
      color: #666;
      flex-shrink: 0;
    }

    .file-details {
      display: flex;
      flex-direction: column;
      min-width: 0;
      flex: 1;
    }

    .file-name {
      font-weight: 500;
      color: #333;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    .file-size {
      font-size: 0.75rem;
      color: #666;
      margin-top: 2px;
    }

    .file-error {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: #d32f2f;
      margin-top: 2px;
    }

    .file-error mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .upload-progress {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0 16px;
      min-width: 120px;
    }

    .upload-progress mat-progress-bar {
      flex: 1;
    }

    .progress-text {
      font-size: 0.75rem;
      color: #666;
      min-width: 35px;
      text-align: right;
    }

    .file-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .upload-summary {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding: 12px 16px;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .summary-stats {
      display: flex;
      gap: 16px;
      font-size: 0.875rem;
      color: #666;
    }

    .summary-stats > span {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .summary-stats mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .uploading-count {
      color: #ff9800 !important;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .drop-zone {
        padding: 24px 12px;
      }

      .file-item {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .upload-progress {
        margin: 0;
        width: 100%;
      }

      .file-actions {
        align-self: flex-end;
      }

      .upload-summary {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
      }

      .summary-stats {
        justify-content: center;
        flex-wrap: wrap;
      }
    }
  `]
})
export class FileUploadComponent implements OnInit {
  @Input() allowMultiple: boolean = true;
  @Input() maxFileSize: number = 10 * 1024 * 1024; // 10MB default
  @Input() acceptedTypes: string = '.pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif';
  @Input() acceptedTypesText?: string;
  @Input() dropText?: string;
  @Input() disabled: boolean = false;
  @Input() reportId?: string; // For associating files with reports

  @Output() filesChange = new EventEmitter<UploadedFile[]>();
  @Output() fileUploaded = new EventEmitter<UploadedFile>();
  @Output() fileRemoved = new EventEmitter<UploadedFile>();
  @Output() uploadError = new EventEmitter<{file: UploadedFile, error: string}>();

  private http = inject(HttpClient);
  private snackBar = inject(MatSnackBar);

  // Component state
  files = signal<UploadedFile[]>([]);
  isDragOver = signal(false);

  ngOnInit(): void {
    // Initialize component
  }

  // Drag & Drop Handlers
  onDragOver(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    if (this.disabled) return;
    
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const droppedFiles = event.dataTransfer?.files;
    if (droppedFiles) {
      this.handleFiles(Array.from(droppedFiles));
    }
  }

  // File Selection Handler
  onFilesSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    const selectedFiles = target.files;
    if (selectedFiles) {
      this.handleFiles(Array.from(selectedFiles));
      target.value = ''; // Reset input
    }
  }

  triggerFileInput(): void {
    if (this.disabled) return;
    
    const fileInput = document.querySelector('.hidden-file-input') as HTMLInputElement;
    fileInput?.click();
  }

  // File Processing
  private handleFiles(fileList: File[]): void {
    if (!this.allowMultiple && fileList.length > 1) {
      this.snackBar.open(
        'Only one file is allowed',
        'Close',
        { duration: 3000, panelClass: ['warning-snackbar'] }
      );
      fileList = [fileList[0]];
    }

    for (const file of fileList) {
      if (this.validateFile(file)) {
        const uploadFile: UploadedFile = {
          name: file.name,
          size: file.size,
          type: file.type,
          isUploading: true,
          uploadProgress: 0,
          file: file // Store the original file for form submission
        };

        // Add to files list
        const currentFiles = this.files();
        this.files.set([...currentFiles, uploadFile]);
        this.filesChange.emit(this.files());

        // Start upload
        this.uploadFile(file, uploadFile);
      }
    }
  }

  private validateFile(file: File): boolean {
    // Check file size
    if (this.maxFileSize && file.size > this.maxFileSize) {
      this.snackBar.open(
        `File "${file.name}" exceeds maximum size of ${this.formatFileSize(this.maxFileSize)}`,
        'Close',
        { duration: 5000, panelClass: ['error-snackbar'] }
      );
      return false;
    }

    // Check file type
    if (this.acceptedTypes) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      const acceptedExtensions = this.acceptedTypes.toLowerCase().split(',');
      
      if (!acceptedExtensions.includes(fileExtension)) {
        this.snackBar.open(
          `File type "${fileExtension}" is not supported`,
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
        return false;
      }
    }

    return true;
  }

  private uploadFile(file: File, uploadFile: UploadedFile): void {
    const formData = new FormData();
    formData.append('file', file);
    
    if (this.reportId) {
      formData.append('reportId', this.reportId);
    }

    // Mock upload for now - replace with actual API endpoint
    this.simulateUpload(uploadFile);
    
    /* TODO: Replace with actual HTTP upload
    this.http.post('/api/files/upload', formData, {
      reportProgress: true,
      observe: 'events'
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event as HttpProgressEvent;
          if (progress.total) {
            uploadFile.uploadProgress = Math.round((progress.loaded / progress.total) * 100);
            this.updateFile(uploadFile);
          }
        } else if (event.type === HttpEventType.Response) {
          const response = event.body as any;
          uploadFile.id = response.id;
          uploadFile.url = response.url;
          uploadFile.isUploading = false;
          uploadFile.uploadProgress = 100;
          this.updateFile(uploadFile);
          this.fileUploaded.emit(uploadFile);
        }
      },
      error: (error) => {
        uploadFile.isUploading = false;
        uploadFile.uploadError = 'Upload failed';
        this.updateFile(uploadFile);
        this.uploadError.emit({ file: uploadFile, error: error.message });
      }
    });
    */
  }

  // Mock upload simulation for testing
  private simulateUpload(uploadFile: UploadedFile): void {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 25;
      if (progress >= 100) {
        progress = 100;
        uploadFile.uploadProgress = progress;
        uploadFile.isUploading = false;
        uploadFile.id = 'mock-' + Date.now();
        uploadFile.url = 'mock-url';
        clearInterval(interval);
        this.fileUploaded.emit(uploadFile);
      } else {
        uploadFile.uploadProgress = Math.floor(progress);
      }
      this.updateFile(uploadFile);
    }, 200);
  }

  private updateFile(updatedFile: UploadedFile): void {
    const currentFiles = this.files();
    const index = currentFiles.findIndex(f => f.name === updatedFile.name);
    if (index >= 0) {
      currentFiles[index] = updatedFile;
      this.files.set([...currentFiles]);
      this.filesChange.emit(this.files());
    }
  }

  // File Actions
  removeFile(file: UploadedFile): void {
    const currentFiles = this.files();
    const updatedFiles = currentFiles.filter(f => f !== file);
    this.files.set(updatedFiles);
    this.filesChange.emit(updatedFiles);
    this.fileRemoved.emit(file);

    this.snackBar.open(
      'File removed',
      'Close',
      { duration: 2000 }
    );
  }

  downloadFile(file: UploadedFile): void {
    if (file.url) {
      // Mock download - replace with actual implementation
      this.snackBar.open(
        `Downloading ${file.name}...`,
        'Close',
        { duration: 2000 }
      );
      
      // TODO: Implement actual download
      // window.open(file.url, '_blank');
    }
  }

  previewFile(file: UploadedFile): void {
    if (file.url && this.canPreview(file.type)) {
      // Mock preview - replace with actual implementation
      this.snackBar.open(
        `Opening preview for ${file.name}...`,
        'Close',
        { duration: 2000 }
      );
      
      // TODO: Implement actual preview (modal, new tab, etc.)
    }
  }

  // Utility Methods
  canPreview(fileType: string): boolean {
    const previewableTypes = ['image/', 'application/pdf', 'text/'];
    return previewableTypes.some(type => fileType.startsWith(type));
  }

  getFileTypeIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'description';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'table_chart';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'slideshow';
    if (fileType.startsWith('video/')) return 'videocam';
    if (fileType.startsWith('audio/')) return 'audiotrack';
    return 'attach_file';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getTotalSize(): number {
    return this.files().reduce((total, file) => total + file.size, 0);
  }

  getUploadingCount(): number {
    return this.files().filter(file => file.isUploading).length;
  }

  // Public API
  clearFiles(): void {
    this.files.set([]);
    this.filesChange.emit([]);
  }

  getFiles(): UploadedFile[] {
    return this.files();
  }

  setFiles(files: UploadedFile[]): void {
    this.files.set(files);
    this.filesChange.emit(files);
  }
}
