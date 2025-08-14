import { Component, Input, Output, EventEmitter, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { UploadedFile } from './file-upload.component';

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatSnackBarModule,
    MatProgressBarModule
  ],
  template: `
    <div class="file-list-container" *ngIf="files.length > 0">
      <!-- Header -->
      <div class="list-header">
        <div class="header-info">
          <mat-icon>folder_open</mat-icon>
          <span class="files-count">{{ files.length }} file{{ files.length !== 1 ? 's' : '' }}</span>
          <span class="total-size">{{ formatFileSize(getTotalSize()) }}</span>
        </div>
        
        <div class="header-actions" *ngIf="showActions">
          <button 
            mat-icon-button 
            [matMenuTriggerFor]="bulkMenu"
            matTooltip="Bulk Actions"
            [disabled]="files.length === 0">
            <mat-icon>more_vert</mat-icon>
          </button>
          
          <mat-menu #bulkMenu="matMenu">
            <button mat-menu-item (click)="downloadAll()" [disabled]="!hasDownloadableFiles()">
              <mat-icon>download</mat-icon>
              Download All
            </button>
            <button mat-menu-item (click)="removeAll()" [disabled]="files.length === 0">
              <mat-icon>delete</mat-icon>
              Remove All
            </button>
          </mat-menu>
        </div>
      </div>

      <!-- File Items -->
      <div class="files-container">
        @for (file of files; track file.name) {
          <div class="file-item" 
               [class.uploading]="file.isUploading"
               [class.error]="file.uploadError"
               [class.preview-available]="canPreview(file.type)">
            
            <!-- File Icon & Info -->
            <div class="file-main-info">
              <div class="file-icon-container">
                <mat-icon 
                  class="file-icon"
                  [class]="getFileIconClass(file.type)">
                  {{ getFileTypeIcon(file.type) }}
                </mat-icon>
                
                @if (file.isUploading) {
                  <div class="upload-overlay">
                    <mat-icon class="upload-icon">cloud_upload</mat-icon>
                  </div>
                }
              </div>

              <div class="file-details">
                <div class="file-name" [title]="file.name">
                  {{ file.name }}
                </div>
                
                <div class="file-metadata">
                  <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  
                  @if (file.isUploading && file.uploadProgress !== undefined) {
                    <span class="upload-status">
                      <mat-icon>cloud_upload</mat-icon>
                      Uploading {{ file.uploadProgress }}%
                    </span>
                  } @else if (file.uploadError) {
                    <span class="error-status">
                      <mat-icon>error</mat-icon>
                      {{ file.uploadError }}
                    </span>
                  } @else if (file.url) {
                    <span class="success-status">
                      <mat-icon>check_circle</mat-icon>
                      Uploaded
                    </span>
                  }
                </div>

                <!-- Progress Bar for Uploading Files -->
                @if (file.isUploading && file.uploadProgress !== undefined) {
                  <div class="progress-container">
                    <mat-progress-bar 
                      mode="determinate" 
                      [value]="file.uploadProgress"
                      [color]="file.uploadProgress === 100 ? 'accent' : 'primary'">
                    </mat-progress-bar>
                  </div>
                }
              </div>
            </div>

            <!-- File Actions -->
            <div class="file-actions" *ngIf="showActions">
              <!-- Preview Button -->
              @if (canPreview(file.type) && file.url && !file.isUploading) {
                <button 
                  mat-icon-button 
                  color="accent"
                  matTooltip="Preview"
                  (click)="previewFile(file)">
                  <mat-icon>visibility</mat-icon>
                </button>
              }

              <!-- Download Button -->
              @if (file.url && !file.isUploading) {
                <button 
                  mat-icon-button 
                  color="primary"
                  matTooltip="Download"
                  (click)="downloadFile(file)">
                  <mat-icon>download</mat-icon>
                </button>
              }

              <!-- More Options -->
              <button 
                mat-icon-button 
                [matMenuTriggerFor]="fileMenu"
                matTooltip="More Options">
                <mat-icon>more_vert</mat-icon>
              </button>

              <mat-menu #fileMenu="matMenu">
                @if (file.url && !file.isUploading) {
                  <button mat-menu-item (click)="copyFileLink(file)">
                    <mat-icon>link</mat-icon>
                    Copy Link
                  </button>
                }
                
                @if (file.url && !file.isUploading) {
                  <button mat-menu-item (click)="showFileInfo(file)">
                    <mat-icon>info</mat-icon>
                    File Info
                  </button>
                }
                
                <button 
                  mat-menu-item 
                  (click)="removeFile(file)"
                  [disabled]="file.isUploading"
                  class="delete-action">
                  <mat-icon>delete</mat-icon>
                  Remove
                </button>
              </mat-menu>
            </div>
          </div>
        }
      </div>

      <!-- Summary Footer -->
      @if (showSummary) {
        <div class="list-footer">
          <div class="summary-stats">
            @if (getUploadingCount() > 0) {
              <mat-chip class="uploading-chip">
                <mat-icon>cloud_upload</mat-icon>
                {{ getUploadingCount() }} uploading
              </mat-chip>
            }
            
            @if (getErrorCount() > 0) {
              <mat-chip class="error-chip">
                <mat-icon>error</mat-icon>
                {{ getErrorCount() }} failed
              </mat-chip>
            }
            
            @if (getSuccessCount() > 0) {
              <mat-chip class="success-chip">
                <mat-icon>check_circle</mat-icon>
                {{ getSuccessCount() }} uploaded
              </mat-chip>
            }
          </div>
        </div>
      }
    </div>

    <!-- Empty State -->
    @if (files.length === 0 && showEmptyState) {
      <div class="empty-state">
        <mat-icon class="empty-icon">folder_open</mat-icon>
        <p class="empty-text">No files attached</p>
        <p class="empty-hint">Files will appear here when uploaded</p>
      </div>
    }
  `,
  styles: [`
    .file-list-container {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      overflow: hidden;
      background: white;
    }

    .list-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
    }

    .header-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.875rem;
      color: #333;
    }

    .header-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: #666;
    }

    .files-count {
      font-weight: 500;
    }

    .total-size {
      color: #666;
      margin-left: 8px;
    }

    .files-container {
      max-height: 400px;
      overflow-y: auto;
    }

    .file-item {
      display: flex;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      transition: all 0.2s ease;
      position: relative;
    }

    .file-item:last-child {
      border-bottom: none;
    }

    .file-item:hover {
      background: #f8f9fa;
    }

    .file-item.uploading {
      background: linear-gradient(to right, #fff3e0 0%, #ffffff 100%);
    }

    .file-item.error {
      background: linear-gradient(to right, #ffebee 0%, #ffffff 100%);
    }

    .file-item.preview-available {
      cursor: pointer;
    }

    .file-main-info {
      display: flex;
      align-items: center;
      flex: 1;
      gap: 12px;
      min-width: 0;
    }

    .file-icon-container {
      position: relative;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .file-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .file-icon.pdf-icon { color: #d32f2f; }
    .file-icon.image-icon { color: #7b1fa2; }
    .file-icon.document-icon { color: #1976d2; }
    .file-icon.spreadsheet-icon { color: #388e3c; }
    .file-icon.presentation-icon { color: #f57c00; }
    .file-icon.video-icon { color: #5d4037; }
    .file-icon.audio-icon { color: #e91e63; }
    .file-icon.default-icon { color: #666; }

    .upload-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(33, 150, 243, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
    }

    .upload-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #2196f3;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    .file-details {
      flex: 1;
      min-width: 0;
    }

    .file-name {
      font-weight: 500;
      color: #333;
      font-size: 0.875rem;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
      margin-bottom: 4px;
    }

    .file-metadata {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 0.75rem;
    }

    .file-size {
      color: #666;
    }

    .upload-status {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #ff9800;
    }

    .error-status {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #d32f2f;
    }

    .success-status {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #388e3c;
    }

    .upload-status mat-icon,
    .error-status mat-icon,
    .success-status mat-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .progress-container {
      margin-top: 8px;
      width: 100%;
    }

    .file-actions {
      display: flex;
      gap: 4px;
      flex-shrink: 0;
    }

    .delete-action {
      color: #d32f2f;
    }

    .list-footer {
      padding: 12px 16px;
      background: #f8f9fa;
      border-top: 1px solid #e0e0e0;
    }

    .summary-stats {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .uploading-chip {
      background-color: #fff3e0;
      color: #ef6c00;
    }

    .error-chip {
      background-color: #ffebee;
      color: #c62828;
    }

    .success-chip {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .uploading-chip mat-icon,
    .error-chip mat-icon,
    .success-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #666;
    }

    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #ddd;
      margin-bottom: 16px;
    }

    .empty-text {
      font-size: 1.1rem;
      font-weight: 500;
      margin: 8px 0 4px 0;
      color: #333;
    }

    .empty-hint {
      font-size: 0.875rem;
      margin: 0;
      color: #999;
    }

    /* Mobile Responsive */
    @media (max-width: 768px) {
      .file-item {
        padding: 12px;
      }

      .file-main-info {
        gap: 8px;
      }

      .file-icon-container {
        width: 32px;
        height: 32px;
      }

      .file-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      .file-name {
        font-size: 0.8rem;
      }

      .file-metadata {
        gap: 8px;
        font-size: 0.7rem;
      }

      .summary-stats {
        justify-content: center;
      }
    }
  `]
})
export class FileListComponent implements OnInit {
  @Input() files: UploadedFile[] = [];
  @Input() showActions: boolean = true;
  @Input() showSummary: boolean = true;
  @Input() showEmptyState: boolean = true;
  @Input() maxDisplayHeight: string = '400px';

