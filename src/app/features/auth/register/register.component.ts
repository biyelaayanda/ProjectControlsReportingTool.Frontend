import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest, UserRole, Department } from '../../../core/models/auth.models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  template: `
    <div class="register-container">
      <mat-card class="register-card">
        <mat-card-header>
          <mat-card-title>Create Account</mat-card-title>
          <mat-card-subtitle>Join Project Controls Reporting Tool</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>First Name</mat-label>
                <input matInput formControlName="firstName" placeholder="First name">
                @if (registerForm.get('firstName')?.hasError('required') && registerForm.get('firstName')?.touched) {
                  <mat-error>First name is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Last Name</mat-label>
                <input matInput formControlName="lastName" placeholder="Last name">
                @if (registerForm.get('lastName')?.hasError('required') && registerForm.get('lastName')?.touched) {
                  <mat-error>Last name is required</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="email" placeholder="Enter your email">
              <mat-icon matSuffix>email</mat-icon>
              @if (registerForm.get('email')?.hasError('required') && registerForm.get('email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (registerForm.get('email')?.hasError('email') && registerForm.get('email')?.touched) {
                <mat-error>Please enter a valid email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput 
                     [type]="hidePassword() ? 'password' : 'text'" 
                     formControlName="password" 
                     placeholder="Create a password">
              <button mat-icon-button 
                      matSuffix 
                      (click)="togglePasswordVisibility()" 
                      type="button">
                <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              @if (registerForm.get('password')?.hasError('required') && registerForm.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
              @if (registerForm.get('password')?.hasError('minlength') && registerForm.get('password')?.touched) {
                <mat-error>Password must be at least 8 characters</mat-error>
              }
            </mat-form-field>

            <div class="form-row">
              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role" placeholder="Select role">
                  <mat-option [value]="UserRole.GeneralStaff">General Staff</mat-option>
                  <mat-option [value]="UserRole.Manager">Manager</mat-option>
                  <mat-option [value]="UserRole.Executive">Executive</mat-option>
                </mat-select>
                @if (registerForm.get('role')?.hasError('required') && registerForm.get('role')?.touched) {
                  <mat-error>Role is required</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="half-width">
                <mat-label>Department</mat-label>
                <mat-select formControlName="department" placeholder="Select department">
                  <mat-option [value]="Department.ProjectSupport">Project Support</mat-option>
                  <mat-option [value]="Department.Engineering">Engineering</mat-option>
                  <mat-option [value]="Department.QuantitySurveying">Quantity Surveying</mat-option>
                  <mat-option [value]="Department.ProjectManagement">Project Management</mat-option>
                  <mat-option [value]="Department.Executive">Executive</mat-option>
                </mat-select>
                @if (registerForm.get('department')?.hasError('required') && registerForm.get('department')?.touched) {
                  <mat-error>Department is required</mat-error>
                }
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Job Title</mat-label>
              <input matInput formControlName="jobTitle" placeholder="Your job title (optional)">
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Phone Number</mat-label>
              <input matInput formControlName="phoneNumber" placeholder="Your phone number (optional)">
            </mat-form-field>

            @if (errorMessage()) {
              <div class="error-message">
                <mat-icon>error</mat-icon>
                {{ errorMessage() }}
              </div>
            }

            <div class="register-actions">
              <button mat-raised-button 
                      color="primary" 
                      type="submit" 
                      [disabled]="registerForm.invalid || isLoading()"
                      class="register-button">
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  Creating Account...
                } @else {
                  Create Account
                }
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <div class="card-actions">
            <p>Already have an account? 
              <button mat-button 
                      color="primary" 
                      (click)="goToLogin()"
                      [disabled]="isLoading()">
                Sign in here
              </button>
            </p>
          </div>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .register-card {
      width: 100%;
      max-width: 500px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .form-row {
      display: flex;
      gap: 16px;
      width: 100%;
    }

    .half-width {
      flex: 1;
      margin-bottom: 16px;
    }

    .register-actions {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }

    .register-button {
      width: 100%;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #f44336;
      background-color: #ffebee;
      padding: 12px;
      border-radius: 4px;
      margin-bottom: 16px;
      font-size: 14px;
    }

    .card-actions {
      display: flex;
      justify-content: center;
      width: 100%;
    }

    mat-card-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 20px;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isLoading = signal(false);
  hidePassword = signal(true);
  errorMessage = signal('');

  // Export enums for template use
  UserRole = UserRole;
  Department = Department;

  registerForm: FormGroup = this.fb.group({
    firstName: ['', [Validators.required]],
    lastName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: [UserRole.GeneralStaff, [Validators.required]],
    department: [Department.ProjectSupport, [Validators.required]],
    jobTitle: [''],
    phoneNumber: ['']
  });

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

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
          if (response.success) {
            this.snackBar.open('Account created successfully!', 'Close', { duration: 3000 });
            this.router.navigate(['/dashboard']);
          } else {
            this.errorMessage.set(response.errorMessage || 'Registration failed');
          }
        },
        error: (error) => {
          this.errorMessage.set(error.error?.errorMessage || 'Registration failed. Please try again.');
          this.isLoading.set(false);
        },
        complete: () => {
          this.isLoading.set(false);
        }
      });
    }
  }

  togglePasswordVisibility(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
