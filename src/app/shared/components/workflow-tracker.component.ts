import { Component, input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { ReportStatus, UserRole } from '../../core/models/enums';

export interface WorkflowStep {
  status: ReportStatus;
  label: string;
  icon: string;
  description: string;
  isCompleted: boolean;
  isCurrent: boolean;
  isAvailable: boolean;
  isRejected?: boolean;
}

@Component({
  selector: 'app-workflow-tracker',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
    MatIconModule,
    MatTooltipModule
  ],
  template: `
    <div class="workflow-tracker">
      <h3 class="workflow-title">Report Workflow Progress</h3>
      <div class="workflow-steps">
        @for (step of workflowSteps(); track step.status) {
          <div class="workflow-step" 
               [class.completed]="step.isCompleted"
               [class.current]="step.isCurrent"
               [class.available]="step.isAvailable"
               [class.rejected]="step.isRejected"
               [matTooltip]="step.description"
               matTooltipPosition="above">
            
            <div class="step-icon">
              <mat-icon [class]="getStepIconClass(step)">{{ step.icon }}</mat-icon>
            </div>
            
            <div class="step-content">
              <div class="step-label">{{ step.label }}</div>
              <div class="step-status">
                @if (step.isRejected) {
                  <mat-chip class="status-chip rejected">
                    <mat-icon>cancel</mat-icon>
                    Rejected
                  </mat-chip>
                } @else if (step.isCompleted) {
                  <mat-chip class="status-chip completed">
                    <mat-icon>check</mat-icon>
                    Completed
                  </mat-chip>
                } @else if (step.isCurrent) {
                  <mat-chip class="status-chip current">
                    <mat-icon>schedule</mat-icon>
                    In Progress
                  </mat-chip>
                } @else if (step.isAvailable) {
                  <mat-chip class="status-chip available">
                    <mat-icon>radio_button_unchecked</mat-icon>
                    Pending
                  </mat-chip>
                } @else {
                  <mat-chip class="status-chip unavailable">
                    <mat-icon>lock</mat-icon>
                    Locked
                  </mat-chip>
                }
              </div>
            </div>
            
            @if (!$last) {
              <div class="step-connector" [class.active]="step.isCompleted"></div>
            }
          </div>
        }
      </div>
      
      <!-- Current Status Summary -->
      <div class="status-summary">
        <h4>Current Status: {{ getCurrentStatusLabel() }}</h4>
        <p class="status-description">{{ getCurrentStatusDescription() }}</p>
        
        @if (getNextAction()) {
          <div class="next-action">
            <strong>Next Action:</strong> {{ getNextAction() }}
          </div>
        }
        
        @if (canUserAct()) {
          <div class="user-action">
            <mat-chip class="action-chip">
              <mat-icon>notification_important</mat-icon>
              Action Required
            </mat-chip>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .workflow-tracker {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 16px 0;
    }

    .workflow-title {
      margin: 0 0 20px 0;
      color: #1976d2;
      font-size: 1.2rem;
    }

    .workflow-steps {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .workflow-step {
      display: flex;
      align-items: center;
      position: relative;
      padding: 12px;
      border-radius: 8px;
      background: white;
      border: 2px solid #e0e0e0;
      transition: all 0.3s ease;
    }

    .workflow-step.completed {
      border-color: #4caf50;
      background: #f1f8e9;
    }

    .workflow-step.current {
      border-color: #2196f3;
      background: #e3f2fd;
      box-shadow: 0 2px 8px rgba(33, 150, 243, 0.2);
    }

    .workflow-step.available {
      border-color: #ff9800;
      background: #fff3e0;
    }

    .workflow-step.rejected {
      border-color: #f44336;
      background: #ffebee;
    }

    .step-icon {
      margin-right: 16px;
      flex-shrink: 0;
    }

    .step-icon mat-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #9e9e9e;
      background: #f5f5f5;
    }

    .step-icon mat-icon.completed {
      background: #4caf50;
      color: white;
    }

    .step-icon mat-icon.current {
      background: #2196f3;
      color: white;
    }

    .step-icon mat-icon.available {
      background: #ff9800;
      color: white;
    }

    .step-icon mat-icon.rejected {
      background: #f44336;
      color: white;
    }

    .step-content {
      flex: 1;
    }

    .step-label {
      font-weight: 500;
      font-size: 1rem;
      color: #333;
      margin-bottom: 4px;
    }

    .step-status {
      display: flex;
      align-items: center;
    }

    .status-chip {
      font-size: 0.8rem;
      height: 24px;
      font-weight: 500;
    }

    .status-chip.completed {
      background-color: #4caf50 !important;
      color: white !important;
    }

    .status-chip.current {
      background-color: #2196f3 !important;
      color: white !important;
    }

    .status-chip.available {
      background-color: #ff9800 !important;
      color: white !important;
    }

    .status-chip.unavailable {
      background-color: #9e9e9e !important;
      color: white !important;
    }

    .status-chip.rejected {
      background-color: #f44336 !important;
      color: white !important;
    }

    .status-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    .step-connector {
      position: absolute;
      right: -8px;
      top: 50%;
      width: 16px;
      height: 2px;
      background: #e0e0e0;
      transform: translateY(-50%);
    }

    .step-connector.active {
      background: #4caf50;
    }

    .status-summary {
      background: white;
      padding: 16px;
      border-radius: 8px;
      border-left: 4px solid #2196f3;
    }

    .status-summary h4 {
      margin: 0 0 8px 0;
      color: #1976d2;
    }

    .status-description {
      margin: 0 0 12px 0;
      color: #666;
      line-height: 1.5;
    }

    .next-action {
      margin-bottom: 12px;
      color: #333;
    }

    .user-action {
      display: flex;
      align-items: center;
    }

    .action-chip {
      background-color: #ff5722 !important;
      color: white !important;
      font-weight: 500;
    }

    .action-chip mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      margin-right: 4px;
    }

    @media (max-width: 768px) {
      .workflow-tracker {
        padding: 16px;
      }

      .workflow-steps {
        gap: 12px;
      }

      .workflow-step {
        padding: 8px;
      }

      .step-icon {
        margin-right: 12px;
      }

      .step-icon mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }
  `]
})
export class WorkflowTrackerComponent {
  // Inputs
  currentStatus = input.required<ReportStatus>();
  userRole = input.required<UserRole>();
  userDepartment = input.required<number>();
  reportDepartment = input.required<number>();
  createdBy = input.required<string>();
  currentUserEmail = input.required<string>();
  creatorRole = input.required<UserRole>(); // Add creator role input

