import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.models';
import { UserRole, Department } from '../../../core/models/enums';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="register-container">
      <div class="brand-header">
        <div class="logo-container">
          <img src="assets/randwater-logo.png" alt="Rand Water Logo" class="brand-logo"
               (error)="onImageError($event)" (load)="onImageLoad()" *ngIf="!showFallback">
          <div class="logo-fallback" *ngIf="showFallback">
            <mat-icon class="fallback-icon">water_drop</mat-icon>
          </div>
        </div>
        <h1 class="brand-title">Rand Water</h1>
        <p class="brand-subtitle">Project Controls Reporting Tool</p>
      </div>

      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>person_add</mat-icon>
            Join Our Team
          </mat-card-title>
          <mat-card-subtitle>Join our Project Controls team</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <!-- Personal Information -->
            <div class="form-section">
              <h3>Personal Information</h3>
              
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>First Name</mat-label>
                  <input
                    matInput
                    formControlName="firstName"
                    placeholder="Enter first name"
                    autocomplete="given-name"
                  />
                  <mat-error *ngIf="registerForm.get('firstName')?.hasError('required')">
                    First name is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Last Name</mat-label>
                  <input
                    matInput
                    formControlName="lastName"
                    placeholder="Enter last name"
                    autocomplete="family-name"
                  />
                  <mat-error *ngIf="registerForm.get('lastName')?.hasError('required')">
                    Last name is required
                  </mat-error>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input
                  matInput
                  type="email"
                  formControlName="email"
                  placeholder="Enter your email"
                  autocomplete="email"
                />
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="registerForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="registerForm.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Job Title</mat-label>
                <input
                  matInput
                  formControlName="jobTitle"
                  placeholder="Enter your job title"
                />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Phone Number</mat-label>
                <input
                  matInput
                  type="tel"
                  formControlName="phoneNumber"
                  placeholder="Enter your phone number"
                  autocomplete="tel"
                />
              </mat-form-field>
            </div>

            <!-- Department & Role -->
            <div class="form-section">
              <h3>Department & Role</h3>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Department</mat-label>
                <mat-select formControlName="department">
                  <mat-option *ngFor="let dept of departments" [value]="dept.value">
                    {{dept.name}}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="registerForm.get('department')?.hasError('required')">
                  Department is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role">
                  <mat-option *ngFor="let role of roles" [value]="role.value">
                    {{role.name}}
                  </mat-option>
                </mat-select>
                <mat-error *ngIf="registerForm.get('role')?.hasError('required')">
                  Role is required
                </mat-error>
              </mat-form-field>
            </div>

            <!-- Security -->
            <div class="form-section">
              <h3>Security</h3>
              
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input
                  matInput
                  [type]="hidePassword ? 'password' : 'text'"
                  formControlName="password"
                  placeholder="Enter your password"
                  autocomplete="new-password"
                />
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  (click)="hidePassword = !hidePassword"
                  [attr.aria-label]="'Hide password'"
                  [attr.aria-pressed]="hidePassword"
                >
                  <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="registerForm.get('password')?.hasError('required')">
                  Password is required
                </mat-error>
                <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')">
                  Password must be at least 8 characters
                </mat-error>
                <mat-error *ngIf="registerForm.get('password')?.hasError('pattern')">
                  Password must contain at least one uppercase letter, one lowercase letter, and one number
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm Password</mat-label>
                <input
                  matInput
                  [type]="hideConfirmPassword ? 'password' : 'text'"
                  formControlName="confirmPassword"
                  placeholder="Confirm your password"
                  autocomplete="new-password"
                />
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  (click)="hideConfirmPassword = !hideConfirmPassword"
                  [attr.aria-label]="'Hide password'"
                  [attr.aria-pressed]="hideConfirmPassword"
                >
                  <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="registerForm.get('confirmPassword')?.hasError('required')">
                  Please confirm your password
                </mat-error>
                <mat-error *ngIf="registerForm.hasError('passwordMismatch')">
                  Passwords do not match
                </mat-error>
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="registerForm.invalid || isLoading"
                class="full-width"
              >
                <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
                <span *ngIf="!isLoading">Create Account</span>
              </button>
            </div>

            <div class="form-footer">
              <p>Already have an account? 
                <a routerLink="/login" class="link">Sign in here</a>
              </p>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: #2E86AB; /* Fallback for older browsers */
      background: linear-gradient(135deg, #2E86AB 0%, #1976d2 50%, #ffffff 100%);
      background-attachment: fixed;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 32px;
      color: white;
    }

    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 16px;
    }

    .brand-logo {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: block;
      margin-left: auto;
      margin-right: auto;
      object-fit: contain;
      max-width: 100%;
      height: auto;
    }

    .logo-fallback {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 16px;
      padding: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .fallback-icon {
      font-size: 48px !important;
      color: #2E86AB;
      width: 48px;
      height: 48px;
    }

    .brand-title {
      font-size: 2.5rem;
      font-weight: 600;
      margin: 0 0 8px 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    }

    .brand-subtitle {
      font-size: 1.1rem;
      font-weight: 300;
      margin: 0;
      opacity: 0.9;
    }

    .register-card {
      width: 100%;
      max-width: 600px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    mat-card-header {
      text-align: center;
      padding-bottom: 16px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 24px;
      margin-bottom: 8px;
      color: #333;
    }

    mat-card-title mat-icon {
      color: #2E86AB;
    }

    mat-card-subtitle {
      color: #666;
      margin-top: 8px;
    }

    .form-section {
      margin-bottom: 24px;
    }

    .form-section h3 {
      color: #333;
      font-size: 18px;
      margin: 0 0 16px 0;
      font-weight: 500;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .half-width {
      flex: 1;
      margin-bottom: 16px;
    }

    .form-actions {
      margin-top: 32px;
      margin-bottom: 16px;
    }

    .form-footer {
      text-align: center;
      margin-top: 16px;
    }

    .form-footer p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }

    .form-footer a {
      color: #2E86AB;
      text-decoration: none;
      font-weight: 500;
    }

    .form-footer a:hover {
      text-decoration: underline;
    }

    mat-spinner {
      margin-right: 8px;
    }

    button[mat-raised-button] {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .half-width {
        width: 100%;
      }

      .brand-title {
        font-size: 2rem;
      }
      
      .brand-subtitle {
        font-size: 1rem;
      }
    }
  `]
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  registerForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  hideConfirmPassword = true;
  showFallback = false;

  departments = [
    { value: Department.ProjectSupport, name: 'Project Support' },
    { value: Department.DocManagement, name: 'Document Management' },
    { value: Department.QS, name: 'Quantity Surveying (QS)' },
    { value: Department.ContractsManagement, name: 'Contracts Management' },
    { value: Department.BusinessAssurance, name: 'Business Assurance' }
  ];

  roles = [
    { value: UserRole.GeneralStaff, name: 'General Staff' },
    { value: UserRole.LineManager, name: 'Line Manager' },
    { value: UserRole.Executive, name: 'Executive' }
  ];

  constructor() {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      jobTitle: [''],
      phoneNumber: [''],
      department: ['', Validators.required],
      role: ['', Validators.required],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  onImageError(event: any): void {
    this.showFallback = true;
  }

  onImageLoad(): void {
    this.showFallback = false;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const userData: RegisterRequest = {
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        firstName: this.registerForm.value.firstName,
        lastName: this.registerForm.value.lastName,
        role: this.registerForm.value.role,
        department: this.registerForm.value.department,
        jobTitle: this.registerForm.value.jobTitle || undefined,
        phoneNumber: this.registerForm.value.phoneNumber || undefined
      };

      this.authService.register(userData).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.snackBar.open('Account created successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/reports']);
          } else {
            this.snackBar.open(response.errorMessage || 'Registration failed', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Registration error:', error);
          this.snackBar.open('An error occurred. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}
