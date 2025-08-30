import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Department, ReportStatus, ApprovalStage, UserRole } from '../models/enums';

export interface Report {
  id: string;
  title: string;
  type: string;
  status: ReportStatus;
  department: Department;
  creatorName: string;
  creatorRole: number; // UserRole enum value
  createdDate: Date;
  dueDate?: Date;
  lastModified: Date;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  content?: any;
  attachments?: AttachmentInfo[];
  
  // Additional workflow and audit properties
  reportNumber?: string;
  submittedDate?: Date;
  managerApprovedDate?: Date;
  gmApprovedDate?: Date;
  completedDate?: Date;
  rejectedDate?: Date;
  rejectionReason?: string;
  rejectedBy?: string;
  
  // Computed properties for display
  statusName?: string;
  departmentName?: string;
}

export interface AttachmentInfo {
  id: string;
  fileName: string;
  originalFileName: string;
  fileSize: number;
  mimeType: string;
  uploadedDate: Date;
  uploadedBy: string;
  uploadedByName: string;
  approvalStage: ApprovalStage;
  approvalStageName: string;
  uploadedByRole: UserRole;
  uploadedByRoleName: string;
  isActive: boolean;
}

export interface ReportFilter {
  search?: string;
  status?: ReportStatus;
  department?: Department;
  type?: string;
  createdBy?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export interface CreateReportDto {
  title: string;
  content: string;
  description?: string;
  type?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: Date;
  department: Department;
  // File attachments are now supported by the backend!
  attachments?: File[];
}

export interface UpdateReportDto {
  title?: string;
  type?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  dueDate?: Date;
  content?: any;
}

export interface ReportApprovalDto {
  comments?: string;
}

export interface ReportRejectionDto {
  reason: string;
}

export interface UpdateReportStatusDto {
  status: ReportStatus;
  comments?: string;
}

export interface WorkflowResult {
  success: boolean;
  errorMessage?: string;
  report?: Report;
}

export interface ReportsResponse {
  reports: Report[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/reports`;

  // For caching and real-time updates
  private reportsSubject = new BehaviorSubject<Report[]>([]);
  public reports$ = this.reportsSubject.asObservable();

  /**
   * Get reports with optional filtering
   */
  getReports(filter?: ReportFilter): Observable<ReportsResponse> {
    let params = new HttpParams();

    if (filter) {
      if (filter.search) params = params.set('search', filter.search);
      if (filter.status !== undefined) params = params.set('status', filter.status.toString());
      if (filter.department !== undefined) params = params.set('department', filter.department.toString());
      if (filter.type) params = params.set('type', filter.type);
      if (filter.createdBy) params = params.set('createdBy', filter.createdBy);
      if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom.toISOString());
      if (filter.dateTo) params = params.set('dateTo', filter.dateTo.toISOString());
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    }

    return this.http.get<ReportsResponse>(this.apiUrl, { params });
  }

  /**
   * Get a specific report by ID
   */
  getReport(id: string): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new report
   */
  createReport(reportDto: CreateReportDto): Observable<Report> {
    // If there are attachments, use FormData for multipart/form-data
    if (reportDto.attachments && reportDto.attachments.length > 0) {
      const formData = new FormData();
      
      // Add report data (excluding attachments)
      const reportData = { ...reportDto };
      delete reportData.attachments;
      
      // Add each field separately to FormData
      formData.append('title', reportData.title);
      formData.append('content', reportData.content);
      formData.append('priority', reportData.priority);
      formData.append('department', (reportData.department || Department.ProjectSupport).toString());
      
      if (reportData.description) {
        formData.append('description', reportData.description);
      }
      if (reportData.type) {
        formData.append('type', reportData.type);
      }
      if (reportData.dueDate) {
        formData.append('dueDate', reportData.dueDate.toISOString());
      }
      
      // Add each file with the key 'attachments'
      reportDto.attachments.forEach((file) => {
        formData.append('attachments', file, file.name);
      });
      
      return this.http.post<Report>(this.apiUrl, formData);
    } else {
      // No attachments, use regular JSON POST
      const reportData = { ...reportDto };
      delete reportData.attachments;
      return this.http.post<Report>(this.apiUrl, reportData);
    }
  }

  /**
   * Update an existing report
   */
  updateReport(id: string, reportDto: UpdateReportDto): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}`, reportDto);
  }

