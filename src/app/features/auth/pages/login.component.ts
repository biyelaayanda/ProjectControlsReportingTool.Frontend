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
import { LoginRequest } from '../../../core/models/auth.models';

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
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-orient: vertical;
      -webkit-box-direction: normal;
      -ms-flex-direction: column;
      flex-direction: column;
      -webkit-box-pack: center;
      -ms-flex-pack: center;
      justify-content: center;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
      background: #2E86AB; /* Fallback for older browsers */
      background: -webkit-linear-gradient(315deg, #2E86AB 0%, #1976d2 50%, #ffffff 100%);
      background: -o-linear-gradient(315deg, #2E86AB 0%, #1976d2 50%, #ffffff 100%);
      background: linear-gradient(135deg, #2E86AB 0%, #1976d2 50%, #ffffff 100%);
      background-attachment: fixed;
    }

    .brand-header {
      text-align: center;
      margin-bottom: 32px;
      color: white;
    }

    .logo-container {
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-pack: center;
      -ms-flex-pack: center;
      justify-content: center;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      margin-bottom: 16px;
    }

    .brand-logo {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 16px;
      padding: 8px;
      -webkit-box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: block;
      margin-left: auto;
      margin-right: auto;
      -o-object-fit: contain;
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
      -webkit-box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      -webkit-box-pack: center;
      -ms-flex-pack: center;
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
      -webkit-box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.15);
      border-radius: 16px;
      background: rgba(255, 255, 255, 0.98);
      background: -webkit-rgba(255, 255, 255, 0.98);
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    mat-card-header {
      text-align: center;
      margin-bottom: 20px;
    }

    mat-card-title {
      display: -webkit-box;
      display: -ms-flexbox;
      display: flex;
      -webkit-box-align: center;
      -ms-flex-align: center;
      align-items: center;
      -webkit-box-pack: center;
      -ms-flex-pack: center;
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
  `]
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = signal(false);
  hidePassword = signal(true);
  showFallback = false;

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

  onImageError(event: any): void {
    this.showFallback = true;
  }

  onImageLoad(): void {
    this.showFallback = false;
  }

  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading()) {
      this.isLoading.set(true);
      
      const loginRequest: LoginRequest = this.loginForm.value;
      
      this.authService.login(loginRequest).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          this.snackBar.open('Login successful!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Redirect to reports after successful login
          this.router.navigate(['/reports']);
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