  @Output() filePreview = new EventEmitter<UploadedFile>();
  @Output() fileDownload = new EventEmitter<UploadedFile>();
  @Output() fileRemove = new EventEmitter<UploadedFile>();
  @Output() filesRemoveAll = new EventEmitter<void>();
  @Output() filesDownloadAll = new EventEmitter<UploadedFile[]>();

  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    // Component initialization
  }

  // File Actions
  previewFile(file: UploadedFile): void {
    this.filePreview.emit(file);
  }

  downloadFile(file: UploadedFile): void {
    this.fileDownload.emit(file);
  }

  removeFile(file: UploadedFile): void {
    this.fileRemove.emit(file);
  }

  removeAll(): void {
    this.filesRemoveAll.emit();
  }

  downloadAll(): void {
    const downloadableFiles = this.files.filter(f => f.url && !f.isUploading);
    if (downloadableFiles.length > 0) {
      this.filesDownloadAll.emit(downloadableFiles);
    }
  }

  copyFileLink(file: UploadedFile): void {
    if (file.url) {
      navigator.clipboard.writeText(file.url).then(() => {
        this.snackBar.open(
          'File link copied to clipboard',
          'Close',
          { duration: 2000 }
        );
      }).catch(() => {
        this.snackBar.open(
          'Failed to copy link',
          'Close',
          { duration: 3000, panelClass: ['error-snackbar'] }
        );
      });
    }
  }

  showFileInfo(file: UploadedFile): void {
    const info = [
      `Name: ${file.name}`,
      `Size: ${this.formatFileSize(file.size)}`,
      `Type: ${file.type || 'Unknown'}`,
      file.id ? `ID: ${file.id}` : '',
    ].filter(Boolean).join('\n');

    this.snackBar.open(
      info,
      'Close',
      { 
        duration: 5000,
        panelClass: ['info-snackbar']
      }
    );
  }

  // Utility Methods
  canPreview(fileType: string): boolean {
    if (!fileType) return false;
    const previewableTypes = ['image/', 'application/pdf', 'text/'];
    return previewableTypes.some(type => fileType.startsWith(type));
  }

  getFileTypeIcon(fileType: string): string {
    if (!fileType) return 'insert_drive_file'; // Default icon for unknown types
    if (fileType.startsWith('image/')) return 'image';
    if (fileType.includes('pdf')) return 'picture_as_pdf';
    if (fileType.includes('word') || fileType.includes('document')) return 'description';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'table_chart';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'slideshow';
    if (fileType.startsWith('video/')) return 'videocam';
    if (fileType.startsWith('audio/')) return 'audiotrack';
    return 'attach_file';
  }

  getFileIconClass(fileType: string): string {
    if (!fileType) return 'default-icon';
    if (fileType.includes('pdf')) return 'pdf-icon';
    if (fileType.startsWith('image/')) return 'image-icon';
    if (fileType.includes('word') || fileType.includes('document')) return 'document-icon';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'spreadsheet-icon';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'presentation-icon';
    if (fileType.startsWith('video/')) return 'video-icon';
    if (fileType.startsWith('audio/')) return 'audio-icon';
    return 'default-icon';
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getTotalSize(): number {
    return this.files.reduce((total, file) => total + file.size, 0);
  }

  getUploadingCount(): number {
    return this.files.filter(file => file.isUploading).length;
  }

  getErrorCount(): number {
    return this.files.filter(file => file.uploadError).length;
  }

  getSuccessCount(): number {
    return this.files.filter(file => file.url && !file.isUploading && !file.uploadError).length;
  }

  hasDownloadableFiles(): boolean {
    return this.files.some(file => file.url && !file.isUploading);
  }
}
