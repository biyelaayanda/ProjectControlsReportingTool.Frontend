import { Component, computed, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { ReportsService, Report } from '../../../core/services/reports.service';
import { UserRole, Department, ReportStatus } from '../../../core/models/enums';
import { CreateReportComponent } from '../components/create-report.component';
import { ReviewReportDialogComponent, ReviewReportDialogData, ReviewReportDialogResult } from '../components/review-report-dialog.component';

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
    MatNativeDateModule,
    MatDialogModule,
    MatSnackBarModule
  ],
  template: `
    <div class="reports-container">
      <!-- Header Section -->
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1 class="page-title">
              <mat-icon>description</mat-icon>
              @if (isReviewPage()) {
                Review Reports
              } @else {
                Project Controls Reports
              }
              @if (isGeneralStaff()) {
                <mat-chip class="role-chip staff-chip">My Reports</mat-chip>
              } @else if (isLineManager()) {
                <mat-chip class="role-chip manager-chip">@if (isReviewPage()) {Department Reviews} @else {My Reports}</mat-chip>
              } @else if (isExecutive()) {
                <mat-chip class="role-chip executive-chip">@if (isReviewPage()) {Executive Reviews} @else {All Reports}</mat-chip>
              }
            </h1>
            <p class="page-subtitle">
              @if (isReviewPage()) {
                @if (isLineManager()) {
                  Review and approve reports submitted by your department members
                } @else if (isExecutive()) {
                  Review and approve reports approved by Line Managers
                }
              } @else {
                @if (isGeneralStaff()) {
                  Manage and track your project controls reports for Rand Water
                } @else if (isLineManager()) {
                  Manage your own reports and oversee your department's reporting activities
                } @else if (isExecutive()) {
                  Executive view of all project controls reports across Rand Water
                }
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
                  <mat-option value="ManagerReview">Manager Review</mat-option>
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
                        @if (canSubmitReport(report)) {
                          <button mat-menu-item (click)="submitReport(report.id)" class="submit-action">
                            <mat-icon>send</mat-icon>
                            Submit for Review
                          </button>
                        }
                        @if (canApproveReport(report)) {
                          <button mat-menu-item (click)="approveReport(report.id)" class="approve-action">
                            <mat-icon>check_circle</mat-icon>
                            Approve
                          </button>
                        }
                        @if (canRejectReport(report)) {
                          <button mat-menu-item (click)="rejectReport(report.id)" class="reject-action">
                            <mat-icon>cancel</mat-icon>
                            Reject
                          </button>
                        }
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
                        <mat-chip [ngClass]="getPriorityClass(report.priority)">
                          {{ getPriorityDisplay(report.priority) }}
                        </mat-chip>
                      </div>
                      <div class="card-footer">
                        <span class="created-by">{{ report.creatorName }}</span>
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
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // Signals
  isLoading = signal(false);
  reports = signal<Report[]>([]);
  currentUserSignal = signal<any>(null);
  isReviewPage = signal(false);
  
  // Form
  filtersForm: FormGroup;

  // Computed
  currentUser = computed(() => {
    const user = this.currentUserSignal();
    console.log('Debug - currentUser computed:', user);
    return user;
  });

  // Role-based computed properties
  isGeneralStaff = computed(() => this.currentUser()?.role === UserRole.GeneralStaff);
  isLineManager = computed(() => this.currentUser()?.role === UserRole.LineManager);
  isExecutive = computed(() => this.currentUser()?.role === UserRole.Executive);

  filteredReports = computed(() => {
    const allReports = this.reports();
    const user = this.currentUser();
    
    console.log('Debug - All reports:', allReports);
    console.log('Debug - Current user:', user);
    console.log('Debug - Is review page:', this.isReviewPage());
    
    if (!user) {
      console.log('Debug - No user found');
      return [];
    }

    // For General Staff: Only show reports they created
    if (this.isGeneralStaff()) {
      const userFullName = `${user.firstName} ${user.lastName}`;
      console.log('Debug - User is general staff, filtering by creator:', userFullName);
      
      const userReports = allReports.filter(report => {
        const match = report.creatorName === userFullName;
        console.log(`Debug - Report "${report.title}" created by "${report.creatorName}", matches user "${userFullName}": ${match}`);
        return match;
      });
      
      console.log('Debug - Filtered user reports:', userReports);
      return userReports;
    }

    // For Line Managers: Show department reports that need their attention
    if (this.isLineManager()) {
      console.log('Debug - User is line manager, showing department reports needing attention');
      
      const departmentReports = allReports.filter(report => {
        const userFullName = `${user.firstName} ${user.lastName}`;
        const isOwnReport = report.creatorName === userFullName;
        
        if (this.isReviewPage()) {
          // On REVIEW page: Backend already filters correctly with signature-based logic
          // Trust the backend filtering - it shows reports that need attention AND previously reviewed reports
          console.log(`Debug - Review Page - Report "${report.title}" (${report.status}) - Include: true (backend filtered)`);
          return true; // Backend already filtered appropriately
        } else {
          // On DASHBOARD/MAIN page: Show ONLY their own reports (manager's personal reports)
          console.log(`Debug - Dashboard - Report "${report.title}" (${report.status}) - Include: ${isOwnReport} (own: ${isOwnReport})`);
          return isOwnReport;
        }
      });
      
      console.log('Debug - Filtered department reports:', departmentReports);
      return departmentReports;
    }

    // For Executives: Show ALL reports from ALL departments that need executive attention
    if (this.isExecutive()) {
      console.log('Debug - User is executive, showing ALL reports needing executive attention from ALL departments');
      
      const executiveReports = allReports.filter(report => {
        const userFullName = `${user.firstName} ${user.lastName}`;
        const isOwnReport = report.creatorName === userFullName;
        
        // Reports that need executive review from ALL departments:
        // Backend already filters appropriately, so we just need to show them
        // 1. Manager approved reports (from staff → manager → executive workflow)
        // 2. Line Manager submitted reports (backend filters by creator role)
        // 3. Reports already in executive review
        // 4. Completed reports (for historical view)
        const needsExecReview = report.status === ReportStatus.ManagerApproved ||
          report.status === ReportStatus.Submitted ||  // Backend ensures only LineManager submitted reports
          report.status === ReportStatus.ExecutiveReview ||
          report.status === ReportStatus.Completed;
        
        if (this.isReviewPage()) {
          // On REVIEW page: Show ALL reports from ALL departments that need executive attention
          // Include both own and other department reports since executive oversees everything
          const shouldShow = needsExecReview;
          console.log(`Debug - Executive Review Page - Report "${report.title}" (${report.status}, dept: ${report.department}) - Include: ${shouldShow} (needsReview: ${needsExecReview})`);
          return shouldShow;
        } else {
          // On DASHBOARD page: Show own reports plus ALL reports needing attention from ALL departments
          const shouldShow = isOwnReport || needsExecReview;
          console.log(`Debug - Executive Dashboard - Report "${report.title}" (${report.status}, dept: ${report.department}) - Include: ${shouldShow} (own: ${isOwnReport}, needsReview: ${needsExecReview})`);
          return shouldShow;
        }
      });
      
      console.log('Debug - Filtered executive reports (ALL departments):', executiveReports);
      return executiveReports;
    }

    // Fallback: no reports
    console.log('Debug - Unknown role, showing no reports');
    return [];
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
    // Subscribe to current user changes
    this.authService.currentUser$.subscribe(user => {
      console.log('Debug - Auth service user update:', user);
      this.currentUserSignal.set(user);
    });

    this.loadReports();
    
    // Check current route for review page
    const currentRoute = this.router.url;
    if (currentRoute.includes('/reports/review')) {
      console.log('Debug - On review page, applying review filters');
      this.isReviewPage.set(true);
      // For review page, we want to show only reports that need attention
      // This is already handled by the filteredReports computed property for Line Managers and Executives
    }
    
    // Handle query parameters from dashboard navigation
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'create') {
        // Auto-open create dialog
        setTimeout(() => this.createReport(), 100);
      }
      
      if (params['filter']) {
        this.applyPresetFilter(params['filter']);
      }
      
      if (params['status']) {
        this.filtersForm.patchValue({ status: params['status'] });
        this.applyFilters();
      }
    });
  }

  private async loadReports(): Promise<void> {
    this.isLoading.set(true);
    console.log('Debug - Starting to load reports...');
    
    try {
      const user = this.currentUser();
      if (!user) {
        console.error('Debug - No user found');
        return;
      }

      console.log('Debug - User found:', user);
      console.log('Debug - Calling reportsService.getReports()...');

      // Call actual API to get reports
      this.reportsService.getReports().subscribe({
        next: (response) => {
          console.log('Debug - API response received:', response);
          this.reports.set(response.reports || []);
          console.log('Debug - Reports set to:', this.reports());
        },
        error: (error) => {
          console.error('Debug - Error loading reports:', error);
          console.error('Debug - Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url
          });
          this.reports.set([]);
        }
      });
    } catch (error) {
      console.error('Debug - Catch error loading reports:', error);
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

  applyPresetFilter(filterType: string): void {
    switch (filterType) {
      case 'my-reports':
        // Filter applied through computed signal based on user role
        this.filtersForm.reset();
        break;
      case 'pending-reviews':
        this.filtersForm.patchValue({ 
          status: [ReportStatus.ManagerReview, ReportStatus.ExecutiveReview] 
        });
        break;
      case 'team-reports':
        // Filter will be applied automatically based on user role
        this.filtersForm.reset();
        break;
      default:
        this.filtersForm.reset();
    }
    this.applyFilters();
  }

  createReport(): void {
    const dialogRef = this.dialog.open(CreateReportComponent, {
      width: '600px',
      maxHeight: '90vh',
      disableClose: true,
      panelClass: 'create-report-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Report was created successfully, refresh the list
        this.loadReports();
      }
    });
  }

  viewReport(id: string): void {
    this.router.navigate(['/reports', id]);
  }

  editReport(id: string): void {
    console.log('Edit report:', id);
    alert(`Edit Report ${id} - functionality would be implemented here`);
  }

  deleteReport(id: string): void {
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
    if (report.creatorName === `${user.firstName} ${user.lastName}`) {
      return report.status === ReportStatus.Draft || report.status === ReportStatus.Rejected;
    }

    // Line managers can edit their team's reports in certain statuses
    if (user.role === UserRole.LineManager && report.department === user.department) {
      return report.status === ReportStatus.Submitted || 
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
    if (report.creatorName === `${user.firstName} ${user.lastName}`) {
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

  canSubmitReport(report: Report): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Only the creator can submit their own draft reports
    if (report.creatorName === `${user.firstName} ${user.lastName}`) {
      return report.status === ReportStatus.Draft;
    }

    return false;
  }

  submitReport(id: string): void {
    const report = this.reports().find(r => r.id === id);
    if (!report) return;

    console.log('Submitting report:', id);
    console.log('Report found:', report);
    console.log('Submit URL:', `${this.reportsService['apiUrl']}/${id}/submit`);

    this.reportsService.submitReport(id).subscribe({
      next: (updatedReport) => {
        console.log('Submit successful:', updatedReport);
        this.snackBar.open(
          `Report "${updatedReport.title}" submitted for Line Manager review successfully!`,
          'Close',
          { duration: 5000, panelClass: ['success-snackbar'] }
        );
        // Update the report in the local list
        const currentReports = this.reports();
        const updatedReports = currentReports.map(r => 
          r.id === id ? updatedReport : r
        );
        this.reports.set(updatedReports);
      },
      error: (error) => {
        console.error('Error submitting report:', error);
        console.error('Error details:', {
          status: error.status,
          statusText: error.statusText,
          url: error.url,
          message: error.message
        });
        this.snackBar.open(
          'Failed to submit report for review. Please try again.',
          'Close',
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  canApproveReport(report: Report): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Only Line Managers can approve reports from their department
    if (user.role === UserRole.LineManager) {
      return report.department === user.department && 
             report.status === ReportStatus.Submitted;
    }

    // Executives can approve:
    // 1. Manager-approved reports (from staff → manager → executive workflow)
    // 2. Line Manager submitted reports (direct manager → executive workflow)
    if (user.role === UserRole.Executive) {
      return report.status === ReportStatus.ManagerApproved ||
             report.status === ReportStatus.Submitted;  // Include Line Manager submitted reports
    }

    return false;
  }

  canRejectReport(report: Report): boolean {
    const user = this.currentUser();
    if (!user) return false;

    // Line Managers can reject submitted reports from their department
    if (user.role === UserRole.LineManager) {
      return report.department === user.department && 
             report.status === ReportStatus.Submitted;
    }

    // Executives can reject:
    // 1. Manager-approved reports (from staff → manager → executive workflow)
    // 2. Line Manager submitted reports (direct manager → executive workflow)
    if (user.role === UserRole.Executive) {
      return report.status === ReportStatus.ManagerApproved ||
             report.status === ReportStatus.Submitted;  // Include Line Manager submitted reports
    }

    return false;
  }

  approveReport(id: string): void {
    const report = this.reports().find(r => r.id === id);
    if (!report) return;

    // Open review dialog for approval
    const dialogRef = this.dialog.open(ReviewReportDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        report: report,
        action: 'approve'
      } as ReviewReportDialogData
    });

    dialogRef.afterClosed().subscribe((result: ReviewReportDialogResult) => {
      if (result && result.action === 'approve') {
        this.reportsService.approveReport(id, result.comments).subscribe({
          next: (response) => {
            this.snackBar.open(
              `Report approved successfully!`,
              'Close',
              { duration: 5000, panelClass: ['success-snackbar'] }
            );
            // Refresh the reports list to reflect the approval
            this.loadReports();
          },
          error: (error) => {
            console.error('Error approving report:', error);
            this.snackBar.open(
              'Failed to approve report. Please try again.',
              'Close',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
          }
        });
      }
    });
  }

  rejectReport(id: string): void {
    const report = this.reports().find(r => r.id === id);
    if (!report) return;

    // Open review dialog for rejection
    const dialogRef = this.dialog.open(ReviewReportDialogComponent, {
      width: '700px',
      maxHeight: '90vh',
      disableClose: true,
      data: {
        report: report,
        action: 'reject'
      } as ReviewReportDialogData
    });

    dialogRef.afterClosed().subscribe((result: ReviewReportDialogResult) => {
      if (result && result.action === 'reject') {
        this.reportsService.rejectReport(id, result.comments).subscribe({
          next: (response) => {
            this.snackBar.open(
              `Report rejected successfully!`,
              'Close',
              { duration: 5000, panelClass: ['success-snackbar'] }
            );
            // Refresh the reports list to reflect the rejection
            this.loadReports();
          },
          error: (error) => {
            console.error('Error rejecting report:', error);
            this.snackBar.open(
              'Failed to reject report. Please try again.',
              'Close',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
          }
        });
      }
    });
  }

  getStatusDisplay(status: ReportStatus): string {
    switch (status) {
      case ReportStatus.Draft: return 'Draft';
      case ReportStatus.Submitted: return 'Submitted';
      case ReportStatus.ManagerReview: return 'ManagerReview';
      case ReportStatus.ManagerApproved: return 'ManagerApproved';
      case ReportStatus.ExecutiveReview: return 'ExecutiveReview';
      case ReportStatus.Completed: return 'Completed';
      case ReportStatus.Rejected: return 'Rejected';
      case ReportStatus.ManagerRejected: return 'Rejected by Manager';
      case ReportStatus.ExecutiveRejected: return 'Rejected by Executive';
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
      case Department.ProjectSupport: return 'Project Support';
      case Department.DocManagement: return 'Document Management';
      case Department.QS: return 'QS';
      case Department.ContractsManagement: return 'Contracts Management';
      case Department.BusinessAssurance: return 'Business Assurance';
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

  getPriorityClass(priority: string | undefined): string {
    if (!priority) return 'priority-medium';
    return 'priority-' + priority.toLowerCase();
  }

  getPriorityDisplay(priority: string | undefined): string {
    return priority || 'Medium';
  }
}
