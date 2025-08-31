import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NotificationService, NotificationDto } from '../../../core/services/notification.service';
import { RealTimeService } from '../../../core/services/real-time.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipsModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatPaginatorModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    FormsModule,
    RouterModule
  ],
  template: `
    <div class="notifications-page">
      <div class="page-header">
        <div class="header-content">
          <h1>
            <mat-icon>notifications</mat-icon>
            Notifications
            <mat-chip [matBadge]="unreadCount()" [matBadgeHidden]="unreadCount() === 0" matBadgeColor="warn">
              {{ notifications().length }} total
            </mat-chip>
          </h1>
          
          <div class="header-actions">
            <button mat-raised-button color="primary" (click)="markAllAsRead()" [disabled]="unreadCount() === 0">
              <mat-icon>done_all</mat-icon>
              Mark All Read
            </button>
            <button mat-raised-button (click)="refreshNotifications()">
              <mat-icon>refresh</mat-icon>
              Refresh
            </button>
            <button mat-raised-button color="warn" (click)="clearAllNotifications()" [disabled]="notifications().length === 0">
              <mat-icon>clear_all</mat-icon>
              Clear All
            </button>
          </div>
        </div>

        <!-- Real-time Status -->
        <div class="connection-status" [class.connected]="isConnected()" [class.connecting]="isConnecting()">
          <mat-icon>{{ getConnectionIcon() }}</mat-icon>
          <span>{{ getConnectionStatus() }}</span>
        </div>
      </div>

      <!-- Filters -->
      <mat-card class="filters-card">
        <mat-card-content>
          <div class="filters">
            <mat-form-field appearance="outline">
              <mat-label>Filter by Type</mat-label>
              <mat-select [(value)]="selectedType" (selectionChange)="applyFilters()">
                <mat-option value="">All Types</mat-option>
                <mat-option value="Info">Info</mat-option>
                <mat-option value="Warning">Warning</mat-option>
                <mat-option value="Error">Error</mat-option>
                <mat-option value="Success">Success</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Filter by Priority</mat-label>
              <mat-select [(value)]="selectedPriority" (selectionChange)="applyFilters()">
                <mat-option value="">All Priorities</mat-option>
                <mat-option value="Critical">Critical</mat-option>
                <mat-option value="High">High</mat-option>
                <mat-option value="Normal">Normal</mat-option>
                <mat-option value="Low">Low</mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Search notifications</mat-label>
              <mat-input [(ngModel)]="searchText" (ngModelChange)="applyFilters()" placeholder="Search by title or message..."></mat-input>
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-checkbox [(ngModel)]="showUnreadOnly" (ngModelChange)="applyFilters()">
              Show unread only
            </mat-checkbox>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Notifications Tabs -->
      <mat-tab-group mat-align-tabs="start" [selectedIndex]="selectedTab()" (selectedTabChange)="onTabChange($event.index)">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>inbox</mat-icon>
            All
            <mat-chip>{{ notifications().length }}</mat-chip>
          </ng-template>
          
          <div class="notifications-content">
            <div class="notifications-list" *ngIf="paginatedNotifications().length > 0; else noNotifications">
              <mat-card 
                *ngFor="let notification of paginatedNotifications(); trackBy: trackByNotificationId"
                class="notification-card"
                [class.unread]="!notification.isRead"
                [class.priority-critical]="notification.priority === 'Critical'"
                [class.priority-high]="notification.priority === 'High'"
              >
                <mat-card-content>
                  <div class="notification-header">
                    <div class="notification-icon">
                      <mat-icon [class]="getNotificationIconClass(notification)">
                        {{ getNotificationIcon(notification) }}
                      </mat-icon>
                    </div>

                    <div class="notification-info">
                      <h3 class="notification-title">{{ notification.title }}</h3>
                      <p class="notification-message">{{ notification.message }}</p>
                      
                      <div class="notification-meta">
                        <mat-chip-set>
                          <mat-chip [class]="getTypeChipClass(notification.type)">
                            {{ notification.type }}
                          </mat-chip>
                          <mat-chip [class]="getPriorityChipClass(notification.priority)">
                            {{ notification.priority }}
                          </mat-chip>
                        </mat-chip-set>
                        <span class="notification-time">{{ getFormattedTime(notification.createdAt) }}</span>
                      </div>
                    </div>

                    <div class="notification-actions">
                      <button 
                        mat-icon-button 
                        (click)="markAsRead(notification)" 
                        *ngIf="!notification.isRead"
                        matTooltip="Mark as read"
                      >
                        <mat-icon>done</mat-icon>
                      </button>
                      <button 
                        mat-icon-button 
                        (click)="markAsUnread(notification)" 
                        *ngIf="notification.isRead"
                        matTooltip="Mark as unread"
                      >
                        <mat-icon>mark_email_unread</mat-icon>
                      </button>
                      <button 
                        mat-icon-button 
                        [matMenuTriggerFor]="actionMenu"
                        matTooltip="More actions"
                      >
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      
                      <mat-menu #actionMenu="matMenu">
                        <button mat-menu-item (click)="openNotificationAction(notification)" *ngIf="notification.actionUrl">
                          <mat-icon>open_in_new</mat-icon>
                          <span>Open Action</span>
                        </button>
                        <button mat-menu-item (click)="copyNotificationLink(notification)" *ngIf="notification.actionUrl">
                          <mat-icon>link</mat-icon>
                          <span>Copy Link</span>
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item (click)="deleteNotification(notification)" class="delete-action">
                          <mat-icon>delete</mat-icon>
                          <span>Delete</span>
                        </button>
                      </mat-menu>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <ng-template #noNotifications>
              <div class="no-notifications">
                <mat-icon>notifications_none</mat-icon>
                <h3>No notifications found</h3>
                <p>{{ getEmptyStateMessage() }}</p>
              </div>
            </ng-template>

            <!-- Pagination -->
            <mat-paginator
              *ngIf="filteredNotifications().length > pageSize"
              [length]="filteredNotifications().length"
              [pageSize]="pageSize"
              [pageSizeOptions]="[10, 25, 50, 100]"
              [pageIndex]="currentPage()"
              (page)="onPageChange($event)"
              showFirstLastButtons
            ></mat-paginator>
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>mark_email_unread</mat-icon>
            Unread
            <mat-chip>{{ unreadCount() }}</mat-chip>
          </ng-template>
          
          <div class="notifications-content">
            <!-- Same content structure but filtered for unread -->
            <div class="notifications-list" *ngIf="unreadNotifications().length > 0; else noUnreadNotifications">
              <mat-card 
                *ngFor="let notification of unreadNotifications(); trackBy: trackByNotificationId"
                class="notification-card unread"
                [class.priority-critical]="notification.priority === 'Critical'"
                [class.priority-high]="notification.priority === 'High'"
              >
                <!-- Same notification card content -->
                <mat-card-content>
                  <div class="notification-header">
                    <div class="notification-icon">
                      <mat-icon [class]="getNotificationIconClass(notification)">
                        {{ getNotificationIcon(notification) }}
                      </mat-icon>
                    </div>

                    <div class="notification-info">
                      <h3 class="notification-title">{{ notification.title }}</h3>
                      <p class="notification-message">{{ notification.message }}</p>
                      
                      <div class="notification-meta">
                        <mat-chip-set>
                          <mat-chip [class]="getTypeChipClass(notification.type)">
                            {{ notification.type }}
                          </mat-chip>
                          <mat-chip [class]="getPriorityChipClass(notification.priority)">
                            {{ notification.priority }}
                          </mat-chip>
                        </mat-chip-set>
                        <span class="notification-time">{{ getFormattedTime(notification.createdAt) }}</span>
                      </div>
                    </div>

                    <div class="notification-actions">
                      <button mat-icon-button (click)="markAsRead(notification)" matTooltip="Mark as read">
                        <mat-icon>done</mat-icon>
                      </button>
                      <button mat-icon-button [matMenuTriggerFor]="actionMenu" matTooltip="More actions">
                        <mat-icon>more_vert</mat-icon>
                      </button>
                      
                      <mat-menu #actionMenu="matMenu">
                        <button mat-menu-item (click)="openNotificationAction(notification)" *ngIf="notification.actionUrl">
                          <mat-icon>open_in_new</mat-icon>
                          <span>Open Action</span>
                        </button>
                        <button mat-menu-item (click)="copyNotificationLink(notification)" *ngIf="notification.actionUrl">
                          <mat-icon>link</mat-icon>
                          <span>Copy Link</span>
                        </button>
                        <mat-divider></mat-divider>
                        <button mat-menu-item (click)="deleteNotification(notification)" class="delete-action">
                          <mat-icon>delete</mat-icon>
                          <span>Delete</span>
                        </button>
                      </mat-menu>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <ng-template #noUnreadNotifications>
              <div class="no-notifications">
                <mat-icon>check_circle</mat-icon>
                <h3>All caught up!</h3>
                <p>You have no unread notifications.</p>
              </div>
            </ng-template>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .notifications-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .header-content h1 {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 0;
      font-size: 28px;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      gap: 12px;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      background: #f5f5f5;
      font-size: 14px;
      opacity: 0.7;
    }

    .connection-status.connected {
      background: #e8f5e8;
      color: #2e7d32;
      opacity: 1;
    }

    .connection-status.connecting {
      background: #fff3e0;
      color: #e65100;
      opacity: 1;
    }

    .filters-card {
      margin-bottom: 24px;
    }

    .filters {
      display: flex;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .filters mat-form-field {
      min-width: 200px;
    }

    .notifications-content {
      padding: 24px 0;
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .notification-card {
      transition: all 0.2s ease;
    }

    .notification-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    .notification-card.unread {
      border-left: 4px solid #2196f3;
      background: #fafafa;
    }

    .notification-card.priority-critical {
      border-left-color: #f44336;
    }

    .notification-card.priority-high {
      border-left-color: #ff9800;
    }

    .notification-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .notification-icon mat-icon {
      font-size: 24px;
      height: 24px;
      width: 24px;
    }

    .notification-icon .type-error {
      color: #f44336;
    }

    .notification-icon .type-warning {
      color: #ff9800;
    }

    .notification-icon .type-success {
      color: #4caf50;
    }

    .notification-icon .type-info {
      color: #2196f3;
    }

    .notification-info {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 500;
      line-height: 1.3;
    }

    .notification-message {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #666;
      line-height: 1.4;
    }

    .notification-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .notification-meta mat-chip {
      font-size: 11px;
      height: 20px;
      line-height: 20px;
    }

    .type-error {
      background-color: #ffebee;
      color: #c62828;
    }

    .type-warning {
      background-color: #fff3e0;
      color: #e65100;
    }

    .type-success {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .type-info {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .priority-critical {
      background-color: #ffebee;
      color: #c62828;
    }

    .priority-high {
      background-color: #fff3e0;
      color: #e65100;
    }

    .priority-normal {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .priority-low {
      background-color: #e8f5e8;
      color: #388e3c;
    }

    .notification-time {
      font-size: 12px;
      color: #999;
    }

    .notification-actions {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .delete-action {
      color: #f44336;
    }

    .no-notifications {
      text-align: center;
      padding: 64px 24px;
      color: #666;
    }

    .no-notifications mat-icon {
      font-size: 64px;
      height: 64px;
      width: 64px;
      opacity: 0.5;
      margin-bottom: 16px;
    }

    .no-notifications h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 400;
    }

    .no-notifications p {
      margin: 0;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .notifications-page {
        padding: 16px;
      }

      .header-content {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
      }

      .header-actions {
        flex-wrap: wrap;
      }

      .filters {
        flex-direction: column;
        align-items: stretch;
      }

      .filters mat-form-field {
        min-width: 100%;
      }

      .notification-header {
        flex-direction: column;
        gap: 12px;
      }

      .notification-actions {
        flex-direction: row;
        align-self: flex-end;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  // Filter properties
  selectedType = '';
  selectedPriority = '';
  searchText = '';
  showUnreadOnly = false;
  
  // Pagination
  pageSize = 25;
  currentPage = signal(0);
  selectedTab = signal(0);

  constructor(
    private notificationService: NotificationService,
    private realTimeService: RealTimeService,
    private snackBar: MatSnackBar
  ) {}

  // Service data - getter properties
  get notifications() {
    return this.notificationService.notifications;
  }
  
  get unreadCount() {
    return this.notificationService.unreadCount;
  }
  
  // Real-time connection status
  isConnected = computed(() => this.realTimeService.connectionStatus().isConnected);
  isConnecting = computed(() => this.realTimeService.isConnecting());
  
  // Filtered notifications
  filteredNotifications = computed(() => {
    let filtered = this.notifications();
    
    // Apply type filter
    if (this.selectedType) {
      filtered = filtered.filter(n => n.type === this.selectedType);
    }
    
    // Apply priority filter
    if (this.selectedPriority) {
      filtered = filtered.filter(n => n.priority === this.selectedPriority);
    }
    
    // Apply search filter
    if (this.searchText) {
      const search = this.searchText.toLowerCase();
      filtered = filtered.filter(n => 
        n.title.toLowerCase().includes(search) || 
        n.message.toLowerCase().includes(search)
      );
    }
    
    // Apply read status filter
    if (this.showUnreadOnly) {
      filtered = filtered.filter(n => !n.isRead);
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });
  
  // Unread notifications for tab
  unreadNotifications = computed(() => 
    this.notifications().filter(n => !n.isRead)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  
  // Paginated notifications
  paginatedNotifications = computed(() => {
    const start = this.currentPage() * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredNotifications().slice(start, end);
  });

  ngOnInit(): void {
    // Load notifications
    this.notificationService.loadNotifications();
  }

  applyFilters(): void {
    this.currentPage.set(0); // Reset to first page when filtering
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
    this.currentPage.set(0);
    
    if (index === 1) {
      // Unread tab selected
      this.showUnreadOnly = true;
    } else {
      // All tab selected
      this.showUnreadOnly = false;
    }
  }

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex);
    this.pageSize = event.pageSize;
  }

  async markAsRead(notification: NotificationDto): Promise<void> {
    try {
      await this.notificationService.markAsRead(notification.id).toPromise();
      this.notificationService.updateNotification({ ...notification, isRead: true });
      this.snackBar.open('Marked as read', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Failed to mark as read:', error);
      this.snackBar.open('Failed to mark as read', 'Close', { duration: 3000 });
    }
  }

  async markAsUnread(notification: NotificationDto): Promise<void> {
    try {
      await this.notificationService.markAsUnread(notification.id).toPromise();
      this.notificationService.updateNotification({ ...notification, isRead: false });
      this.snackBar.open('Marked as unread', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Failed to mark as unread:', error);
      this.snackBar.open('Failed to mark as unread', 'Close', { duration: 3000 });
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.notificationService.markAllAsRead();
      this.snackBar.open('All notifications marked as read', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      this.snackBar.open('Failed to mark all as read', 'Close', { duration: 3000 });
    }
  }

  async deleteNotification(notification: NotificationDto): Promise<void> {
    try {
      await this.notificationService.deleteNotification(notification.id).toPromise();
      this.notificationService.removeNotification(notification.id);
      this.snackBar.open('Notification deleted', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      this.snackBar.open('Failed to delete notification', 'Close', { duration: 3000 });
    }
  }

  async clearAllNotifications(): Promise<void> {
    if (confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      try {
        await this.notificationService.clearAllNotifications();
        this.snackBar.open('All notifications cleared', 'Close', { duration: 2000 });
      } catch (error) {
        console.error('Failed to clear notifications:', error);
        this.snackBar.open('Failed to clear notifications', 'Close', { duration: 3000 });
      }
    }
  }

  async refreshNotifications(): Promise<void> {
    await this.notificationService.loadNotifications();
    this.snackBar.open('Notifications refreshed', 'Close', { duration: 1000 });
  }

  openNotificationAction(notification: NotificationDto): void {
    if (notification.actionUrl) {
      if (notification.actionUrl.startsWith('/')) {
        // Internal route
        window.location.href = notification.actionUrl;
      } else {
        // External URL
        window.open(notification.actionUrl, '_blank');
      }
    }
  }

  copyNotificationLink(notification: NotificationDto): void {
    if (notification.actionUrl) {
      navigator.clipboard.writeText(notification.actionUrl);
      this.snackBar.open('Link copied to clipboard', 'Close', { duration: 2000 });
    }
  }

  // Helper methods
  trackByNotificationId(index: number, notification: NotificationDto): string {
    return notification.id;
  }

  getNotificationIcon(notification: NotificationDto): string {
    const iconMap: { [key: string]: string } = {
      'Info': 'info',
      'Warning': 'warning', 
      'Error': 'error',
      'Success': 'check_circle'
    };
    return iconMap[notification.type] || 'notifications';
  }

  getNotificationIconClass(notification: NotificationDto): string {
    return `type-${notification.type.toLowerCase()}`;
  }

  getTypeChipClass(type: string): string {
    return `type-${type.toLowerCase()}`;
  }

  getPriorityChipClass(priority: string): string {
    return `priority-${priority.toLowerCase()}`;
  }

  getConnectionIcon(): string {
    if (this.isConnecting()) return 'sync';
    return this.isConnected() ? 'wifi' : 'wifi_off';
  }

  getConnectionStatus(): string {
    if (this.isConnecting()) return 'Connecting to real-time notifications...';
    return this.isConnected() ? 'Real-time notifications connected' : 'Real-time notifications disconnected';
  }

  getEmptyStateMessage(): string {
    if (this.selectedType || this.selectedPriority || this.searchText) {
      return 'Try adjusting your filters to see more notifications.';
    }
    return 'You\'ll see new notifications here as they arrive.';
  }

  getFormattedTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    
    return date.toLocaleString();
  }
}
