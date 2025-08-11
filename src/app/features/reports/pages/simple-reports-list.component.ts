import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { AuthService } from '../../../core/services/auth.service';
import { ReportsService, Report } from '../../../core/services/reports.service';
import { UserRole, Department, ReportStatus } from '../../../core/models/enums';

@Component({
  selector: 'app-reports-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="reports-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">
              <mat-icon>description</mat-icon>
              Project Controls Reports
              @if (isGeneralStaff()) {
                <mat-chip class="role-chip staff-chip">My Reports</mat-chip>
              } @else if (isLineManager()) {
                <mat-chip class="role-chip manager-chip">Team Reports</mat-chip>
              } @else if (isExecutive()) {
                <mat-chip class="role-chip executive-chip">All Reports</mat-chip>
              }
            </h1>
            <p class="page-subtitle">
              @if (isGeneralStaff()) {
                Manage and track your project controls reports for Rand Water
              } @else if (isLineManager()) {
                Manage and track your team's project controls reports for Rand Water
              } @else if (isExecutive()) {
                Executive view of all project controls reports across Rand Water
              }
            </p>
          </div>
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="createReport()">
              <mat-icon>add</mat-icon>
              Create New Report
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
                <mat-label>Search by name</mat-label>
                <input matInput placeholder="Search reports..." formControlName="search">
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Status</mat-label>
                <mat-select formControlName="status">
                  <mat-option value="">All Statuses</mat-option>
                  <mat-option value="Draft">Draft</mat-option>
                  <mat-option value="Submitted">Submitted</mat-option>
                  <mat-option value="InReview">In Review</mat-option>
                  <mat-option value="ManagerReview">Manager Review</mat-option>
                  <mat-option value="ManagerApproved">Manager Approved</mat-option>
                  <mat-option value="ExecutiveReview">Executive Review</mat-option>
                  <mat-option value="Approved">Approved</mat-option>
                  <mat-option value="Published">Published</mat-option>
                  <mat-option value="Completed">Completed</mat-option>
                  <mat-option value="Rejected">Rejected</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>From Date</mat-label>
                <input matInput [matDatepicker]="fromPicker" formControlName="dateFrom">
                <mat-datepicker-toggle matIconSuffix [for]="fromPicker"></mat-datepicker-toggle>
                <mat-datepicker #fromPicker></mat-datepicker>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>To Date</mat-label>
                <input matInput [matDatepicker]="toPicker" formControlName="dateTo">
                <mat-datepicker-toggle matIconSuffix [for]="toPicker"></mat-datepicker-toggle>
                <mat-datepicker #toPicker></mat-datepicker>
              </mat-form-field>

              @if (isExecutive()) {
                <mat-form-field appearance="outline">
                  <mat-label>Department</mat-label>
                  <mat-select formControlName="department">
                    <mat-option value="">All Departments</mat-option>
                    <mat-option value="ProjectSupport">Project Support</mat-option>
                    <mat-option value="DocManagement">Document Management</mat-option>
                    <mat-option value="QS">Quantity Surveying</mat-option>
                    <mat-option value="ContractsManagement">Contracts Management</mat-option>
                    <mat-option value="BusinessAssurance">Business Assurance</mat-option>
                    <mat-option value="Engineering">Engineering</mat-option>
                    <mat-option value="Operations">Operations</mat-option>
                    <mat-option value="Finance">Finance</mat-option>
                    <mat-option value="HR">Human Resources</mat-option>
                    <mat-option value="IT">Information Technology</mat-option>
                    <mat-option value="Planning">Planning</mat-option>
                  </mat-select>
                </mat-form-field>
              }

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
        </mat-card-header>

        <mat-card-content>
          @if (isLoading()) {
            <div class="loading-container">
              <mat-spinner diameter="50"></mat-spinner>
              <p>Loading reports...</p>
            </div>
          } @else {
            @if (filteredReports().length > 0) {
              <div class="reports-grid">
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
            } @else {
              <div class="no-reports">
                <mat-icon>description</mat-icon>
                <h3>No reports found</h3>
                <p>{{ hasFilters() ? 'Try adjusting your filters or' : '' }} Create your first report to get started.</p>
                <button mat-raised-button color="primary" (click)="createReport()">
                  <mat-icon>add</mat-icon>
                  Create Report
                </button>
              </div>
            }
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
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-pack: justify;
      -ms-flex-pack: justify;
      justify-content: space-between;
      -webkit-box-align: start;
      -ms-flex-align: start;
      align-items: flex-start;
      gap: 24px;
    }

    .header-text h1 {
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      gap: 12px;
      font-size: 2rem;
      font-weight: 300;
      margin: 0 0 8px 0;
      color: #2E86AB;
      -ms-flex-wrap: wrap;
      flex-wrap: wrap;
    }

    .role-chip {
      margin-left: 16px;
      font-size: 0.75rem;
      height: 24px;
      border-radius: 12px;
    }

    .staff-chip {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .manager-chip {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .executive-chip {
      background-color: #f3e5f5;
      color: #7b1fa2;
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
      display: -ms-grid;
      display: grid;
      -ms-grid-columns: 2fr 1fr 1fr 1fr auto auto auto;
      grid-template-columns: 2fr 1fr 1fr 1fr auto auto auto;
      gap: 16px;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
    }

    .filters-row.executive-view {
      -ms-grid-columns: 2fr 1fr 1fr 1fr 1fr auto auto;
      grid-template-columns: 2fr 1fr 1fr 1fr 1fr auto auto;
    }

    /* Fallback for browsers that don't support grid */
    @supports not (display: grid) {
      .filters-row {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -ms-flex-wrap: wrap;
        flex-wrap: wrap;
        gap: 16px;
      }
      
      .filters-row > * {
        -webkit-box-flex: 1;
        -ms-flex: 1;
        flex: 1;
        min-width: 200px;
      }
    }

    .table-card {
      margin-bottom: 24px;
    }

    .reports-grid {
      display: -ms-grid;
      display: grid;
      -ms-grid-columns: (minmax(350px, 1fr))[auto-fill];
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }

    /* Fallback for browsers that don't support grid */
    @supports not (display: grid) {
      .reports-grid {
        display: -webkit-box;
        display: -ms-flexbox;
        display: flex;
        -ms-flex-wrap: wrap;
        flex-wrap: wrap;
        gap: 20px;
      }
      
      .reports-grid .report-card {
        -webkit-box-flex: 1;
        -ms-flex: 1 1 350px;
        flex: 1 1 350px;
        max-width: 450px;
      }
    }

    .report-card {
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      height: 100%;
    }

    .report-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .report-card mat-card-header {
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-pack: justify;
      -ms-flex-pack: justify;
      justify-content: space-between;
      -webkit-box-align: start;
      -ms-flex-align: start;
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
      /* Fallback for browsers that don't support line-clamp */
      max-height: 2.6em;
      line-height: 1.3em;
    }

    .card-meta {
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      -ms-flex-wrap: wrap;
      flex-wrap: wrap;
    }

    .card-footer {
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-pack: justify;
      -ms-flex-pack: justify;
      justify-content: space-between;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      font-size: 0.875rem;
      color: #666;
    }

    .status-draft { background-color: #f3e5f5; color: #7b1fa2; }
    .status-submitted { background-color: #e3f2fd; color: #1976d2; }
    .status-inreview { background-color: #fff3e0; color: #f57c00; }
    .status-managerreview { background-color: #fff8e1; color: #f9a825; }
    .status-managerapproved { background-color: #e8f5e8; color: #2e7d32; }
    .status-executivereview { background-color: #fce4ec; color: #c2185b; }
    .status-approved { background-color: #e8f5e8; color: #2e7d32; }
    .status-published { background-color: #e8f5e8; color: #388e3c; }
    .status-completed { background-color: #e8f5e8; color: #1b5e20; }
    .status-rejected { background-color: #ffebee; color: #c62828; }

    .priority-low { background-color: #f1f8e9; color: #558b2f; }
    .priority-medium { background-color: #fff8e1; color: #f9a825; }
    .priority-high { background-color: #fff3e0; color: #ef6c00; }
    .priority-critical { background-color: #ffebee; color: #c62828; }

    .due-date-overdue { color: #c62828; font-weight: 500; }
    .due-date-soon { color: #f57c00; font-weight: 500; }
    .due-date-normal { color: #666; }

    .delete-action {
      color: #c62828;
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
        -webkit-box-orient: vertical;
        -webkit-box-direction: normal;
        -ms-flex-direction: column;
        flex-direction: column;
        gap: 16px;
      }

      .filters-row {
        -ms-grid-columns: 1fr;
        grid-template-columns: 1fr;
        gap: 12px;
      }

      /* Fallback for non-grid browsers */
      @supports not (display: grid) {
        .filters-row {
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          -ms-flex-direction: column;
          flex-direction: column;
        }
        
        .filters-row > * {
          -webkit-box-flex: 0;
          -ms-flex: none;
          flex: none;
          min-width: auto;
          width: 100%;
        }
      }

      .reports-grid {
        -ms-grid-columns: 1fr;
        grid-template-columns: 1fr;
      }

      /* Fallback for non-grid browsers */
      @supports not (display: grid) {
        .reports-grid {
          -webkit-box-orient: vertical;
          -webkit-box-direction: normal;
          -ms-flex-direction: column;
          flex-direction: column;
        }
        
        .reports-grid .report-card {
          -webkit-box-flex: 0;
          -ms-flex: none;
          flex: none;
          max-width: none;
        }
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
  reports = signal<Report[]>([]);
  
  // Form
  filtersForm: FormGroup;

  // Computed
  currentUser = computed(() => this.authService.currentUser());

  // Role-based computed properties
  isGeneralStaff = computed(() => this.currentUser()?.role === UserRole.GeneralStaff);
  isLineManager = computed(() => this.currentUser()?.role === UserRole.LineManager);
  isExecutive = computed(() => this.currentUser()?.role === UserRole.Executive);

  filteredReports = computed(() => {
    const allReports = this.reports();
    const filters = this.filtersForm?.value;
    const user = this.currentUser();
    
    if (!filters || !user) return allReports;

    let filteredReports = allReports;

    // Role-based filtering
    if (this.isGeneralStaff()) {
      // General staff can only see their own reports
      filteredReports = allReports.filter(report => 
        report.createdBy === `${user.firstName} ${user.lastName}`
      );
    }
    // Line managers and executives see team/all reports based on API calls

    // Apply user filters
    return filteredReports.filter(report => {
      const matchesSearch = !filters.search || 
        report.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
        report.createdBy.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesStatus = !filters.status || this.getStatusDisplay(report.status) === filters.status;
      const matchesDepartment = !filters.department || this.getDepartmentDisplay(report.department) === filters.department;
      
      const matchesDateFrom = !filters.dateFrom || new Date(report.createdDate) >= new Date(filters.dateFrom);
      const matchesDateTo = !filters.dateTo || new Date(report.createdDate) <= new Date(filters.dateTo);

      return matchesSearch && matchesStatus && matchesDepartment && matchesDateFrom && matchesDateTo;
    });
  });

  hasFilters = computed(() => {
    const filters = this.filtersForm?.value;
    return filters && (filters.search || filters.status || filters.department || filters.dateFrom || filters.dateTo);
  });

  constructor() {
    this.filtersForm = this.fb.group({
      search: [''],
      status: [''],
      department: [''],
      dateFrom: [''],
      dateTo: ['']
    });
  }

  ngOnInit(): void {
    this.loadReports();
  }

  private async loadReports(): Promise<void> {
    this.isLoading.set(true);
    try {
      const user = this.currentUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      // Mock data based on user role - replace with actual API calls
      let mockReports: Report[] = [];

      if (user.role === UserRole.GeneralStaff) {
        // General staff - only their own reports
        mockReports = [
          {
            id: 1,
            title: 'My Monthly Progress Report - January 2025',
            type: 'Monthly Progress',
            status: ReportStatus.Draft,
            department: user.department,
            createdBy: `${user.firstName} ${user.lastName}`,
            createdDate: new Date('2025-01-15'),
            dueDate: new Date('2025-02-01'),
            lastModified: new Date('2025-01-20'),
            description: 'My monthly progress report covering all activities.',
            priority: 'Medium'
          },
          {
            id: 2,
            title: 'Quality Control Report - December',
            type: 'Quality Control',
            status: ReportStatus.Submitted,
            department: user.department,
            createdBy: `${user.firstName} ${user.lastName}`,
            createdDate: new Date('2025-01-05'),
            dueDate: new Date('2025-01-20'),
            lastModified: new Date('2025-01-10'),
            description: 'Monthly quality control report for my assigned activities.',
            priority: 'Medium'
          }
        ];
      } else if (user.role === UserRole.LineManager) {
        // Line managers - their team's reports
        mockReports = [
          {
            id: 1,
            title: 'Team Progress Report - January 2025',
            type: 'Monthly Progress',
            status: ReportStatus.Completed,
            department: user.department,
            createdBy: 'John Smith',
            createdDate: new Date('2025-01-15'),
            dueDate: new Date('2025-02-01'),
            lastModified: new Date('2025-01-20'),
            description: 'Team monthly progress report covering all activities.',
            priority: 'High'
          },
          {
            id: 2,
            title: 'Quality Control Report - December',
            type: 'Quality Control',
            status: ReportStatus.Submitted,
            department: user.department,
            createdBy: 'Sarah Johnson',
            createdDate: new Date('2025-01-05'),
            dueDate: new Date('2025-01-20'),
            lastModified: new Date('2025-01-10'),
            description: 'Quality control report from team member.',
            priority: 'Medium'
          },
          {
            id: 3,
            title: 'My Manager Report',
            type: 'Manager Summary',
            status: ReportStatus.Draft,
            department: user.department,
            createdBy: `${user.firstName} ${user.lastName}`,
            createdDate: new Date('2025-01-08'),
            dueDate: new Date('2025-01-30'),
            lastModified: new Date('2025-01-12'),
            description: 'Manager summary report for the team.',
            priority: 'High'
          }
        ];
      } else if (user.role === UserRole.Executive) {
        // Executives - all reports from all departments
        mockReports = [
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
          },
          {
            id: 4,
            title: 'Quality Control Report - December',
            type: 'Quality Control',
            status: ReportStatus.Submitted,
            department: Department.QS,
            createdBy: 'Linda Williams',
            createdDate: new Date('2025-01-05'),
            dueDate: new Date('2025-01-20'),
            lastModified: new Date('2025-01-10'),
            description: 'Monthly quality control report for construction activities.',
            priority: 'Medium'
          },
          {
            id: 5,
            title: 'HR Performance Review Summary',
            type: 'Performance Review',
            status: ReportStatus.Approved,
            department: Department.HR,
            createdBy: 'Mary Brown',
            createdDate: new Date('2025-01-03'),
            dueDate: new Date('2025-01-15'),
            lastModified: new Date('2025-01-08'),
            description: 'Quarterly performance review summary for all departments.',
            priority: 'Medium'
          },
          {
            id: 6,
            title: 'IT Infrastructure Report',
            type: 'Infrastructure',
            status: ReportStatus.ExecutiveReview,
            department: Department.IT,
            createdBy: 'David Wilson',
            createdDate: new Date('2025-01-12'),
            dueDate: new Date('2025-02-05'),
            lastModified: new Date('2025-01-18'),
            description: 'Monthly IT infrastructure status and upgrade recommendations.',
            priority: 'High'
          }
        ];
      }

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

  createReport(): void {
    // Navigate to create report page or open modal
    console.log('Create new report');
    alert('Create Report functionality would be implemented here');
  }

  viewReport(id: number): void {
    console.log('View report:', id);
    alert(`View Report ${id} - functionality would be implemented here`);
  }

  editReport(id: number): void {
    console.log('Edit report:', id);
    alert(`Edit Report ${id} - functionality would be implemented here`);
  }

  deleteReport(id: number): void {
    console.log('Delete report:', id);
    if (confirm('Are you sure you want to delete this report?')) {
      // Remove from local state
      const currentReports = this.reports();
      const updatedReports = currentReports.filter(r => r.id !== id);
      this.reports.set(updatedReports);
    }
  }

  canEditReport(report: Report): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Users can edit their own reports if in draft or rejected status
    if (report.createdBy === `${user.firstName} ${user.lastName}`) {
      return report.status === ReportStatus.Draft || report.status === ReportStatus.Rejected;
    }

    // Line managers can edit their team's reports in certain statuses
    if (user.role === UserRole.LineManager && report.department === user.department) {
      return report.status === ReportStatus.Submitted || 
             report.status === ReportStatus.InReview ||
             report.status === ReportStatus.ManagerReview;
    }

    // Executives can edit any report in review status
    if (user.role === UserRole.Executive) {
      return report.status === ReportStatus.ManagerApproved || 
             report.status === ReportStatus.ExecutiveReview ||
             report.status === ReportStatus.Draft ||
             report.status === ReportStatus.Rejected;
    }

    return false;
  }

  canDeleteReport(report: Report): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Users can delete their own draft reports
    if (report.createdBy === `${user.firstName} ${user.lastName}`) {
      return report.status === ReportStatus.Draft;
    }

    // Line managers can delete team draft reports
    if (user.role === UserRole.LineManager && report.department === user.department) {
      return report.status === ReportStatus.Draft;
    }

    // Executives can delete any draft or rejected report
    if (user.role === UserRole.Executive) {
      return report.status === ReportStatus.Draft || report.status === ReportStatus.Rejected;
    }

    return false;
  }

  getStatusDisplay(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.Draft: return 'Draft';
      case ReportStatus.Submitted: return 'Submitted';
      case ReportStatus.InReview: return 'InReview';
      case ReportStatus.ManagerReview: return 'ManagerReview';
      case ReportStatus.ManagerApproved: return 'ManagerApproved';
      case ReportStatus.ExecutiveReview: return 'ExecutiveReview';
      case ReportStatus.Approved: return 'Approved';
      case ReportStatus.Published: return 'Published';
      case ReportStatus.Completed: return 'Completed';
      case ReportStatus.Rejected: return 'Rejected';
      default: return 'Unknown';
    }
  }

  getDepartmentDisplay(department: Department): string {
    switch (department) {
      case Department.ProjectSupport: return 'ProjectSupport';
      case Department.DocManagement: return 'DocManagement';
      case Department.QS: return 'QS';
      case Department.ContractsManagement: return 'ContractsManagement';
      case Department.BusinessAssurance: return 'BusinessAssurance';
      case Department.Engineering: return 'Engineering';
      case Department.Operations: return 'Operations';
      case Department.Finance: return 'Finance';
      case Department.HR: return 'HR';
      case Department.IT: return 'IT';
      case Department.Planning: return 'Planning';
      default: return 'Unknown';
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