  // Computed workflow steps
  workflowSteps = computed(() => {
    const status = this.currentStatus();
    const creatorRole = this.creatorRole();
    
    // Check if report was created by a Line Manager
    const isCreatedByManager = creatorRole === UserRole.LineManager;
    
    const steps: WorkflowStep[] = [
      {
        status: ReportStatus.Draft,
        label: 'Draft Creation',
        icon: 'create',
        description: 'Report is created and being drafted by the author',
        isCompleted: status > ReportStatus.Draft,
        isCurrent: status === ReportStatus.Draft,
        isAvailable: true
      },
      {
        status: ReportStatus.Submitted,
        label: isCreatedByManager ? 'Submitted for Executive Review' : 'Submitted for Review',
        icon: 'send',
        description: isCreatedByManager ? 
          'Report has been submitted directly to Executive for review (created by Line Manager)' :
          'Report has been submitted to Line Manager for review',
        isCompleted: status > ReportStatus.Submitted,
        isCurrent: status === ReportStatus.Submitted,
        isAvailable: status >= ReportStatus.Draft
      }
    ];

    // Only add Manager Review steps if NOT created by a manager
    if (!isCreatedByManager) {
      steps.push(
        {
          status: ReportStatus.ManagerReview,
          label: 'Manager Review',
          icon: 'rate_review',
          description: 'Line Manager is reviewing the report content and quality',
          isCompleted: status > ReportStatus.ManagerReview,
          isCurrent: status === ReportStatus.ManagerReview,
          isAvailable: status >= ReportStatus.Submitted
        },
        {
          status: ReportStatus.ManagerApproved,
          label: 'Manager Approved',
          icon: 'check_circle',
          description: 'Line Manager has approved the report and added their signature',
          isCompleted: status > ReportStatus.ManagerApproved,
          isCurrent: status === ReportStatus.ManagerApproved,
          isAvailable: status >= ReportStatus.ManagerReview
        }
      );
    }

    // Add Executive Review step
    steps.push({
      status: ReportStatus.ExecutiveReview,
      label: 'Executive Review',
      icon: 'supervisor_account',
      description: 'Executive is conducting final review before completion',
      isCompleted: status > ReportStatus.ExecutiveReview,
      isCurrent: status === ReportStatus.ExecutiveReview,
      isAvailable: isCreatedByManager ? 
        status >= ReportStatus.Submitted : 
        status >= ReportStatus.ManagerApproved
    });

    // Add Completed step
    steps.push({
      status: ReportStatus.Completed,
      label: 'Completed',
      icon: 'verified',
      description: 'Report is fully approved and ready for use',
      isCompleted: status === ReportStatus.Completed,
      isCurrent: status === ReportStatus.Completed,
      isAvailable: status >= ReportStatus.ExecutiveReview
    });

    // Handle rejected status
    if (status === ReportStatus.Rejected) {
      steps.forEach(step => {
        step.isCompleted = false;
        step.isCurrent = false;
        step.isRejected = false;
      });
      steps[0].isCurrent = true; // Back to draft
      
      // Mark the last step (Completed) as rejected
      const lastStep = steps[steps.length - 1];
      lastStep.isRejected = true;
      lastStep.isAvailable = true;
      lastStep.label = 'Rejected';
      lastStep.icon = 'cancel';
      lastStep.description = 'Report was rejected and needs revision';
    }

    return steps;
  });

