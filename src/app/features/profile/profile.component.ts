import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { AuthService } from '../../core/services/auth.service';
import { User, UpdateProfileRequest, ChangePasswordRequest } from '../../core/models/auth.models';
import { UserRole, Department } from '../../core/models/enums';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatChipsModule
  ],
  template: `
    <div class="profile-container">
      <div class="profile-header">
        <mat-card class="profile-summary-card">
          <mat-card-content>
            <div class="profile-avatar">
              <mat-icon class="avatar-icon">account_circle</mat-icon>
            </div>
            <div class="profile-basic-info">
              <h2>{{currentUser()?.firstName}} {{currentUser()?.lastName}}</h2>
              <p class="job-title">{{currentUser()?.jobTitle || 'No job title set'}}</p>
              <mat-chip-set>
                <mat-chip>{{getRoleName()}}</mat-chip>
                <mat-chip>{{getDepartmentName()}}</mat-chip>
              </mat-chip-set>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="profile-content">
        <!-- Profile Information -->
        <mat-card class="profile-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>person</mat-icon>
              Profile Information
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
              <div class="form-row">
                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>First Name</mat-label>
                  <input matInput formControlName="firstName" />
                  <mat-error *ngIf="profileForm.get('firstName')?.hasError('required')">
                    First name is required
                  </mat-error>
                </mat-form-field>

                <mat-form-field appearance="outline" class="half-width">
                  <mat-label>Last Name</mat-label>
                  <input matInput formControlName="lastName" />
                  <mat-error *ngIf="profileForm.get('lastName')?.hasError('required')">
                    Last name is required
                  </mat-error>
                </mat-form-field>
              </div>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" readonly />
                <mat-hint>Email cannot be changed</mat-hint>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Job Title</mat-label>
                <input matInput formControlName="jobTitle" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Phone Number</mat-label>
                <input matInput formControlName="phoneNumber" />
              </mat-form-field>

              <div class="form-actions">
                <button
                  mat-raised-button
                  color="primary"
                  type="submit"
                  [disabled]="profileForm.invalid || isUpdatingProfile"
                >
                  <mat-spinner diameter="20" *ngIf="isUpdatingProfile"></mat-spinner>
                  <span *ngIf="!isUpdatingProfile">Update Profile</span>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Change Password -->
        <mat-card class="profile-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>lock</mat-icon>
              Change Password
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Current Password</mat-label>
                <input
                  matInput
                  [type]="hideCurrentPassword ? 'password' : 'text'"
                  formControlName="currentPassword"
                />
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  (click)="hideCurrentPassword = !hideCurrentPassword"
                >
                  <mat-icon>{{hideCurrentPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="passwordForm.get('currentPassword')?.hasError('required')">
                  Current password is required
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>New Password</mat-label>
                <input
                  matInput
                  [type]="hideNewPassword ? 'password' : 'text'"
                  formControlName="newPassword"
                />
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  (click)="hideNewPassword = !hideNewPassword"
                >
                  <mat-icon>{{hideNewPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('required')">
                  New password is required
                </mat-error>
                <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('minlength')">
                  Password must be at least 8 characters
                </mat-error>
                <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('pattern')">
                  Password must contain uppercase, lowercase, and number
                </mat-error>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Confirm New Password</mat-label>
                <input
                  matInput
                  [type]="hideConfirmPassword ? 'password' : 'text'"
                  formControlName="confirmNewPassword"
                />
                <button
                  mat-icon-button
                  matSuffix
                  type="button"
                  (click)="hideConfirmPassword = !hideConfirmPassword"
                >
                  <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="passwordForm.get('confirmNewPassword')?.hasError('required')">
                  Please confirm your new password
                </mat-error>
                <mat-error *ngIf="passwordForm.hasError('passwordMismatch')">
                  Passwords do not match
                </mat-error>
              </mat-form-field>

              <div class="form-actions">
                <button
                  mat-raised-button
                  color="warn"
                  type="submit"
                  [disabled]="passwordForm.invalid || isChangingPassword"
                >
                  <mat-spinner diameter="20" *ngIf="isChangingPassword"></mat-spinner>
                  <span *ngIf="!isChangingPassword">Change Password</span>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>

        <!-- Account Information -->
        <mat-card class="profile-card">
          <mat-card-header>
            <mat-card-title>
              <mat-icon>info</mat-icon>
              Account Information
            </mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            <div class="info-item">
              <strong>Role:</strong> {{getRoleName()}}
            </div>
            <div class="info-item">
              <strong>Department:</strong> {{getDepartmentName()}}
            </div>
            <div class="info-item">
              <strong>Account Status:</strong> 
              <mat-chip [color]="currentUser()?.isActive ? 'primary' : 'warn'" selected>
                {{currentUser()?.isActive ? 'Active' : 'Inactive'}}
              </mat-chip>
            </div>
            <div class="info-item">
              <strong>Member Since:</strong> {{formatDate(currentUser()?.createdDate)}}
            </div>
            <div class="info-item" *ngIf="currentUser()?.lastLoginDate">
              <strong>Last Login:</strong> {{formatDate(currentUser()?.lastLoginDate)}}
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    }

    .profile-header {
      margin-bottom: 24px;
    }

    .profile-summary-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .profile-summary-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 24px;
      padding: 32px;
    }

    .profile-avatar {
      flex-shrink: 0;
    }

    .avatar-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      opacity: 0.9;
    }

    .profile-basic-info h2 {
      margin: 0 0 8px 0;
      font-size: 28px;
      font-weight: 500;
    }

    .job-title {
      margin: 0 0 16px 0;
      opacity: 0.9;
      font-size: 16px;
    }

    .profile-content {
      display: grid;
      gap: 24px;
      grid-template-columns: 1fr 1fr;
    }

    .profile-card {
      height: fit-content;
    }

    .profile-card:last-child {
      grid-column: 1 / -1;
    }

    mat-card-header {
      margin-bottom: 16px;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
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
      margin-top: 24px;
    }

    .info-item {
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .info-item strong {
      min-width: 140px;
    }

    @media (max-width: 768px) {
      .profile-content {
        grid-template-columns: 1fr;
      }

      .profile-summary-card mat-card-content {
        flex-direction: column;
        text-align: center;
      }

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
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  currentUser = this.authService.currentUser;
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  isUpdatingProfile = false;
  isChangingPassword = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor() {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{value: '', disabled: true}],
      jobTitle: [''],
      phoneNumber: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      ]],
      confirmNewPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Populate form with current user data
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        jobTitle: user.jobTitle || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmNewPassword = form.get('confirmNewPassword');
    
    if (newPassword && confirmNewPassword && newPassword.value !== confirmNewPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  updateProfile(): void {
    if (this.profileForm.valid && !this.isUpdatingProfile) {
      this.isUpdatingProfile = true;
      
      const updateData: UpdateProfileRequest = {
        firstName: this.profileForm.value.firstName,
        lastName: this.profileForm.value.lastName,
        jobTitle: this.profileForm.value.jobTitle || undefined,
        phoneNumber: this.profileForm.value.phoneNumber || undefined
      };

      this.authService.updateProfile(updateData).subscribe({
        next: (user: User) => {
          this.isUpdatingProfile = false;
          this.snackBar.open('Profile updated successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error: any) => {
          this.isUpdatingProfile = false;
          console.error('Profile update error:', error);
          this.snackBar.open('An error occurred. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  changePassword(): void {
    if (this.passwordForm.valid && !this.isChangingPassword) {
      this.isChangingPassword = true;
      
      const passwordData: ChangePasswordRequest = {
        currentPassword: this.passwordForm.value.currentPassword,
        newPassword: this.passwordForm.value.newPassword
      };

      this.authService.changePassword(passwordData).subscribe({
        next: () => {
          this.isChangingPassword = false;
          this.passwordForm.reset();
          this.snackBar.open('Password changed successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error: any) => {
          this.isChangingPassword = false;
          console.error('Password change error:', error);
          this.snackBar.open('An error occurred. Please try again.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  getRoleName(): string {
    const role = this.currentUser()?.role;
    switch (role) {
      case UserRole.GM: return 'GM';
      case UserRole.LineManager: return 'Line Manager';
      case UserRole.GeneralStaff: return 'General Staff';
      default: return 'Unknown';
    }
  }

  getDepartmentName(): string {
    const dept = this.currentUser()?.department;
    switch (dept) {
      case Department.ProjectSupport: return 'Project Support';
      case Department.DocManagement: return 'Document Management';
      case Department.QS: return 'Quantity Surveying';
      case Department.ContractsManagement: return 'Contracts Management';
      case Department.BusinessAssurance: return 'Business Assurance';
      default: return 'Unknown';
    }
  }

  formatDate(date?: Date): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
}
