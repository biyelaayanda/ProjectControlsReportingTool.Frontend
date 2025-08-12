import { Component, inject, signal, computed, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { toSignal } from '@angular/core/rxjs-interop';

import { ReportsService, CreateReportDto } from '../../../core/services/reports.service';
import { AuthService } from '../../../core/services/auth.service';
import { Department, UserRole } from '../../../core/models/enums';

@Component({
  selector: 'app-create-report',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="create-report-dialog">
      <h2 mat-dialog-title>
        <mat-icon>add</mat-icon>
        Create New Report
      </h2>

      <mat-dialog-content>
        <form [formGroup]="reportForm" class="report-form">
          <!-- Title -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Report Title</mat-label>
            <input 
              matInput 
              formControlName="title"
              placeholder="Enter a descriptive title for your report"
              maxlength="200">
            <mat-hint>Required - Maximum 200 characters</mat-hint>
            <mat-error *ngIf="reportForm.get('title')?.hasError('required')">
              Title is required
            </mat-error>
            <mat-error *ngIf="reportForm.get('title')?.hasError('minlength')">
              Title must be at least 5 characters long
            </mat-error>
          </mat-form-field>

          <!-- Type -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Report Type</mat-label>
            <mat-select formControlName="type">
              <mat-option value="Weekly Progress">Weekly Progress</mat-option>
              <mat-option value="Monthly Summary">Monthly Summary</mat-option>
              <mat-option value="Project Status">Project Status</mat-option>
              <mat-option value="Risk Assessment">Risk Assessment</mat-option>
              <mat-option value="Budget Analysis">Budget Analysis</mat-option>
              <mat-option value="Quality Assurance">Quality Assurance</mat-option>
              <mat-option value="Contract Review">Contract Review</mat-option>
              <mat-option value="Compliance Check">Compliance Check</mat-option>
              <mat-option value="Other">Other</mat-option>
            </mat-select>
            <mat-hint>Select the type of report you're creating</mat-hint>
            <mat-error *ngIf="reportForm.get('type')?.hasError('required')">
              Report type is required
            </mat-error>
          </mat-form-field>

          <!-- Department -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Department</mat-label>
            <mat-select formControlName="department">
              <mat-option 
                *ngFor="let dept of availableDepartments()" 
                [value]="dept.value">
                {{ dept.label }}
              </mat-option>
            </mat-select>
            <mat-hint>
              {{ canSelectDepartment() ? 'Select the department this report is for' : 'Department is automatically set based on your role' }}
            </mat-hint>
            <mat-error *ngIf="reportForm.get('department')?.hasError('required')">
              Department is required
            </mat-error>
          </mat-form-field>

          <!-- Priority -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              <mat-option value="Low">Low</mat-option>
              <mat-option value="Medium">Medium</mat-option>
              <mat-option value="High">High</mat-option>
              <mat-option value="Critical">Critical</mat-option>
            </mat-select>
            <mat-hint>Set the priority level for this report</mat-hint>
            <mat-error *ngIf="reportForm.get('priority')?.hasError('required')">
              Priority is required
            </mat-error>
          </mat-form-field>

          <!-- Due Date -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Due Date (Optional)</mat-label>
            <input 
              matInput 
              [matDatepicker]="picker"
              formControlName="dueDate"
              readonly>
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-hint>When should this report be completed?</mat-hint>
            <mat-error *ngIf="reportForm.get('dueDate')?.hasError('pastDate')">
              Due date cannot be in the past
            </mat-error>
          </mat-form-field>

          <!-- Description -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Description</mat-label>
            <textarea 
              matInput 
              formControlName="description"
              placeholder="Provide a detailed description of the report purpose, scope, and any specific requirements..."
              rows="4"
              maxlength="1000">
            </textarea>
            <mat-hint>Optional - Provide additional context (maximum 1000 characters)</mat-hint>
          </mat-form-field>

          <!-- Content Section -->
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Initial Content</mat-label>
            <textarea 
              matInput 
              formControlName="content"
              placeholder="Enter the initial content for your report. You can expand on this later..."
              rows="6"
              maxlength="5000">
            </textarea>
            <mat-hint>Optional - Add initial report content (maximum 5000 characters)</mat-hint>
          </mat-form-field>
        </form>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" [disabled]="isSubmitting()">
          Cancel
        </button>
        <button 
          mat-raised-button 
          color="primary" 
          (click)="onSubmit()"
          [disabled]="reportForm.invalid || isSubmitting()">
          @if (isSubmitting()) {
            <mat-spinner diameter="20" class="inline-spinner"></mat-spinner>
            Creating...
          } @else {
            <ng-container>
              <mat-icon>save</mat-icon>
              Create Report
            </ng-container>
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .create-report-dialog {
      width: 100%;
      max-width: 600px;
    }

    .report-form {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px 0;
    }

    .full-width {
      width: 100%;
    }

    .priority-option {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .priority-option.low {
      color: #4caf50;
    }

    .priority-option.medium {
      color: #ff9800;
    }

    .priority-option.high {
      color: #f44336;
    }

    .priority-option.critical {
      color: #d32f2f;
      font-weight: 500;
    }

    .inline-spinner {
      margin-right: 8px;
    }

    mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #1976d2;
    }

    mat-dialog-content {
      max-height: 70vh;
      overflow-y: auto;
    }

    mat-form-field {
      margin-bottom: 8px;
    }

    .mat-mdc-form-field-hint,
    .mat-mdc-form-field-error {
      font-size: 0.75rem;
    }

    textarea {
      resize: vertical;
      min-height: 60px;
    }
  `]
})
export class CreateReportComponent implements OnInit {
  private fb = inject(FormBuilder);
  private reportsService = inject(ReportsService);
  private authService = inject(AuthService);
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject(MatDialogRef<CreateReportComponent>);

  isSubmitting = signal(false);
  
  // Get current user info as a proper signal
  private currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  reportForm: FormGroup;

  constructor() {
    this.reportForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5)]],
      type: ['', Validators.required],
      department: [Department.ProjectSupport, Validators.required], // Use default until user loads
      priority: ['Medium', Validators.required],
      dueDate: ['', this.futureDateValidator],
      description: [''],
      content: ['', Validators.required]
    });

    // Effect to handle user loading and update form accordingly
    effect(() => {
      const user = this.currentUser();
      console.log('Effect triggered - User:', user);
      if (user) {
        // Update department to user's department if not an executive
        if (user.role !== UserRole.Executive) {
          const defaultDept = user.department || Department.ProjectSupport;
          console.log('Setting department for non-executive to:', defaultDept);
          this.reportForm.get('department')?.setValue(defaultDept);
        } else {
          console.log('User is executive, keeping current department value');
        }
        
        // Update department control state
        this.updateDepartmentControlState();
      } else {
        console.log('No user loaded yet');
      }
    });
  }

  ngOnInit() {
    // Component initialization complete
  }

  private updateDepartmentControlState() {
    const departmentControl = this.reportForm.get('department');
    if (departmentControl) {
      if (this.canSelectDepartment()) {
        departmentControl.enable();
      } else {
        departmentControl.disable();
      }
    }
  }

  // Department logic - converted to computed signals to prevent infinite loops
  canSelectDepartment = computed(() => {
    const user = this.currentUser();
    return user?.role === UserRole.Executive;
  });

  availableDepartments = computed(() => {
    const user = this.currentUser();
    
    if (user?.role === UserRole.Executive) {
      // Executives can create reports for any department
      return [
        { value: Department.ProjectSupport, label: 'Project Support' },
        { value: Department.DocManagement, label: 'Document Management' },
        { value: Department.QS, label: 'QS' },
        { value: Department.ContractsManagement, label: 'Contracts Management' },
        { value: Department.BusinessAssurance, label: 'Business Assurance' }
      ];
    } else {
      // Staff and Line Managers can only create for their department
      return [{ 
        value: user?.department || Department.ProjectSupport, 
        label: this.getDepartmentLabel(user?.department || Department.ProjectSupport) 
      }];
    }
  });

  private getDefaultDepartment(): Department {
    const user = this.currentUser();
    return user?.department || Department.ProjectSupport;
  }

  private getDepartmentLabel(department: Department): string {
    switch (department) {
      case Department.ProjectSupport: return 'Project Support';
      case Department.DocManagement: return 'Document Management';
      case Department.QS: return 'QS';
      case Department.ContractsManagement: return 'Contracts Management';
      case Department.BusinessAssurance: return 'Business Assurance';
      default: return 'Unknown Department';
    }
  }

  // Date validator
  private futureDateValidator(control: any) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return selectedDate < today ? { pastDate: true } : null;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    console.log('Form submission started');
    console.log('Form valid:', this.reportForm.valid);
    console.log('Form value:', this.reportForm.value);
    console.log('Department control value:', this.reportForm.get('department')?.value);
    console.log('Current user:', this.currentUser());
    
    if (this.reportForm.valid && !this.isSubmitting()) {
      this.isSubmitting.set(true);

      const formValue = this.reportForm.value;
      const createDto: CreateReportDto = {
        title: formValue.title,
        content: formValue.content || '',
        description: formValue.description || undefined,
        type: formValue.type || undefined,
        priority: formValue.priority,
        dueDate: formValue.dueDate || undefined,
        department: formValue.department
      };

      console.log('Creating report with data:', createDto);

      this.reportsService.createReport(createDto).subscribe({
        next: (report) => {
          this.snackBar.open(
            `Report "${report.title}" created successfully!`,
            'Close',
            { duration: 5000, panelClass: ['success-snackbar'] }
          );
          this.dialogRef.close(report);
        },
        error: (error) => {
          console.error('Error creating report:', error);
          this.snackBar.open(
            'Failed to create report. Please try again.',
            'Close',
            { duration: 5000, panelClass: ['error-snackbar'] }
          );
          this.isSubmitting.set(false);
        }
      });
    }
  }
}
