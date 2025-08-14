import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEventType, HttpProgressEvent, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { UploadedFile } from '../../shared/components/file-upload.component';

export interface FileUploadResponse {
  id: string;
  fileName: string;
  originalName: string;
  size: number;
  mimeType: string;
  url: string;
  downloadUrl: string;
  uploadDate: string;
  reportId?: string;
}

export interface FileUploadProgress {
  file: UploadedFile;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/files`;

  // Upload progress tracking
  private uploadProgress$ = new BehaviorSubject<FileUploadProgress[]>([]);
  
  constructor() {}

  /**
   * Upload a single file
   */
  uploadFile(file: File, reportId?: string): Observable<FileUploadProgress> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (reportId) {
      formData.append('reportId', reportId);
    }

    const uploadFile: UploadedFile = {
      name: file.name,
      size: file.size,
      type: file.type,
      isUploading: true,
      uploadProgress: 0
    };

    return this.http.post<FileUploadResponse>(`${this.baseUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events'
    }).pipe(
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event as HttpProgressEvent;
          const percentage = progress.total ? Math.round((progress.loaded / progress.total) * 100) : 0;
          
          return {
            file: { ...uploadFile, uploadProgress: percentage },
            progress: percentage,
            status: 'uploading' as const
          };
        } else if (event.type === HttpEventType.Response) {
          const response = event as HttpResponse<FileUploadResponse>;
          const responseData = response.body!;
          
          return {
            file: {
              ...uploadFile,
              id: responseData.id,
              url: responseData.url,
              isUploading: false,
              uploadProgress: 100
            },
            progress: 100,
            status: 'success' as const
          };
        }
        
        return {
          file: uploadFile,
          progress: 0,
          status: 'uploading' as const
        };
      }),
      catchError(error => {
        throw {
          file: { ...uploadFile, isUploading: false, uploadError: 'Upload failed' },
          progress: 0,
          status: 'error' as const,
          error: error.message || 'Upload failed'
        };
      })
    );
  }

  /**
   * Upload multiple files
   */
  uploadMultipleFiles(files: File[], reportId?: string): Observable<FileUploadProgress[]> {
    const uploads = files.map(file => this.uploadFile(file, reportId));
    
    return new Observable(observer => {
      const results: FileUploadProgress[] = [];
      let completed = 0;

      uploads.forEach((upload, index) => {
        upload.subscribe({
          next: (progress) => {
            results[index] = progress;
            observer.next([...results]);
          },
          error: (error) => {
            results[index] = error;
            completed++;
            if (completed === files.length) {
              observer.complete();
            }
          },
          complete: () => {
            completed++;
            if (completed === files.length) {
              observer.complete();
            }
          }
        });
      });
    });
  }

  /**
   * Get files for a specific report
   */
  getReportFiles(reportId: string): Observable<UploadedFile[]> {
    return this.http.get<FileUploadResponse[]>(`${this.baseUrl}/report/${reportId}`)
      .pipe(
        map(files => files.map(this.mapToUploadedFile)),
        catchError(error => {
          console.error('Error fetching report files:', error);
          throw error;
        })
      );
  }

  /**
   * Download a file
   */
  downloadFile(fileId: string, fileName?: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/download/${fileId}`, {
      responseType: 'blob'
    }).pipe(
      map(blob => {
        // Trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return blob;
      }),
      catchError(error => {
        console.error('Error downloading file:', error);
        throw error;
      })
    );
  }

  /**
   * Delete a file
   */
  deleteFile(fileId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${fileId}`)
      .pipe(
        catchError(error => {
          console.error('Error deleting file:', error);
          throw error;
        })
      );
  }

  /**
   * Get file preview URL (for images, PDFs, etc.)
   */
  getPreviewUrl(fileId: string): string {
    return `${this.baseUrl}/preview/${fileId}`;
  }

  /**
   * Get file info
   */
  getFileInfo(fileId: string): Observable<FileUploadResponse> {
    return this.http.get<FileUploadResponse>(`${this.baseUrl}/${fileId}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching file info:', error);
          throw error;
        })
      );
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, options?: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  }): { isValid: boolean; error?: string } {
    const defaultOptions = {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain', 'text/csv'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv']
    };

    const opts = { ...defaultOptions, ...options };

    // Check file size
    if (opts.maxSize && file.size > opts.maxSize) {
      return {
        isValid: false,
        error: `File size exceeds maximum allowed size of ${this.formatFileSize(opts.maxSize)}`
      };
    }

    // Check file type
    if (opts.allowedTypes && !opts.allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type "${file.type}" is not allowed`
      };
    }

    // Check file extension
    if (opts.allowedExtensions) {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!opts.allowedExtensions.includes(extension)) {
        return {
          isValid: false,
          error: `File extension "${extension}" is not allowed`
        };
      }
    }

    return { isValid: true };
  }

  /**
   * Get supported file types for display
   */
  getSupportedFileTypes(): { [key: string]: string[] } {
    return {
      'Images': ['JPG', 'PNG', 'GIF', 'WebP'],
      'Documents': ['PDF', 'DOC', 'DOCX'],
      'Spreadsheets': ['XLS', 'XLSX', 'CSV'],
      'Text Files': ['TXT', 'CSV']
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get file type category
   */
  getFileCategory(mimeType: string): string {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'spreadsheet';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'presentation';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('text/')) return 'text';
    return 'other';
  }

  /**
   * Check if file can be previewed
   */
  canPreview(mimeType: string): boolean {
    const previewableTypes = [
      'image/', 'application/pdf', 'text/'
    ];
    return previewableTypes.some(type => mimeType.startsWith(type));
  }

  /**
   * Get current upload progress
   */
  getUploadProgress(): Observable<FileUploadProgress[]> {
    return this.uploadProgress$.asObservable();
  }

  /**
   * Clear upload progress
   */
  clearUploadProgress(): void {
    this.uploadProgress$.next([]);
  }

  /**
   * Mock API endpoints for development
   */
  private getMockFiles(reportId: string): UploadedFile[] {
    // This would be replaced with actual API calls
    return [
      {
        id: 'mock-1',
        name: 'Project_Requirements.pdf',
        size: 2456789,
        type: 'application/pdf',
        url: 'mock-url-1'
      },
      {
        id: 'mock-2',
        name: 'Budget_Analysis.xlsx',
        size: 1234567,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        url: 'mock-url-2'
      }
    ];
  }

  /**
   * Map API response to UploadedFile interface
   */
  private mapToUploadedFile(apiFile: FileUploadResponse): UploadedFile {
    return {
      id: apiFile.id,
      name: apiFile.originalName || apiFile.fileName,
      size: apiFile.size,
      type: apiFile.mimeType,
      url: apiFile.url
    };
  }

  /**
   * Simulate file upload for development/testing
   */
  simulateUpload(file: File, reportId?: string): Observable<FileUploadProgress> {
    return new Observable(observer => {
      const uploadFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        isUploading: true,
        uploadProgress: 0
      };

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 25;
        
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          observer.next({
            file: {
              ...uploadFile,
              id: 'mock-' + Date.now(),
              url: 'mock-url',
              isUploading: false,
              uploadProgress: 100
            },
            progress: 100,
            status: 'success'
          });
          
          observer.complete();
        } else {
          observer.next({
            file: {
              ...uploadFile,
              uploadProgress: Math.floor(progress)
            },
            progress: Math.floor(progress),
            status: 'uploading'
          });
        }
      }, 200);
    });
  }
}
