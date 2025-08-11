import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { ReportsService } from '../../../core/services/reports.service';
import { UserRole, Department, ReportStatus } from '../../../core/models/enums';

interface Report {
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
}

@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="reports-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">
              <mat-icon>description</mat-icon>
              Reports Management
            </h1>
            <p class="page-subtitle">
              Manage and track project controls reports for Rand Water
            </p>
          </div>
          <div class="header-actions">
            <button mat-raised-button color="primary" routerLink="/reports/create">
              <mat-icon>add</mat-icon>
              Create Report
            </button>
          </div>
        </div>
      </div>

      <!-- Filters Section -->
      <mat-card class="filters-card">
        <mat-card-content>
          <form [formGroup]="filtersForm" class="filters-form">
            <div class="filters-row">
              <mat-form-field appearance="outline">
                <mat-label>Search</mat-label>
                <input matInput placeholder="Search reports..." formControlName="search">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="">All Statuses</mat-option>
                  <mat-option value="Draft">Draft</mat-option>
                  <mat-option value="InReview">In Review</mat-option>
                  <mat-option value="Approved">Approved</mat-option>
                  <mat-option value="Rejected">Rejected</mat-option>
                  <mat-option value="Published">Published</mat-option>
                </mat-select>
              </mat-form-field>

              @if (canViewAllDepartments()) {
                <mat-form-field appearance="outline">
                  <mat-label>Department</mat-label>
                  <mat-select formControlName="department">
                    <mat-option value="">All Departments</mat-option>
                    <mat-option value="Engineering">Engineering</mat-option>
                    <mat-option value="Operations">Operations</mat-option>
                    <mat-option value="Finance">Finance</mat-option>
                    <mat-option value="HR">Human Resources</mat-option>
                    <mat-option value="IT">Information Technology</mat-option>
                    <mat-option value="QS">Quantity Surveying</mat-option>
                    <mat-option value="Planning">Planning</mat-option>
                  </mat-select>
                </mat-form-field>
              }

              <mat-form-field appearance="outline">
                <mat-label>Report Type</mat-label>
                <mat-select formControlName="type">
                  <mat-option value="">All Types</mat-option>
                  <mat-option value="Monthly Progress">Monthly Progress</mat-option>
                  <mat-option value="Budget Analysis">Budget Analysis</mat-option>
                  <mat-option value="Risk Assessment">Risk Assessment</mat-option>
                  <mat-option value="Quality Control">Quality Control</mat-option>
                  <mat-option value="Schedule Update">Schedule Update</mat-option>
                  <mat-option value="Resource Allocation">Resource Allocation</mat-option>
                </mat-select>
              </mat-form-field>

              <button mat-raised-button color="accent" (click)="applyFilters()">
                <mat-icon>filter_list</mat-icon>
                Apply Filters
              </button>

              <button mat-button (click)="clearFilters()">
                <mat-icon>clear</mat-icon>
                Clear
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Reports Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>
            Reports ({{ filteredReports().length }})
          </mat-card-title>
          <div class="view-toggle">
            <button mat-icon-button [class.active]="viewMode() === 'table'" (click)="setViewMode('table')" matTooltip="Table View">
              <mat-icon>table_view</mat-icon>
            </button>
            <button mat-icon-button [class.active]="viewMode() === 'cards'" (click)="setViewMode('cards')" matTooltip="Card View">
              <mat-icon>view_module</mat-icon>
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          @if (isLoading()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Loading reports...</p>
            </div>
          } @else {
            @if (viewMode() === 'table') {
              <div class="table-container">
                <table mat-table [dataSource]="filteredReports()" class="reports-table" matSort>
                  <!-- Title Column -->
                  <ng-container matColumnDef="title">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Title</th>
                    <td mat-cell *matCellDef="let report">
                      <div class="title-cell">
                        <strong>{{ report.title }}</strong>
                        @if (report.description) {
                          <p class="description">{{ report.description }}</p>
                        }
                      </div>
                    </td>
                  </ng-container>

                  <!-- Type Column -->
                  <ng-container matColumnDef="type">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Type</th>
                    <td mat-cell *matCellDef="let report">
                      <mat-chip class="type-chip">{{ report.type }}</mat-chip>
                    </td>
                  </ng-container>

                  <!-- Status Column -->
                  <ng-container matColumnDef="status">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
                    <td mat-cell *matCellDef="let report">
                      <mat-chip [ngClass]="'status-' + getStatusDisplay(report.status).toLowerCase().replace(' ', '')">
                        {{ getStatusDisplay(report.status) }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Department Column -->
                  <ng-container matColumnDef="department">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Department</th>
                    <td mat-cell *matCellDef="let report">{{ getDepartmentDisplay(report.department) }}</td>
                  </ng-container>

                  <!-- Created By Column -->
                  <ng-container matColumnDef="createdBy">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Created By</th>
                    <td mat-cell *matCellDef="let report">{{ report.createdBy }}</td>
                  </ng-container>

                  <!-- Due Date Column -->
                  <ng-container matColumnDef="dueDate">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Due Date</th>
                    <td mat-cell *matCellDef="let report">
                      @if (report.dueDate) {
                        <span [ngClass]="getDueDateClass(report.dueDate)">
                          {{ report.dueDate | date:'MMM dd, yyyy' }}
                        </span>
                      } @else {
                        <span class="no-due-date">No due date</span>
                      }
                    </td>
                  </ng-container>

                  <!-- Priority Column -->
                  <ng-container matColumnDef="priority">
                    <th mat-header-cell *matHeaderCellDef mat-sort-header>Priority</th>
                    <td mat-cell *matCellDef="let report">
                      <mat-chip [ngClass]="'priority-' + report.priority.toLowerCase()">
                        {{ report.priority }}
                      </mat-chip>
                    </td>
                  </ng-container>

                  <!-- Actions Column -->
                  <ng-container matColumnDef="actions">
                    <th mat-header-cell *matHeaderCellDef>Actions</th>
                    <td mat-cell *matCellDef="let report">
                      <button mat-icon-button [matMenuTriggerFor]="reportMenu">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #reportMenu="matMenu">
                        <button mat-menu-item (click)="viewReport(report.id)">
                          <mat-icon>visibility</mat-icon>
                          View
                        </button>
                        @if (canEditReport(report)) {
                          <button mat-menu-item (click)="editReport(report.id)">
                            <mat-icon>edit</mat-icon>
                            Edit
                          </button>
                        }
                        @if (canDeleteReport(report)) {
                          <button mat-menu-item (click)="deleteReport(report.id)" class="delete-action">
                            <mat-icon>delete</mat-icon>
                            Delete
                          </button>
                        }
                        <button mat-menu-item (click)="exportReport(report.id)">
                          <mat-icon>file_download</mat-icon>
                          Export
                        </button>
                      </mat-menu>
                    </td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;" 
                      class="report-row" 
                      (click)="viewReport(row.id)"></tr>
                </table>
              </div>
            } @else {
              <!-- Card View -->
              <div class="cards-grid">
                @for (report of filteredReports(); track report.id) {
                  <mat-card class="report-card" (click)="viewReport(report.id)">
                    <mat-card-header>
                      <mat-card-title>{{ report.title }}</mat-card-title>
                      <mat-card-subtitle>{{ report.type }}</mat-card-subtitle>
                      <button mat-icon-button [matMenuTriggerFor]="cardMenu" (click)="$event.stopPropagation()">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      <mat-menu #cardMenu="matMenu">
                        <button mat-menu-item (click)="viewReport(report.id)">
                          <mat-icon>visibility</mat-icon>
                          View
                        </button>
                        @if (canEditReport(report)) {
                          <button mat-menu-item (click)="editReport(report.id)">
                            <mat-icon>edit</mat-icon>
                            Edit
                          </button>
                        }
                        @if (canDeleteReport(report)) {
                          <button mat-menu-item (click)="deleteReport(report.id)" class="delete-action">
                            <mat-icon>delete</mat-icon>
                            Delete
                          </button>
                        }
                      </mat-menu>
                    </mat-card-header>
                    <mat-card-content>
                      @if (report.description) {
                        <p class="card-description">{{ report.description }}</p>
                      }
                      <div class="card-meta">
                        <mat-chip [ngClass]="'status-' + getStatusDisplay(report.status).toLowerCase().replace(' ', '')">
                          {{ getStatusDisplay(report.status) }}
                        </mat-chip>
                        <mat-chip [ngClass]="'priority-' + report.priority.toLowerCase()">
                          {{ report.priority }}
                        </mat-chip>
                      </div>
                      <div class="card-footer">
                        <span class="created-by">{{ report.createdBy }}</span>
                        @if (report.dueDate) {
                          <span [ngClass]="getDueDateClass(report.dueDate)">
                            Due: {{ report.dueDate | date:'MMM dd' }}
                          </span>
                        }
                      </div>
                    </mat-card-content>
                  </mat-card>
                }
              </div>
            }
          }

          @if (!isLoading() && filteredReports().length === 0) {
            <div class="no-reports">
              <mat-icon>description</mat-icon>
              <h3>No reports found</h3>
              <p>{{ hasFilters() ? 'Try adjusting your filters or' : '' }} Create your first report to get started.</p>
              <button mat-raised-button color="primary" routerLink="/reports/create">
                <mat-icon>add</mat-icon>
                Create Report
              </button>
            </div>
          }
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .reports-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
    }

    .header-text h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 2rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #2E86AB;
    }

    .page-subtitle {
      color: #666;
      margin: 0;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters-form {
      width: 100%;
    }

    .filters-row {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1fr auto auto;
      gap: 16px;
      align-items: center;
    }

    .table-card {
      margin-bottom: 24px;
    }

    .table-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .view-toggle {
      display: flex;
      gap: 4px;
    }

    .view-toggle button.active {
      background-color: #2E86AB;
      color: white;
    }

    .table-container {
      overflow-x: auto;
    }

    .reports-table {
      width: 100%;
      min-width: 800px;
    }

    .title-cell strong {
      display: block;
      font-weight: 500;
    }

    .title-cell .description {
      font-size: 0.875rem;
      color: #666;
      margin: 4px 0 0 0;
    }

    .report-row {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .report-row:hover {
      background-color: #f5f5f5;
    }

    .type-chip {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .status-draft { background-color: #f3e5f5; color: #7b1fa2; }
    .status-inreview { background-color: #fff3e0; color: #f57c00; }
    .status-approved { background-color: #e8f5e8; color: #2e7d32; }
    .status-rejected { background-color: #ffebee; color: #c62828; }
    .status-published { background-color: #e1f5fe; color: #0277bd; }

    .priority-low { background-color: #f1f8e9; color: #558b2f; }
    .priority-medium { background-color: #fff8e1; color: #f9a825; }
    .priority-high { background-color: #fff3e0; color: #ef6c00; }
    .priority-critical { background-color: #ffebee; color: #c62828; }

    .due-date-overdue { color: #c62828; font-weight: 500; }
    .due-date-soon { color: #f57c00; font-weight: 500; }
    .due-date-normal { color: #666; }
    .no-due-date { color: #999; font-style: italic; }

    .delete-action {
      color: #c62828;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .report-card {
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .report-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .report-card mat-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .card-description {
      font-size: 0.875rem;
      color: #666;
      margin: 0 0 16px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-meta {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
      color: #666;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px;
      gap: 16px;
    }

    .no-reports {
      text-align: center;
      padding: 60px 20px;
      color: #666;
    }

    .no-reports mat-icon {
      font-size: 4rem;
      width: 4rem;
      height: 4rem;
      color: #ddd;
      margin-bottom: 16px;
    }

    .no-reports h3 {
      margin: 16px 0 8px 0;
      color: #333;
    }

    @media (max-width: 768px) {
      .reports-container {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        gap: 16px;
      }

      .filters-row {
        grid-template-columns: 1fr;
        gap: 12px;
      }

      .cards-grid {
        grid-template-columns: 1fr;
      }

      .table-container {
        font-size: 0.875rem;
      }
    }
  `]
})
export class ReportsListComponent implements OnInit {
  private authService = inject(AuthService);
  private reportsService = inject(ReportsService);
  private fb = inject(FormBuilder);

  // Signals
  isLoading = signal(false);
  viewMode = signal<'table' | 'cards'>('table');
  reports = signal<Report[]>([]);
  
  // Form
  filtersForm: FormGroup;

  // Computed
  currentUser = computed(() => this.authService.currentUser());
  
  canViewAllDepartments = computed(() => {
    const user = this.currentUser();
    return user?.role === UserRole.Executive || user?.role === UserRole.LineManager;
  });

  filteredReports = computed(() => {
    const allReports = this.reports();
    const filters = this.filtersForm?.value;
    
    if (!filters) return allReports;

    return allReports.filter(report => {
      const matchesSearch = !filters.search || 
        report.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.description?.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || report.status === filters.status;
      const matchesDepartment = !filters.department || report.department === filters.department;
      const matchesType = !filters.type || report.type === filters.type;

      return matchesSearch && matchesStatus && matchesDepartment && matchesType;
    });
  });

  hasFilters = computed(() => {
    const filters = this.filtersForm?.value;
    return filters && (filters.search || filters.status || filters.department || filters.type);
  });

  // Table columns
  displayedColumns = ['title', 'type', 'status', 'department', 'createdBy', 'dueDate', 'priority', 'actions'];

  constructor() {
    this.filtersForm = this.fb.group({
      search: [''],
      status: [''],
      department: [''],
      type: ['']
    });
  }

  ngOnInit(): void {
    this.loadReports();
  }

  private async loadReports(): Promise<void> {
    this.isLoading.set(true);
    try {
      // In a real app, this would call the API
      const mockReports: Report[] = [
        {
          id: 1,
          title: 'Monthly Progress Report - January 2025',
          type: 'Monthly Progress',
          status: ReportStatus.Completed,
          department: Department.Engineering,
          createdBy: 'John Smith',
          createdDate: new Date('2025-01-15'),
          dueDate: new Date('2025-02-01'),
          lastModified: new Date('2025-01-20'),
          description: 'Comprehensive monthly progress report covering all engineering activities.',
          priority: 'High'
        },
        {
          id: 2,
          title: 'Budget Analysis Q4 2024',
          type: 'Budget Analysis',
          status: ReportStatus.ManagerReview,
          department: Department.Finance,
          createdBy: 'Sarah Johnson',
          createdDate: new Date('2025-01-10'),
          dueDate: new Date('2025-01-25'),
          lastModified: new Date('2025-01-15'),
          description: 'Quarterly budget analysis and variance reporting.',
          priority: 'Medium'
        },
        {
          id: 3,
          title: 'Risk Assessment - Water Treatment Plant',
          type: 'Risk Assessment',
          status: ReportStatus.Draft,
          department: Department.Operations,
          createdBy: 'Mike Chen',
          createdDate: new Date('2025-01-08'),
          dueDate: new Date('2025-01-30'),
          lastModified: new Date('2025-01-12'),
          description: 'Comprehensive risk assessment for the new water treatment facility.',
          priority: 'Critical'
        }
      ];

      this.reports.set(mockReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilters(): void {
    // Filtering is handled reactively through computed signal
    console.log('Filters applied:', this.filtersForm.value);
  }

  clearFilters(): void {
    this.filtersForm.reset();
  }

  setViewMode(mode: 'table' | 'cards'): void {
    this.viewMode.set(mode);
  }

  viewReport(id: number): void {
    console.log('View report:', id);
    // Navigate to report detail view
  }

  editReport(id: number): void {
    console.log('Edit report:', id);
    // Navigate to report edit page
  }

  deleteReport(id: number): void {
    console.log('Delete report:', id);
    // Show confirmation dialog and delete
  }

  exportReport(id: number): void {
    console.log('Export report:', id);
    // Export report functionality
  }

  canEditReport(report: Report): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Users can edit their own reports if in draft or rejected status
    if (report.createdBy === `${user.firstName} ${user.lastName}`) {
      return report.status === ReportStatus.Draft || report.status === ReportStatus.Rejected;
    }

    // Executives can edit any report
    return user.role === UserRole.Executive;
  }

  canDeleteReport(report: Report): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Only executives or report creators (if draft) can delete
    if (user.role === UserRole.Executive) return true;
    
    return report.createdBy === `${user.firstName} ${user.lastName}` && 
           report.status === ReportStatus.Draft;
  }

  getStatusDisplay(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.Draft: return 'Draft';
      case ReportStatus.Submitted: return 'Submitted';
      case ReportStatus.ManagerReview: return 'Manager Review';
      case ReportStatus.ManagerApproved: return 'Manager Approved';
      case ReportStatus.ExecutiveReview: return 'Executive Review';
      case ReportStatus.Completed: return 'Completed';
      case ReportStatus.Rejected: return 'Rejected';
      default: return status.toString();
    }
  }

  getDepartmentDisplay(department: Department): string {
    switch (department) {
      case Department.Engineering: return 'Engineering';
      case Department.Operations: return 'Operations';
      case Department.Finance: return 'Finance';
      case Department.HR: return 'Human Resources';
      case Department.IT: return 'Information Technology';
      case Department.QS: return 'Quantity Surveying';
      case Department.Planning: return 'Planning';
      default: return department.toString();
    }
  }

  getDueDateClass(dueDate: Date): string {
    const today = new Date();
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff < 0) return 'due-date-overdue';
    if (daysDiff <= 3) return 'due-date-soon';
    return 'due-date-normal';
  }
}
