import { Component, inject, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  requireInput?: boolean;
  inputLabel?: string;
  inputPlaceholder?: string;
  inputRequired?: boolean;
  type?: 'confirm' | 'approve' | 'reject';
}

export interface ConfirmationDialogResult {
  confirmed: boolean;
  inputValue?: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  template: `
    <div class="confirmation-dialog">
      <h2 mat-dialog-title>
        <mat-icon [class]="getIconClass()">{{ getIcon() }}</mat-icon>
        {{ data.title }}
      </h2>

      <mat-dialog-content>
        <p class="dialog-message">{{ data.message }}</p>
        
        @if (data.requireInput) {
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>{{ data.inputLabel || 'Comments' }}</mat-label>
            <textarea 
              matInput 
              [(ngModel)]="inputValue"
              [placeholder]="data.inputPlaceholder || 'Enter your comments...'"
              rows="3"
              maxlength="500">
            </textarea>
            <mat-hint>{{ inputValue.length }}/500 characters</mat-hint>
          </mat-form-field>
        }
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()">
          {{ data.cancelText }}
        </button>
        <button 
          mat-raised-button 
          [color]="getButtonColor()"
          (click)="onConfirm()"
          [disabled]="data.inputRequired && !inputValue.trim()">
          {{ data.confirmText }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      min-width: 400px;
      max-width: 600px;
    }

    .dialog-message {
      margin: 16px 0;
      line-height: 1.5;
      color: #666;
    }

    .full-width {
      width: 100%;
    }

    mat-dialog-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-dialog-title mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .icon-confirm {
      color: #1976d2;
    }

    .icon-approve {
      color: #4caf50;
    }

    .icon-reject {
      color: #f44336;
    }

    mat-dialog-actions {
      padding: 16px 0 0 0;
      margin: 0;
    }
  `]
})
export class ConfirmationDialogComponent {
  private dialogRef = inject(MatDialogRef<ConfirmationDialogComponent>);
  
  inputValue = '';

  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData) {}

  getIcon(): string {
    switch (this.data.type) {
      case 'approve': return 'check_circle';
      case 'reject': return 'cancel';
      default: return 'help_outline';
    }
  }

  getIconClass(): string {
    switch (this.data.type) {
      case 'approve': return 'icon-approve';
      case 'reject': return 'icon-reject';
      default: return 'icon-confirm';
    }
  }

  getButtonColor(): string {
    switch (this.data.type) {
      case 'approve': return 'primary';
      case 'reject': return 'warn';
      default: return 'primary';
    }
  }

  onCancel(): void {
    this.dialogRef.close({ confirmed: false });
  }

  onConfirm(): void {
    this.dialogRef.close({ 
      confirmed: true, 
      inputValue: this.inputValue.trim() || undefined 
    });
  }
}
