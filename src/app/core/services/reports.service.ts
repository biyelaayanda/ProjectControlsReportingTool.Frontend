import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Department, ReportStatus } from '../models/enums';

export interface Report {
  id: number;
  title: string;
  type: string;
  status: ReportStatus;
  department: Department;
  createdBy: string;
  createdDate: Date;
  dueDate?: Date;
  lastModified: Date;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  content?: any;
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
  getReport(id: number): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new report
   */
  createReport(reportDto: CreateReportDto): Observable<Report> {
    return this.http.post<Report>(this.apiUrl, reportDto);
  }

  /**
   * Update an existing report
   */
  updateReport(id: number, reportDto: UpdateReportDto): Observable<Report> {
    return this.http.put<Report>(`${this.apiUrl}/${id}`, reportDto);
  }

  /**
   * Delete a report
   */
  deleteReport(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Submit a report for review
   */
  submitReport(id: number): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/${id}/submit`, {});
  }

  /**
   * Approve a report (for managers/executives)
   */
  approveReport(id: number, comments?: string): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/${id}/approve`, { comments });
  }

  /**
   * Reject a report (for managers/executives)
   */
  rejectReport(id: number, reason: string): Observable<Report> {
    return this.http.post<Report>(`${this.apiUrl}/${id}/reject`, { reason });
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
   * Get all reports for executives
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
  exportReport(id: number, format: 'pdf' | 'excel' | 'word' = 'pdf'): Observable<Blob> {
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
  removeReportFromCache(reportId: number): void {
    const currentReports = this.reportsSubject.value;
    const filteredReports = currentReports.filter(r => r.id !== reportId);
    this.reportsSubject.next(filteredReports);
  }
}
