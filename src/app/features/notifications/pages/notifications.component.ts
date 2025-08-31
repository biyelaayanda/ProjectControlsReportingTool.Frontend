import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

// Angular Material imports
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Services
import { NotificationService, NotificationDto } from '../../../core/services/notification.service';
import { RealTimeService } from '../../../core/services/real-time.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatBadgeModule,
    MatChipsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="notifications-page">
      <div class="page-header">
        <h1>
          <mat-icon>notifications</mat-icon>
          Notifications
          <mat-chip 
            [matBadge]="unreadCount()" 
            [matBadgeHidden]="unreadCount() === 0" 
            matBadgeColor="warn"
          >
            {{ totalCount() }} total
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
        </div>
      </div>

      <!-- Connection Status -->
      <div class="connection-status" [class.connected]="isConnected()">
        <mat-icon>{{ getConnectionIcon() }}</mat-icon>
        <span>{{ getConnectionStatus() }}</span>
      </div>

      <!-- Quick Filters -->
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
              <mat-label>Search notifications</mat-label>
              <input 
                matInput 
                [(ngModel)]="searchText" 
                (ngModelChange)="applyFilters()" 
                placeholder="Search by title or message..."
              />
              <mat-icon matSuffix>search</mat-icon>
            </mat-form-field>

            <mat-checkbox [(ngModel)]="showUnreadOnly" (ngModelChange)="applyFilters()">
              Show unread only
            </mat-checkbox>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Notifications Tabs -->
      <mat-tab-group (selectedTabChange)="onTabChange($event.index)">
        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>inbox</mat-icon>
            All ({{ filteredNotifications().length }})
          </ng-template>
          
          <div class="notifications-content">
            <div class="notifications-list" *ngIf="!loading() && filteredNotifications().length > 0; else noNotifications">
              <mat-card 
                *ngFor="let notification of displayedNotifications(); trackBy: trackByNotificationId"
                class="notification-card"
                [class.unread]="!notification.isRead"
                [class.priority-critical]="notification.priority === 'Critical'"
              >
                <mat-card-content>
                  <div class="notification-header">
                    <mat-icon [class]="getNotificationIconClass(notification)">
                      {{ getNotificationIcon(notification) }}
                    </mat-icon>

                    <div class="notification-info">
                      <h3>{{ notification.title }}</h3>
                      <p>{{ notification.message }}</p>
                      
                      <div class="notification-meta">
                        <mat-chip [class]="'type-' + notification.type.toLowerCase()">
                          {{ notification.type }}
                        </mat-chip>
                        <mat-chip [class]="'priority-' + notification.priority.toLowerCase()">
                          {{ notification.priority }}
                        </mat-chip>
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
                        (click)="deleteNotification(notification)"
                        matTooltip="Delete"
                      >
                        <mat-icon>delete</mat-icon>
                      </button>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <ng-template #noNotifications>
              <div class="no-notifications">
                <mat-spinner *ngIf="loading()"></mat-spinner>
                <div *ngIf="!loading()">
                  <mat-icon>notifications_none</mat-icon>
                  <h3>No notifications found</h3>
                  <p>{{ getEmptyStateMessage() }}</p>
                </div>
              </div>
            </ng-template>
          </div>
        </mat-tab>

        <mat-tab>
          <ng-template mat-tab-label>
            <mat-icon>mark_email_unread</mat-icon>
            Unread ({{ unreadCount() }})
          </ng-template>
          
          <div class="notifications-content">
            <div class="notifications-list" *ngIf="unreadNotifications().length > 0; else noUnread">
              <mat-card 
                *ngFor="let notification of unreadNotifications(); trackBy: trackByNotificationId"
                class="notification-card unread"
              >
                <mat-card-content>
                  <div class="notification-header">
                    <mat-icon [class]="getNotificationIconClass(notification)">
                      {{ getNotificationIcon(notification) }}
                    </mat-icon>

                    <div class="notification-info">
                      <h3>{{ notification.title }}</h3>
                      <p>{{ notification.message }}</p>
                      
                      <div class="notification-meta">
                        <mat-chip [class]="'type-' + notification.type.toLowerCase()">
                          {{ notification.type }}
                        </mat-chip>
                        <span class="notification-time">{{ getFormattedTime(notification.createdAt) }}</span>
                      </div>
                    </div>

                    <div class="notification-actions">
                      <button mat-icon-button (click)="markAsRead(notification)" matTooltip="Mark as read">
                        <mat-icon>done</mat-icon>
                      </button>
                    </div>
                  </div>
                </mat-card-content>
              </mat-card>
            </div>

            <ng-template #noUnread>
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
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-header h1 {
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
      flex-wrap: wrap;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      background: #f5f5f5;
      font-size: 14px;
      margin-bottom: 16px;
    }

    .connection-status.connected {
      background: #e8f5e8;
      color: #2e7d32;
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
      transition: transform 0.2s ease;
    }

    .notification-card:hover {
      transform: translateY(-2px);
    }

    .notification-card.unread {
      border-left: 4px solid #2196f3;
      background: #fafafa;
    }

    .notification-card.priority-critical {
      border-left-color: #f44336;
    }

    .notification-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }

    .notification-header mat-icon {
      margin-top: 2px;
    }

    .notification-info {
      flex: 1;
      min-width: 0;
    }

    .notification-info h3 {
      margin: 0 0 8px 0;
      font-size: 16px;
      font-weight: 500;
    }

    .notification-info p {
      margin: 0 0 12px 0;
      color: #666;
      line-height: 1.4;
    }

    .notification-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .notification-meta mat-chip {
      font-size: 11px;
      height: 20px;
    }

    .notification-time {
      font-size: 12px;
      color: #999;
      margin-left: auto;
    }

    .notification-actions {
      display: flex;
      gap: 4px;
    }

    .type-error, .type-error mat-icon {
      color: #f44336;
    }

    .type-warning, .type-warning mat-icon {
      color: #ff9800;
    }

    .type-success, .type-success mat-icon {
      color: #4caf50;
    }

    .type-info, .type-info mat-icon {
      color: #2196f3;
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

    .no-notifications {
      text-align: center;
      padding: 64px 24px;
      color: #666;
    }

    .no-notifications mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .no-notifications h3 {
      margin: 0 0 8px 0;
      font-size: 18px;
    }

    @media (max-width: 768px) {
      .notifications-page {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .filters {
        flex-direction: column;
      }

      .filters mat-form-field {
        width: 100%;
      }

      .notification-header {
        flex-direction: column;
        gap: 12px;
      }
    }
  `]
})
export class NotificationsComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly realTimeService = inject(RealTimeService);
  private readonly snackBar = inject(MatSnackBar);

  // Filter states
  selectedType = '';
  searchText = '';
  showUnreadOnly = false;
  selectedTab = signal(0);
  loading = signal(true);

  // Get notifications from service
  notifications = computed(() => this.notificationService.notifications());
  unreadCount = computed(() => this.notificationService.unreadCount());
  totalCount = computed(() => this.notifications().length);
  
  // Connection status
  isConnected = computed(() => this.realTimeService.connectionStatus().isConnected);
  
  // Filtered notifications
  filteredNotifications = computed(() => {
    try {
      let filtered = [...this.notifications()];
      
      if (this.selectedType) {
        filtered = filtered.filter(n => n.type === this.selectedType);
      }
      
      if (this.searchText.trim()) {
        const search = this.searchText.toLowerCase().trim();
        filtered = filtered.filter(n => 
          n.title.toLowerCase().includes(search) || 
          n.message.toLowerCase().includes(search)
        );
      }
      
      if (this.showUnreadOnly) {
        filtered = filtered.filter(n => !n.isRead);
      }
      
      return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Error filtering notifications:', error);
      return [];
    }
  });
  
  // Unread notifications
  unreadNotifications = computed(() => {
    try {
      return this.notifications()
        .filter(n => !n.isRead)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 20); // Limit to 20 unread
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      return [];
    }
  });
  
  // Display notifications (limited for performance)
  displayedNotifications = computed(() => {
    try {
      return this.filteredNotifications().slice(0, 50); // Limit to 50 for performance
    } catch (error) {
      console.error('Error getting displayed notifications:', error);
      return [];
    }
  });

  ngOnInit(): void {
    this.loadNotifications();
  }

  private async loadNotifications(): Promise<void> {
    try {
      this.loading.set(true);
      await this.notificationService.loadNotifications();
      this.loading.set(false);
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.loading.set(false);
      this.snackBar.open('Failed to load notifications', 'Close', { duration: 3000 });
    }
  }

  applyFilters(): void {
    // Filters are applied automatically via computed signals
    console.log('Filters applied');
  }

  onTabChange(index: number): void {
    this.selectedTab.set(index);
    if (index === 1) {
      this.showUnreadOnly = true;
    } else {
      this.showUnreadOnly = false;
    }
  }

  async markAsRead(notification: NotificationDto): Promise<void> {
    try {
      await firstValueFrom(this.notificationService.markAsRead(notification.id));
      this.snackBar.open('Marked as read', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Failed to mark as read:', error);
      this.snackBar.open('Failed to mark as read', 'Close', { duration: 3000 });
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
      await firstValueFrom(this.notificationService.deleteNotification(notification.id));
      this.snackBar.open('Notification deleted', 'Close', { duration: 2000 });
    } catch (error) {
      console.error('Failed to delete notification:', error);
      this.snackBar.open('Failed to delete notification', 'Close', { duration: 3000 });
    }
  }

  async refreshNotifications(): Promise<void> {
    try {
      this.loading.set(true);
      await this.notificationService.loadNotifications();
      this.loading.set(false);
      this.snackBar.open('Notifications refreshed', 'Close', { duration: 1000 });
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      this.loading.set(false);
      this.snackBar.open('Failed to refresh notifications', 'Close', { duration: 3000 });
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

  getConnectionIcon(): string {
    return this.isConnected() ? 'wifi' : 'wifi_off';
  }

  getConnectionStatus(): string {
    return this.isConnected() 
      ? 'Real-time notifications connected' 
      : 'Real-time notifications disconnected (using mock data)';
  }

  getEmptyStateMessage(): string {
    if (this.selectedType || this.searchText.trim()) {
      return 'Try adjusting your filters to see more notifications.';
    }
    return 'You\'ll see new notifications here as they arrive.';
  }

  getFormattedTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Unknown';
    }
  }
}
