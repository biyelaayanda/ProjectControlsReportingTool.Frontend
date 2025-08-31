import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserRole, Department } from '../models/enums';

// Super Admin DTOs and Models
export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: Department;
  temporaryPassword?: string;
  requirePasswordChange?: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: UserRole;
  department?: Department;
  isActive?: boolean;
}

export interface UserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  roleName: string;
  department: Department;
  departmentName: string;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
  createdBy?: number;
  modifiedAt?: Date;
  modifiedBy?: number;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  department?: Department;
  isActive?: boolean;
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface BulkOperationResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  errors: BulkOperationError[];
}

export interface BulkOperationError {
  rowNumber: number;
  email: string;
  error: string;
}

export interface ImportResult {
  totalRows: number;
  processedRows: number;
  successfulRows: number;
  failedRows: number;
  errors: ImportError[];
  preview?: UserDto[];
}

export interface ImportError {
  rowNumber: number;
  field: string;
  value: string;
  error: string;
}

// Audit Report Models
export interface DepartmentReportParams {
  departmentId: number;
  fromDate: Date;
  toDate: Date;
  includeMetrics?: boolean;
  includeUsers?: boolean;
}

export interface UserReportParams {
  userId: number;
  fromDate: Date;
  toDate: Date;
  includeActivity?: boolean;
  includePerformance?: boolean;
}

export interface DepartmentAuditReport {
  department: {
    id: number;
    name: string;
    userCount: number;
  };
  dateRange: {
    fromDate: Date;
    toDate: Date;
  };
  metrics: {
    reportsCreated: number;
    reportsSubmitted: number;
    reportsApproved: number;
    reportsRejected: number;
    averageApprovalTime: number;
    rejectionRate: number;
  };
  users: DepartmentUserSummary[];
  trends: MetricTrend[];
}

export interface DepartmentUserSummary {
  userId: number;
  userName: string;
  role: string;
  reportsCreated: number;
  averageQualityScore: number;
  lastActivity: Date;
}

export interface UserAuditReport {
  user: {
    id: number;
    name: string;
    role: string;
    department: string;
  };
  dateRange: {
    fromDate: Date;
    toDate: Date;
  };
  activity: {
    loginCount: number;
    sessionHours: number;
    lastLogin: Date;
    featureUsage: FeatureUsage[];
  };
  performance: {
    reportsCreated: number;
    reportsSubmitted: number;
    averageQualityScore: number;
    complianceRate: number;
    improvementTrend: number;
  };
}

export interface FeatureUsage {
  feature: string;
  usageCount: number;
  lastUsed: Date;
}

export interface MetricTrend {
  metric: string;
  values: TrendValue[];
}

export interface TrendValue {
  date: Date;
  value: number;
}

export interface SystemHealthReport {
  systemStatus: 'Healthy' | 'Warning' | 'Critical';
  totalUsers: number;
  activeUsers: number;
  systemUptime: number;
  averageResponseTime: number;
  errorRate: number;
  features: FeatureHealth[];
}

export interface FeatureHealth {
  name: string;
  status: 'Healthy' | 'Warning' | 'Critical';
  uptime: number;
  lastError?: Date;
}

export interface AuditTrailFilters {
  userId?: number;
  action?: string;
  fromDate?: Date;
  toDate?: Date;
  pageNumber?: number;
  pageSize?: number;
}

export interface AuditEntry {
  id: string;
  adminUserId: number;
  adminUserName: string;
  targetUserId?: number;
  targetUserName?: string;
  action: string;
  changes?: string;
  reason?: string;
  timestamp: Date;
  ipAddress: string;
}

