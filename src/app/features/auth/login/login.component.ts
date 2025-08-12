import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
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

      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>
            <mat-icon>account_circle</mat-icon>
            Welcome Back
          </mat-card-title>
          <mat-card-subtitle>Sign in to access your dashboard</mat-card-subtitle>
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
                autocomplete="email"
                [class.is-invalid]="isFieldInvalid('email')"
              />
              <mat-icon matSuffix>email</mat-icon>
              <mat-error *ngIf="loginForm.get('email')?.hasError('required')">
                Email is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')">
                Please enter a valid email
              </mat-error>
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input
                matInput
                [type]="hidePassword ? 'password' : 'text'"
                formControlName="password"
                placeholder="Enter your password"
                autocomplete="current-password"
                [class.is-invalid]="isFieldInvalid('password')"
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
              <mat-error *ngIf="loginForm.get('password')?.hasError('required')">
                Password is required
              </mat-error>
              <mat-error *ngIf="loginForm.get('password')?.hasError('minlength')">
                Password must be at least 6 characters
              </mat-error>
            </mat-form-field>

            <div class="form-actions">
              <button
                mat-raised-button
                color="primary"
                type="submit"
                [disabled]="loginForm.invalid || isLoading"
                class="full-width"
              >
                <mat-spinner diameter="20" *ngIf="isLoading"></mat-spinner>
                <mat-icon *ngIf="!isLoading">login</mat-icon>
                <span *ngIf="!isLoading">Sign In</span>
                <span *ngIf="isLoading">Signing in...</span>
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

    .login-card {
      width: 100%;
      max-width: 400px;
      padding: 20px;
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.2);
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

    .form-footer p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }

    .link {
      color: #2E86AB;
      text-decoration: none;
      font-weight: 500;
    }

    .link:hover {
      text-decoration: underline;
    }

    button[mat-raised-button] {
      height: 48px;
      font-size: 16px;
      font-weight: 500;
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
      .brand-title {
        font-size: 2rem;
      }
      
      .brand-subtitle {
        font-size: 1rem;
      }
    }
  `]
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  loginForm: FormGroup;
  isLoading = false;
  hidePassword = true;
  showFallback = false;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onImageError(event: any): void {
    this.showFallback = true;
  }

  onImageLoad(): void {
    this.showFallback = false;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      
      const credentials: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          this.isLoading = false;
          if (response.success) {
            this.snackBar.open('Login successful!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            this.router.navigate(['/reports']);
          } else {
            this.snackBar.open(response.errorMessage || 'Login failed', 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Login error:', error);
          this.snackBar.open('An error occurred. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}
