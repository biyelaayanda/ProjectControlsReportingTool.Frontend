import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: number;
  roleName: string;
  department: number;
  departmentName: string;
  isActive: boolean;
  createdDate: Date;
  lastLoginDate: Date;
  phoneNumber?: string;
  jobTitle?: string;
}

export interface UserFilterDto {
  searchTerm?: string;
  role?: number;
  department?: number;
  isActive?: boolean;
  pageNumber: number;
  pageSize: number;
  sortBy?: string;
  sortDescending?: boolean;
}

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface AdminUserUpdateDto {
  firstName: string;
  lastName: string;
  role: number;
  department: number;
  phoneNumber?: string;
  jobTitle?: string;
  isActive: boolean;
}

export interface BulkOperationResultDto {
  successCount: number;
  failureCount: number;
  errors: string[];
  affectedUserIds: string[];
}

export interface BulkRoleAssignmentDto {
  userIds: string[];
  role: number;
}

export interface BulkDepartmentChangeDto {
  userIds: string[];
  department: number;
}

export interface BulkActivationDto {
  userIds: string[];
  isActive: boolean;
}

export interface UserAnalyticsDto {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersByRole: { [key: string]: number };
  usersByDepartment: { [key: string]: number };
  recentLogins: number;
  newUsersThisMonth: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/api/user`;

  // Basic user operations
  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.API_URL}`);
  }

  getUserById(id: string): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.API_URL}/${id}`);
  }

  // Advanced user filtering and search
  getFilteredUsers(filter: UserFilterDto): Observable<PagedResultDto<UserDto>> {
    return this.http.post<PagedResultDto<UserDto>>(`${this.API_URL}/search`, filter);
  }

  // Admin user management
  adminUpdateUser(id: string, userData: AdminUserUpdateDto): Observable<any> {
    return this.http.put(`${this.API_URL}/${id}/admin`, userData);
  }

  deactivateUser(id: string): Observable<any> {
    return this.http.delete(`${this.API_URL}/${id}`);
  }

  resetUserPassword(id: string): Observable<any> {
    return this.http.post(`${this.API_URL}/${id}/reset-password`, {});
  }

  // Bulk operations
  bulkAssignRole(data: BulkRoleAssignmentDto): Observable<BulkOperationResultDto> {
    return this.http.post<BulkOperationResultDto>(`${this.API_URL}/bulk/assign-role`, data);
  }

  bulkChangeDepartment(data: BulkDepartmentChangeDto): Observable<BulkOperationResultDto> {
    return this.http.post<BulkOperationResultDto>(`${this.API_URL}/bulk/change-department`, data);
  }

  bulkActivateDeactivate(data: BulkActivationDto): Observable<BulkOperationResultDto> {
    return this.http.post<BulkOperationResultDto>(`${this.API_URL}/bulk/activate-deactivate`, data);
  }

  // Analytics
  getUserAnalytics(): Observable<UserAnalyticsDto> {
    return this.http.get<UserAnalyticsDto>(`${this.API_URL}/analytics`);
  }
}
