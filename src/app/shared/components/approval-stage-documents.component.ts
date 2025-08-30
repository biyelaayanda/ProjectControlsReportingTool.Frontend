import { Component, Input, Output, EventEmitter, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileListComponent } from './file-list.component';
import { UploadedFile } from './file-upload.component';
import { ApprovalStage, UserRole } from '../../core/models/enums';

export interface AttachmentsByStage {
  [key: string]: UploadedFile[];
}

@Component({
  selector: 'app-approval-stage-documents',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatBadgeModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    FileListComponent
  ],
  template: `
    <div class="approval-stage-documents">
      @if (isLoading()) {
        <div class="loading-container">
          <mat-spinner diameter="40"></mat-spinner>
          <p>Loading documents...</p>
        </div>
      } @else {
        <mat-tab-group 
          [(selectedIndex)]="selectedTabIndex"
          animationDuration="300ms"
          class="documents-tabs">
          
          <!-- Initial Documents Tab -->
          <mat-tab 
            [label]="getTabLabel('Initial', getStageDocuments(ApprovalStage.Initial).length)">
            <ng-template matTabContent>
              <div class="tab-content">
                <div class="stage-header">
                  <div class="stage-info">
                    <mat-icon class="stage-icon initial-icon">description</mat-icon>
                    <div>
                      <h3>Initial Documents</h3>
                      <p>Documents uploaded during report creation</p>
                    </div>
                  </div>
                  <mat-chip-set>
                    <mat-chip>{{ getStageDocuments(ApprovalStage.Initial).length }} file(s)</mat-chip>
                  </mat-chip-set>
                </div>

                @if (getStageDocuments(ApprovalStage.Initial).length > 0) {
                  <app-file-list
                    [files]="getStageDocuments(ApprovalStage.Initial)"
                    [showActions]="true"
                    (filePreview)="onFilePreview($event)"
                    (fileDownload)="onFileDownload($event)">
                  </app-file-list>
                } @else {
                  <div class="no-documents">
                    <mat-icon>folder_open</mat-icon>
                    <p>No initial documents were uploaded with this report.</p>
                  </div>
                }
              </div>
            </ng-template>
          </mat-tab>

          <!-- Manager Documents Tab -->
          <mat-tab 
            [label]="getTabLabel('Manager Review', getStageDocuments(ApprovalStage.ManagerReview).length)">
            <ng-template matTabContent>
              <div class="tab-content">
                <div class="stage-header">
                  <div class="stage-info">
                    <mat-icon class="stage-icon manager-icon">supervisor_account</mat-icon>
                    <div>
                      <h3>Manager Review Documents</h3>
                      <p>Documents uploaded by line managers during approval</p>
                    </div>
                  </div>
                  <mat-chip-set>
                    <mat-chip class="manager-chip">{{ getStageDocuments(ApprovalStage.ManagerReview).length }} file(s)</mat-chip>
                  </mat-chip-set>
                </div>

                @if (getStageDocuments(ApprovalStage.ManagerReview).length > 0) {
                  <app-file-list
                    [files]="getStageDocuments(ApprovalStage.ManagerReview)"
                    [showActions]="true"
                    (filePreview)="onFilePreview($event)"
                    (fileDownload)="onFileDownload($event)">
                  </app-file-list>
                } @else {
                  <div class="no-documents">
                    <mat-icon>supervisor_account</mat-icon>
                    <p>No manager review documents have been uploaded yet.</p>
                    @if (showManagerUploadHint) {
                      <small>Managers can upload supporting documents during the approval process.</small>
                    }
                  </div>
                }
              </div>
            </ng-template>
          </mat-tab>

          <!-- GM Documents Tab -->
          <mat-tab 
            [label]="getTabLabel('GM Review', getStageDocuments(ApprovalStage.GMReview).length)">
            <ng-template matTabContent>
              <div class="tab-content">
                <div class="stage-header">
                  <div class="stage-info">
                    <mat-icon class="stage-icon gm-icon">business_center</mat-icon>
                    <div>
                      <h3>GM Review Documents</h3>
                      <p>Documents uploaded by GM during final approval</p>
                    </div>
                  </div>
                  <mat-chip-set>
                    <mat-chip class="gm-chip">{{ getStageDocuments(ApprovalStage.GMReview).length }} file(s)</mat-chip>
                  </mat-chip-set>
                </div>

                @if (getStageDocuments(ApprovalStage.GMReview).length > 0) {
                  <app-file-list
                    [files]="getStageDocuments(ApprovalStage.GMReview)"
                    [showActions]="true"
                    (filePreview)="onFilePreview($event)"
                    (fileDownload)="onFileDownload($event)">
                  </app-file-list>
                } @else {
                  <div class="no-documents">
                    <mat-icon>business_center</mat-icon>
                    <p>No GM review documents have been uploaded yet.</p>
                    @if (showGMUploadHint) {
                      <small>GM can upload strategic documents during the final approval process.</small>
                    }
                  </div>
                }
              </div>
            </ng-template>
          </mat-tab>

        </mat-tab-group>
      }
    </div>
  `,
  styles: [`
    .approval-stage-documents {
      margin: 16px 0;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 32px;
    }

    .loading-container p {
      margin: 0;
      color: rgba(0, 0, 0, 0.6);
    }

    .documents-tabs {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .documents-tabs ::ng-deep .mat-mdc-tab-group {
      background: white;
    }

    .documents-tabs ::ng-deep .mat-mdc-tab-header {
      border-bottom: 1px solid #e0e0e0;
    }

    .tab-content {
      padding: 24px;
    }

    .stage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #f0f0f0;
    }

    .stage-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stage-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
    }

    .initial-icon {
      color: #2196f3;
    }

    .manager-icon {
      color: #ff9800;
    }

    .gm-icon {
      color: #9c27b0;
    }

    .stage-info h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .stage-info p {
      margin: 4px 0 0 0;
      color: rgba(0, 0, 0, 0.6);
      font-size: 14px;
    }

    .manager-chip {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .gm-chip {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .no-documents {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 48px 24px;
      text-align: center;
      color: rgba(0, 0, 0, 0.6);
    }

    .no-documents mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    .no-documents p {
      margin: 0;
      font-size: 16px;
    }

    .no-documents small {
      color: rgba(0, 0, 0, 0.4);
      font-size: 12px;
    }
  `]
})
export class ApprovalStageDocumentsComponent implements OnInit {
  @Input() attachmentsByStage: AttachmentsByStage = {};
  @Input() userRole!: UserRole;
  @Input() isLoading = signal(false);
  @Output() filePreview = new EventEmitter<UploadedFile>();
  @Output() fileDownload = new EventEmitter<UploadedFile>();
  @Output() refreshRequested = new EventEmitter<void>();