  /**
   * Delete a report
   */
  deleteReport(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Submit a report for review
   */
  submitReport(id: string, comments?: string): Observable<Report> {
    const submitDto = { comments: comments || '' };
    const url = `${this.apiUrl}/${id}/submit`;
    console.log('Submitting report to URL:', url);
    console.log('Submit DTO:', submitDto);
    return this.http.post<Report>(url, submitDto);
  }

  /**
   * Approve a report (for managers/GMs)
   */
  approveReport(id: string, comments?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/approve`, { comments });
  }

  /**
   * Reject a report (for managers/GMs)
   */
  rejectReport(id: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  /**
   * Get reports for current user
   */
  getMyReports(limit?: number): Observable<Report[]> {
    let params = new HttpParams();
    if (limit) params = params.set('limit', limit.toString());
    
    return this.http.get<Report[]>(`${this.apiUrl}/my-reports`, { params });
  }

  /**
   * Get team reports for line managers
   */
  getTeamReports(filter?: ReportFilter): Observable<ReportsResponse> {
    let params = new HttpParams();

    if (filter) {
      if (filter.search) params = params.set('search', filter.search);
      if (filter.status !== undefined) params = params.set('status', filter.status.toString());
      if (filter.type) params = params.set('type', filter.type);
      if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom.toISOString());
      if (filter.dateTo) params = params.set('dateTo', filter.dateTo.toISOString());
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    }

    return this.http.get<ReportsResponse>(`${this.apiUrl}/team-reports`, { params });
  }

  /**
   * Get all reports for GMs
   */
  getAllReports(filter?: ReportFilter): Observable<ReportsResponse> {
    let params = new HttpParams();

    if (filter) {
      if (filter.search) params = params.set('search', filter.search);
      if (filter.status !== undefined) params = params.set('status', filter.status.toString());
      if (filter.department !== undefined) params = params.set('department', filter.department.toString());
      if (filter.type) params = params.set('type', filter.type);
      if (filter.createdBy) params = params.set('createdBy', filter.createdBy);
      if (filter.dateFrom) params = params.set('dateFrom', filter.dateFrom.toISOString());
      if (filter.dateTo) params = params.set('dateTo', filter.dateTo.toISOString());
      if (filter.page) params = params.set('page', filter.page.toString());
      if (filter.pageSize) params = params.set('pageSize', filter.pageSize.toString());
    }

    return this.http.get<ReportsResponse>(`${this.apiUrl}/all-reports`, { params });
  }

  /**
   * Get reports pending review for current user
   */
  getPendingReviews(): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/pending-reviews`);
  }

  /**
   * Export report to various formats
   */
  exportReport(id: string, format: 'pdf' | 'excel' | 'word' = 'pdf'): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/export`, {
      params: { format },
      responseType: 'blob'
    });
  }

  /**
   * Get report statistics for dashboard
   */
  getReportStats(): Observable<{
    totalReports: number;
    myReports: number;
    pendingReviews: number;
    draftReports: number;
    publishedReports: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  /**
   * Get available report types
   */
  getReportTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/types`);
  }

  /**
   * Update the local reports cache
   */
  updateReportsCache(reports: Report[]): void {
    this.reportsSubject.next(reports);
  }

  /**
   * Add a report to the local cache
   */
  addReportToCache(report: Report): void {
    const currentReports = this.reportsSubject.value;
    this.reportsSubject.next([report, ...currentReports]);
  }

  /**
   * Update a report in the local cache
   */
  updateReportInCache(updatedReport: Report): void {
    const currentReports = this.reportsSubject.value;
    const index = currentReports.findIndex(r => r.id === updatedReport.id);
    if (index !== -1) {
      currentReports[index] = updatedReport;
      this.reportsSubject.next([...currentReports]);
    }
  }

  /**
   * Remove a report from the local cache
   */
  removeReportFromCache(reportId: string): void {
    const currentReports = this.reportsSubject.value;
    const filteredReports = currentReports.filter(r => r.id !== reportId);
    this.reportsSubject.next(filteredReports);
  }

  // Attachment Management Methods
  
  /**
   * Download a report attachment
   */
  downloadAttachment(reportId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportId}/attachments/${attachmentId}/download`, { 
      responseType: 'blob' 
    });
  }

  /**
   * Preview a report attachment
   */
  previewAttachment(reportId: string, attachmentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${reportId}/attachments/${attachmentId}/preview`, { 
      responseType: 'blob' 
    });
  }

  // Approval Document Management Methods

  /**
   * Upload documents during approval process
   */
  uploadApprovalDocuments(reportId: string, files: File[], description: string = ''): Observable<any> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`files`, file);
    });
    if (description) {
      formData.append('description', description);
    }

    return this.http.post(`${this.apiUrl}/${reportId}/approval-documents`, formData).pipe(
      tap(() => this.refreshReports())
    );
  }

  /**
   * Get report attachments by approval stage
   */
  getReportAttachmentsByStage(reportId: string, stage: ApprovalStage): Observable<AttachmentInfo[]> {
    const params = new HttpParams().set('stage', stage.toString());
    return this.http.get<AttachmentInfo[]>(`${this.apiUrl}/${reportId}/attachments/by-stage`, { params });
  }

  /**
   * Get all report attachments organized by approval stages
   */
  getAllReportAttachmentsByStages(reportId: string): Observable<{ [key in ApprovalStage]: AttachmentInfo[] }> {
    return this.http.get<{ [key in ApprovalStage]: AttachmentInfo[] }>(`${this.apiUrl}/${reportId}/attachments/by-stages`);
  }

  /**
   * Refresh the reports cache
   */
  private refreshReports(): void {
    this.getReports().subscribe(reports => {
      this.reportsSubject.next(reports.reports);
    });
  }
}