  getStepIconClass(step: WorkflowStep): string {
    if (step.isRejected) return 'rejected';
    if (step.isCompleted) return 'completed';
    if (step.isCurrent) return 'current';
    if (step.isAvailable) return 'available';
    return 'unavailable';
  }

  getCurrentStatusLabel(): string {
    const status = this.currentStatus();
    switch (status) {
      case ReportStatus.Draft: return 'Draft';
      case ReportStatus.Submitted: return 'Submitted for Review';
      case ReportStatus.ManagerReview: return 'Under Manager Review';
      case ReportStatus.ManagerApproved: return 'Manager Approved';
      case ReportStatus.ExecutiveReview: return 'Under Executive Review';
      case ReportStatus.Completed: return 'Completed';
      case ReportStatus.Rejected: return 'Rejected';
      default: return 'Unknown Status';
    }
  }

  getCurrentStatusDescription(): string {
    const status = this.currentStatus();
    switch (status) {
      case ReportStatus.Draft:
        return 'The report is currently being drafted. You can continue editing and submit when ready.';
      case ReportStatus.Submitted:
        return 'The report has been submitted and is waiting for Line Manager review.';
      case ReportStatus.ManagerReview:
        return 'The Line Manager is currently reviewing the report content and quality.';
      case ReportStatus.ManagerApproved:
        return 'The Line Manager has approved the report. It will now be sent to Executive for final review.';
      case ReportStatus.ExecutiveReview:
        return 'The Executive is conducting the final review before completion.';
      case ReportStatus.Completed:
        return 'The report has been fully approved and is now complete. It can be downloaded and used.';
      case ReportStatus.Rejected:
        return 'The report has been rejected and returned for revision. Please check the feedback and resubmit.';
      default:
        return 'Report status is unknown.';
    }
  }

  getNextAction(): string | null {
    const status = this.currentStatus();
    const userRole = this.userRole();
    const isMyReport = this.createdBy() === this.currentUserEmail();
    const isSameDepartment = this.userDepartment() === this.reportDepartment();

    switch (status) {
      case ReportStatus.Draft:
        if (isMyReport) return 'Continue editing and submit when ready';
        return null;
      
      case ReportStatus.Submitted:
        return 'Waiting for Line Manager review';
      
      case ReportStatus.ManagerReview:
        if (userRole === UserRole.LineManager && isSameDepartment) {
          return 'Review and approve/reject the report';
        }
        return 'Waiting for Line Manager decision';
      
      case ReportStatus.ManagerApproved:
        return 'Automatically forwarded to Executive for final review';
      
      case ReportStatus.ExecutiveReview:
        if (userRole === UserRole.Executive) {
          return 'Conduct final review and approve/reject';
        }
        return 'Waiting for Executive final approval';
      
      case ReportStatus.Completed:
        return 'Report is complete and ready for download';
      
      case ReportStatus.Rejected:
        if (isMyReport) return 'Review feedback and revise the report';
        return null;
      
      default:
        return null;
    }
  }

  canUserAct(): boolean {
    const status = this.currentStatus();
    const userRole = this.userRole();
    const isMyReport = this.createdBy() === this.currentUserEmail();
    const isSameDepartment = this.userDepartment() === this.reportDepartment();

    switch (status) {
      case ReportStatus.Draft:
      case ReportStatus.Rejected:
        return isMyReport;
      
      case ReportStatus.ManagerReview:
        return userRole === UserRole.LineManager && isSameDepartment;
      
      case ReportStatus.ExecutiveReview:
        return userRole === UserRole.Executive;
      
      default:
        return false;
    }
  }
}