@Injectable({
  providedIn: 'root'
})
export class SuperAdminService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/superadmin`;
  private readonly auditApiUrl = `${environment.apiUrl}/api/auditreport`;

  // ===== USER MANAGEMENT =====

  /**
   * Create a new user
   */
  createUser(userData: CreateUserRequest): Observable<UserDto> {
    return this.http.post<UserDto>(`${this.apiUrl}/users`, userData);
  }

  /**
   * Get paginated list of users with filtering
   */
  getUsers(filters: UserFilters = {}): Observable<PagedResult<UserDto>> {
    const params = this.buildQueryParams(filters);
    return this.http.get<PagedResult<UserDto>>(`${this.apiUrl}/users`, { params });
  }

  /**
   * Get user by ID
   */
  getUser(userId: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.apiUrl}/users/${userId}`);
  }

  /**
   * Update user information
   */
  updateUser(userId: number, userData: UpdateUserRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.apiUrl}/users/${userId}`, userData);
  }

  /**
   * Delete user (soft delete)
   */
  deleteUser(userId: number, reason?: string): Observable<boolean> {
    const body = reason ? { reason } : {};
    return this.http.delete<boolean>(`${this.apiUrl}/users/${userId}`, { body });
  }

  /**
   * Activate/Deactivate user
   */
  toggleUserStatus(userId: number, isActive: boolean, reason?: string): Observable<UserDto> {
    const body = { isActive, reason };
    return this.http.patch<UserDto>(`${this.apiUrl}/users/${userId}/status`, body);
  }

  /**
   * Reset user password
   */
  resetUserPassword(userId: number, temporaryPassword?: string): Observable<{ temporaryPassword: string }> {
    const body = temporaryPassword ? { temporaryPassword } : {};
    return this.http.post<{ temporaryPassword: string }>(`${this.apiUrl}/users/${userId}/reset-password`, body);
  }

  // ===== BULK OPERATIONS =====

  /**
   * Bulk create users
   */
  bulkCreateUsers(users: CreateUserRequest[]): Observable<BulkOperationResult> {
    return this.http.post<BulkOperationResult>(`${this.apiUrl}/users/bulk`, users);
  }

  /**
   * Bulk update users
   */
  bulkUpdateUsers(updates: { userId: number; data: UpdateUserRequest }[]): Observable<BulkOperationResult> {
    return this.http.put<BulkOperationResult>(`${this.apiUrl}/users/bulk`, updates);
  }

  /**
   * Bulk delete users
   */
  bulkDeleteUsers(userIds: number[], reason?: string): Observable<BulkOperationResult> {
    const body = { userIds, reason };
    return this.http.delete<BulkOperationResult>(`${this.apiUrl}/users/bulk`, { body });
  }

  /**
   * Import users from file
   */
  importUsers(file: File, validateOnly: boolean = false): Observable<ImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('validateOnly', validateOnly.toString());
    return this.http.post<ImportResult>(`${this.apiUrl}/users/import`, formData);
  }

  /**
   * Export users to CSV
   */
  exportUsers(filters: UserFilters = {}): Observable<Blob> {
    const params = this.buildQueryParams(filters);
    return this.http.get(`${this.apiUrl}/users/export`, { 
      params, 
      responseType: 'blob' 
    });
  }

  // ===== AUDIT REPORTS =====

  /**
   * Generate department audit report
   */
  generateDepartmentReport(params: DepartmentReportParams): Observable<DepartmentAuditReport> {
    const queryParams = this.buildReportParams(params);
    return this.http.get<DepartmentAuditReport>(
      `${this.auditApiUrl}/department/${params.departmentId}`,
      { params: queryParams }
    );
  }

  /**
   * Generate user audit report
   */
  generateUserReport(params: UserReportParams): Observable<UserAuditReport> {
    const queryParams = this.buildReportParams(params);
    return this.http.get<UserAuditReport>(
      `${this.auditApiUrl}/user/${params.userId}`,
      { params: queryParams }
    );
  }

  /**
   * Generate system-wide audit report
   */
  generateSystemReport(fromDate: Date, toDate: Date): Observable<any> {
    const params = new HttpParams()
      .set('fromDate', fromDate.toISOString())
      .set('toDate', toDate.toISOString());
    
    return this.http.get(`${this.auditApiUrl}/system`, { params });
  }

  /**
   * Export audit report
   */
  exportAuditReport(reportType: 'department' | 'user' | 'system', reportParams: any, format: 'pdf' | 'excel'): Observable<Blob> {
    const params = this.buildReportParams(reportParams);
    params.append('format', format);
    
    return this.http.get(`${this.auditApiUrl}/${reportType}/export`, {
      params,
      responseType: 'blob'
    });
  }

  // ===== SYSTEM ADMINISTRATION =====

  /**
   * Get system health status
   */
  getSystemHealth(): Observable<SystemHealthReport> {
    return this.http.get<SystemHealthReport>(`${this.apiUrl}/system/health`);
  }

  /**
   * Get audit trail
   */
  getAuditTrail(filters: AuditTrailFilters = {}): Observable<PagedResult<AuditEntry>> {
    const params = this.buildQueryParams(filters);
    return this.http.get<PagedResult<AuditEntry>>(`${this.apiUrl}/audit`, { params });
  }

  /**
   * Get user statistics
   */
  getUserStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/statistics/users`);
  }

  /**
   * Get system configuration
   */
  getSystemConfiguration(): Observable<any> {
    return this.http.get(`${this.apiUrl}/system/configuration`);
  }

  /**
   * Update system configuration
   */
  updateSystemConfiguration(config: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/system/configuration`, config);
  }

  // ===== HELPER METHODS =====

  /**
   * Build query parameters from filters
   */
  private buildQueryParams(filters: any): HttpParams {
    let params = new HttpParams();
    
    Object.keys(filters).forEach(key => {
      const value = filters[key];
      if (value !== null && value !== undefined && value !== '') {
        if (value instanceof Date) {
          params = params.set(key, value.toISOString());
        } else {
          params = params.set(key, value.toString());
        }
      }
    });
    
    return params;
  }

  /**
   * Build report parameters
   */
  private buildReportParams(reportParams: any): HttpParams {
    let params = new HttpParams();
    
    if (reportParams.fromDate) {
      params = params.set('fromDate', reportParams.fromDate.toISOString());
    }
    if (reportParams.toDate) {
      params = params.set('toDate', reportParams.toDate.toISOString());
    }
    
    // Add other parameters
    Object.keys(reportParams).forEach(key => {
      if (key !== 'fromDate' && key !== 'toDate') {
        const value = reportParams[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, value.toString());
        }
      }
    });
    
    return params;
  }

  /**
   * Download file helper
   */
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }
}
