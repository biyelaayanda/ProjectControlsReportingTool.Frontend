import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models/auth.models';
import { UserRole, Department } from '../../../core/models/enums';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
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
            Create Account
          </mat-card-title>
          <mat-card-subtitle>Join our Project Controls team</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>First Name</mat-label>
                <input
                  matInput
                  formControlName="firstName"
                  placeholder="Enter first name"
                  [class.is-invalid]="isFieldInvalid('firstName')"
                />
                @if (isFieldInvalid('firstName')) {
                  <mat-error>First name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Last Name</mat-label>
                <input
                  matInput
                  formControlName="lastName"
                  placeholder="Enter last name"
                  [class.is-invalid]="isFieldInvalid('lastName')"
                />
                @if (isFieldInvalid('lastName')) {
                  <mat-error>Last name is required</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="Enter your email"
                [class.is-invalid]="isFieldInvalid('email')"
              />
              <mat-icon matSuffix>email</mat-icon>
              @if (isFieldInvalid('email')) {
                <mat-error>
                  @if (registerForm.get('email')?.errors?.['required']) {
                    Email is required
                  }
                  @if (registerForm.get('email')?.errors?.['email']) {
                    Please enter a valid email
                  }
                </mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hidePassword() ? 'password' : 'text'"
                formControlName="password"
                placeholder="Enter your password"
                [class.is-invalid]="isFieldInvalid('password')"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="togglePasswordVisibility()"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (isFieldInvalid('password')) {
                <mat-error>
                  @if (registerForm.get('password')?.errors?.['required']) {
                    Password is required
                  }
                  @if (registerForm.get('password')?.errors?.['minlength']) {
                    Password must be at least 6 characters
                  }
                </mat-error>
              }
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role" [class.is-invalid]="isFieldInvalid('role')">
                  <mat-option [value]="UserRole.GeneralStaff">General Staff</mat-option>
                  <mat-option [value]="UserRole.LineManager">Line Manager</mat-option>
                  <mat-option [value]="UserRole.Executive">Executive</mat-option>
                </mat-select>
                @if (isFieldInvalid('role')) {
                  <mat-error>Role is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Department</mat-label>
                <mat-select formControlName="department" [class.is-invalid]="isFieldInvalid('department')">
                  <mat-option [value]="Department.ProjectSupport">Project Support</mat-option>
                  <mat-option [value]="Department.DocManagement">Doc Management</mat-option>
                  <mat-option [value]="Department.QS">QS</mat-option>
                  <mat-option [value]="Department.ContractsManagement">Contracts Management</mat-option>
                  <mat-option [value]="Department.BusinessAssurance">Business Assurance</mat-option>
                </mat-select>
                @if (isFieldInvalid('department')) {
                  <mat-error>Department is required</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone Number (Optional)</mat-label>
              <input
                matInput
                formControlName="phoneNumber"
                placeholder="Enter phone number"
              />
              <mat-icon matSuffix>phone</mat-icon>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Job Title (Optional)</mat-label>
              <input
                matInput
                formControlName="jobTitle"
                placeholder="Enter job title"
              />
              <mat-icon matSuffix>work</mat-icon>
            </mat-form-field>

            <div class="form-actions">
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="registerForm.invalid || isLoading()"
                class="full-width"
              >
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  Creating Account...
                } @else {
                  <ng-container>
                    <mat-icon>person_add</mat-icon>
                    Create Account
                  </ng-container>
                }
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
      background: linear-gradient(135deg, #2E86AB 0%, #1976d2 50%, #ffffff 100%);
    }

    .brand-header {
      text-align: center;
      margin-bottom: 32px;
      color: white;
    }

    .brand-logo {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 16px;
      padding: 8px;
      margin-bottom: 16px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
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
      max-width: 500px;
      padding: 20px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 20px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 1.5rem;
      color: #333;
    }

    mat-card-subtitle {
      color: #666;
      margin-top: 8px;
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
      margin: 24px 0 16px 0;
    }

    .form-footer {
      text-align: center;
      margin-top: 16px;
    }

    .link {
      color: #2E86AB;
      text-decoration: none;
      font-weight: 500;
    }

    .link:hover {
      text-decoration: underline;
    }

    button[disabled] {
      opacity: 0.6;
    }

    mat-spinner {
      margin-right: 8px;
    }

    .is-invalid {
      border-color: #f44336;
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
      
      .half-width {
        width: 100%;
      }
    }
  `]
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  hidePassword = signal(true);
  showFallback = false;
  
  // Expose enums to template
  UserRole = UserRole;
  Department = Department;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['', [Validators.required]],
      department: ['', [Validators.required]],
      phoneNumber: [''],
      jobTitle: ['']
    });
  }

  onImageError(event: any): void {
    this.showFallback = true;
  }

  onImageLoad(): void {
    this.showFallback = false;
  }

  onSubmit(): void {
    if (this.registerForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      
      const registerRequest: RegisterRequest = this.registerForm.value;
      
      this.authService.register(registerRequest).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          
          // Check if registration was successful (has token and user)
          if (response.token && response.user && !response.errorMessage) {
            this.snackBar.open('Registration successful! Please login with your credentials.', 'Close', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            
            // Redirect to login page after successful registration
            this.router.navigate(['/login'], { 
              queryParams: { 
                message: 'Registration successful! Please login with your new account.' 
              }
            });
          } else {
            // Handle registration failure from response
            const errorMessage = response.errorMessage || 'Registration failed. Please try again.';
            this.snackBar.open(errorMessage, 'Close', {
              duration: 8000,
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          console.error('Registration error:', error);
          
          let errorMessage = 'Registration failed. Please try again.';
          
          // Handle specific error messages from the backend
          if (error.error?.message) {
            switch (error.error.message) {
              case 'Email already exists':
                errorMessage = 'This email is already registered. Please use a different email or try logging in.';
                break;
              case 'Invalid email format':
                errorMessage = 'Please enter a valid email address.';
                break;
              case 'Password does not meet requirements':
                errorMessage = 'Password must be at least 6 characters long.';
                break;
              default:
                errorMessage = error.error.message;
            }
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.snackBar.open(errorMessage, 'Close', {
            duration: 8000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
