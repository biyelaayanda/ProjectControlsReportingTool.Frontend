import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService } from '../../../core/services/auth.service';
import { LoginDto } from '../../../core/models/user.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>assignment</mat-icon>
            Project Controls Reporting
          </mat-card-title>
          <mat-card-subtitle>Sign in to your account</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
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
                  @if (loginForm.get('email')?.errors?.['required']) {
                    Email is required
                  }
                  @if (loginForm.get('email')?.errors?.['email']) {
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
                [attr.aria-label]="'Hide password'"
                [attr.aria-pressed]="hidePassword()"
              >
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (isFieldInvalid('password')) {
                <mat-error>
                  @if (loginForm.get('password')?.errors?.['required']) {
                    Password is required
                  }
                  @if (loginForm.get('password')?.errors?.['minlength']) {
                    Password must be at least 6 characters
                  }
                </mat-error>
              }
            </mat-form-field>

            <div class="form-actions">
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="loginForm.invalid || isLoading()"
                class="full-width"
              >
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  Signing in...
                } @else {
                  <ng-container>
                    <mat-icon>login</mat-icon>
                    Sign In
                  </ng-container>
                }
              </button>
            </div>

            <div class="form-footer">
              <p>Don't have an account? 
                <a routerLink="/register" class="link">Register here</a>
              </p>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      border-radius: 16px;
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

    .full-width {
      width: 100%;
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
      color: #1976d2;
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
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  hidePassword = signal(true);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      
      const loginDto: LoginDto = this.loginForm.value;
      
      this.authService.login(loginDto).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.snackBar.open('Login successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Redirect to dashboard after successful login
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.snackBar.open(error.message || 'Login failed. Please try again.', 'Close', {
            duration: 5000,
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
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