  selectedTabIndex = 0;

  // Expose ApprovalStage enum to template
  ApprovalStage = ApprovalStage;

  ngOnInit(): void {
    // Auto-select the tab with the most recent documents or most relevant to user role
    this.selectMostRelevantTab();
  }

  getStageDocuments(stage: ApprovalStage): UploadedFile[] {
    const stageKey = this.getStageKey(stage);
    return this.attachmentsByStage[stageKey] || [];
  }

  private getStageKey(stage: ApprovalStage): string {
    switch (stage) {
      case ApprovalStage.Initial:
        return 'Initial';
      case ApprovalStage.ManagerReview:
        return 'ManagerReview';
      case ApprovalStage.GMReview:
        return 'GMReview';
      default:
        return 'Initial';
    }
  }

  getTabLabel(stageName: string, count: number): string {
    if (count > 0) {
      return `${stageName} (${count})`;
    }
    return stageName;
  }

  get showManagerUploadHint(): boolean {
    return this.userRole === UserRole.LineManager || this.userRole === UserRole.GM;
  }

  get showGMUploadHint(): boolean {
    return this.userRole === UserRole.GM;
  }

  onFilePreview(file: UploadedFile): void {
    this.filePreview.emit(file);
  }

  onFileDownload(file: UploadedFile): void {
    this.fileDownload.emit(file);
  }

  private selectMostRelevantTab(): void {
    // Select tab based on user role and available documents
    const gmDocs = this.getStageDocuments(ApprovalStage.GMReview);
    const managerDocs = this.getStageDocuments(ApprovalStage.ManagerReview);
    const initialDocs = this.getStageDocuments(ApprovalStage.Initial);

    if (this.userRole === UserRole.GM && gmDocs.length > 0) {
      this.selectedTabIndex = 2; // GM tab
    } else if (this.userRole === UserRole.LineManager && managerDocs.length > 0) {
      this.selectedTabIndex = 1; // Manager tab
    } else if (initialDocs.length > 0) {
      this.selectedTabIndex = 0; // Initial tab
    } else {
      // Default to initial tab
      this.selectedTabIndex = 0;
    }
  }
}
