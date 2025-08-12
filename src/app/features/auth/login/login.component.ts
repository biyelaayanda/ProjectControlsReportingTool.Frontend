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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models/auth.models';

@Component({
  selector: 'app-login',
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
    MatSnackBarModule
  ],
  template: `
    <div class="login-container">
      <mat-card class="login-card">
        <mat-card-header>
          <mat-card-title>Project Controls Reporting Tool</mat-card-title>
          <mat-card-subtitle>Sign in to your account</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Email</mat-label>
              <input matInput 
                     type="email" 
                     formControlName="email" 
                     placeholder="Enter your email"
                     autocomplete="email">
              <mat-icon matSuffix>email</mat-icon>
              @if (loginForm.get('email')?.hasError('required') && loginForm.get('email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (loginForm.get('email')?.hasError('email') && loginForm.get('email')?.touched) {
                <mat-error>Please enter a valid email</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Password</mat-label>
              <input matInput 
                     [type]="hidePassword() ? 'password' : 'text'" 
                     formControlName="password" 
                     placeholder="Enter your password"
                     autocomplete="current-password">
              <button mat-icon-button 
                      matSuffix 
                      (click)="togglePasswordVisibility()" 
                      type="button"
                      [attr.aria-label]="'Hide password'" 
                      [attr.aria-pressed]="hidePassword()">
                <mat-icon>{{hidePassword() ? 'visibility_off' : 'visibility'}}</mat-icon>
              </button>
              @if (loginForm.get('password')?.hasError('required') && loginForm.get('password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
            </mat-form-field>

            @if (errorMessage()) {
              <div class="error-message">
                <mat-icon>error</mat-icon>
                {{ errorMessage() }}
              </div>
            }

            <div class="login-actions">
              <button mat-raised-button 
                      color="primary" 
                      type="submit" 
                      [disabled]="loginForm.invalid || isLoading()"
                      class="login-button">
                @if (isLoading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                  Signing in...
                } @else {
                  Sign In
                }
              </button>
            </div>
          </form>
        </mat-card-content>

        <mat-card-actions>
          <div class="card-actions">
            <p>Don't have an account? 
              <button mat-button 
                      color="primary" 
                      (click)="goToRegister()"
                      [disabled]="isLoading()">
                Register here
              </button>
            </p>
          </div>
        </mat-card-actions>
      </mat-card>

      <!-- Demo Credentials Helper -->
      <mat-card class="demo-card">
        <mat-card-header>
          <mat-card-title>Demo Credentials</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div class="demo-accounts">
            <div class="demo-account" (click)="fillDemoCredentials('admin@test.com', 'Password123!')">
              <strong>Admin Account</strong>
              <small>admin@test.com / Password123!</small>
            </div>
            <div class="demo-account" (click)="fillDemoCredentials('manager@test.com', 'Password123!')">
              <strong>Manager Account</strong>
              <small>manager@test.com / Password123!</small>
            </div>
            <div class="demo-account" (click)="fillDemoCredentials('staff@test.com', 'Password123!')">
              <strong>Staff Account</strong>
              <small>staff@test.com / Password123!</small>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .login-card {
      width: 100%;
      max-width: 400px;
      margin-bottom: 20px;
    }

    .demo-card {
      width: 100%;
      max-width: 400px;
    }

    .full-width {
      width: 100%;
      margin-bottom: 16px;
    }

    .login-actions {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }

    .login-button {
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

    .demo-accounts {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .demo-account {
      padding: 8px 12px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .demo-account:hover {
      background-color: #f5f5f5;
    }

    .demo-account strong {
      display: block;
      color: #333;
    }

    .demo-account small {
      color: #666;
      font-size: 12px;
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
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  isLoading = signal(false);
  hidePassword = signal(true);
  errorMessage = signal('');

  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor() {
    // Check if user is already authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const credentials: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

      this.authService.login(credentials).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackBar.open('Login successful!', 'Close', { duration: 3000 });
            
            // Redirect to the originally requested URL or dashboard
            const redirectUrl = sessionStorage.getItem('redirectUrl') || '/dashboard';
            sessionStorage.removeItem('redirectUrl');
            this.router.navigate([redirectUrl]);
          } else {
            this.errorMessage.set(response.errorMessage || 'Login failed');
          }
        },
        error: (error) => {
          this.errorMessage.set(error.error?.errorMessage || 'Login failed. Please try again.');
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

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  fillDemoCredentials(email: string, password: string): void {
    this.loginForm.patchValue({
      email: email,
      password: password
    });
  }
}
