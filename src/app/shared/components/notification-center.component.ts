import { Component, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { NotificationService, NotificationDto } from '../../core/services/notification.service';
import { RealTimeService } from '../../core/services/real-time.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    RouterModule
  ],
  template: `
    <div class="notification-center">
      <!-- Notification Bell Button -->
      <button
        mat-icon-button
        [matMenuTriggerFor]="notificationMenu"
        [matBadge]="unreadCount()"
        [matBadgeHidden]="unreadCount() === 0"
        matBadgeColor="warn"
        matTooltip="Notifications"
        class="notification-bell"
      >
        <mat-icon>{{ unreadCount() > 0 ? 'notifications_active' : 'notifications' }}</mat-icon>
      </button>

      <!-- Real-time Connection Status -->
      <div class="connection-status" [class.connected]="isConnected()" [class.connecting]="isConnecting()">
        <mat-icon [matTooltip]="getConnectionTooltip()">
          {{ getConnectionIcon() }}
        </mat-icon>
      </div>

      <!-- Notification Menu -->
      <mat-menu #notificationMenu="matMenu" class="notification-menu" xPosition="before">
        <div class="notification-header" (click)="$event.stopPropagation()">
          <h3>Notifications</h3>
          <div class="header-actions">
            <button mat-icon-button (click)="markAllAsRead()" [disabled]="unreadCount() === 0" matTooltip="Mark all as read">
              <mat-icon>done_all</mat-icon>
            </button>
            <button mat-icon-button (click)="refreshNotifications()" matTooltip="Refresh">
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
        </div>

        <mat-divider></mat-divider>

        <!-- No notifications -->
        <div class="no-notifications" *ngIf="(notifications() || []).length === 0" (click)="$event.stopPropagation()">
          <mat-icon>notifications_none</mat-icon>
          <p>No notifications</p>
          <button 
            mat-button 
            color="primary" 
            *ngIf="!hasNotificationPermission()" 
            (click)="requestNotificationPermission()"
            class="enable-notifications-btn"
          >
            <mat-icon>notifications_active</mat-icon>
            Enable Browser Notifications
          </button>
        </div>

        <!-- Notifications List -->
        <div class="notifications-list" *ngIf="(notifications() || []).length > 0">
          <div
            *ngFor="let notification of recentNotifications(); trackBy: trackByNotificationId"
            class="notification-item"
            [class.unread]="!notification.isRead"
            [class.priority-critical]="notification.priority === 'Critical'"
            [class.priority-high]="notification.priority === 'High'"
            (click)="onNotificationClick(notification)"
          >
            <div class="notification-icon">
              <mat-icon [class]="getNotificationIconClass(notification)">
                {{ getNotificationIcon(notification) }}
              </mat-icon>
            </div>

            <div class="notification-content">
              <h4 class="notification-title">{{ notification.title }}</h4>
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
                <span class="notification-time">{{ getRelativeTime(notification.createdAt) }}</span>
              </div>
            </div>

            <div class="notification-actions">
              <button 
                mat-icon-button 
                (click)="markAsRead(notification, $event)" 
                *ngIf="!notification.isRead"
                matTooltip="Mark as read"
              >
                <mat-icon>done</mat-icon>
              </button>
              <button 
                mat-icon-button 
                (click)="deleteNotification(notification, $event)"
                matTooltip="Delete"
              >
                <mat-icon>delete</mat-icon>
              </button>
            </div>
          </div>
        </div>

        <mat-divider *ngIf="notifications().length > 5"></mat-divider>

        <!-- View All Link -->
        <div class="view-all" *ngIf="notifications().length > 5" (click)="$event.stopPropagation()">
          <button mat-button routerLink="/notifications">
            View All Notifications ({{ notifications().length }})
          </button>
        </div>
      </mat-menu>
    </div>
  `,
  styles: [`
    .notification-center {
      display: flex;
      align-items: center;
      gap: 8px;
      position: relative;
    }

    .notification-bell {
      color: inherit;
    }

    .connection-status {
      opacity: 0.5;
      transition: opacity 0.3s ease;
    }

    .connection-status.connected {
      opacity: 1;
      color: #4caf50;
    }

    .connection-status.connecting {
      opacity: 0.7;
      color: #ff9800;
    }

    .connection-status mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }

    .notification-menu {
      width: 400px;
      max-height: 600px;
    }

    .notification-header {
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f5f5f5;
    }

    .notification-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }

    .header-actions {
      display: flex;
      gap: 4px;
    }

    .no-notifications {
      padding: 32px 16px;
      text-align: center;
      color: #666;
    }

    .no-notifications mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      opacity: 0.5;
      margin-bottom: 8px;
    }

    .enable-notifications-btn {
      margin-top: 16px;
    }

    .notifications-list {
      max-height: 400px;
      overflow-y: auto;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      padding: 12px 16px;
      border-bottom: 1px solid #eee;
      cursor: pointer;
      transition: background-color 0.2s ease;
      position: relative;
    }

    .notification-item:hover {
      background-color: #f5f5f5;
    }

    .notification-item.unread {
      background-color: #e3f2fd;
      border-left: 4px solid #2196f3;
    }

    .notification-item.priority-critical {
      border-left-color: #f44336;
    }

    .notification-item.priority-high {
      border-left-color: #ff9800;
    }

    .notification-icon {
      margin-right: 12px;
      margin-top: 4px;
    }

    .notification-icon mat-icon {
      font-size: 20px;
      height: 20px;
      width: 20px;
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

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-title {
      margin: 0 0 4px 0;
      font-size: 14px;
      font-weight: 500;
      line-height: 1.2;
    }

    .notification-message {
      margin: 0 0 8px 0;
      font-size: 13px;
      color: #666;
      line-height: 1.3;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }

    .notification-meta mat-chip-set {
      display: flex;
      gap: 4px;
    }

    .notification-meta mat-chip {
      font-size: 10px;
      height: 18px;
      line-height: 18px;
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
      font-size: 11px;
      color: #999;
    }

    .notification-actions {
      margin-left: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .notification-actions button {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }

    .notification-actions mat-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
    }

    .view-all {
      padding: 12px 16px;
      text-align: center;
      background: #f5f5f5;
    }

    .view-all button {
      width: 100%;
    }

    @media (max-width: 768px) {
      .notification-menu {
        width: 350px;
      }
      
      .notification-item {
        padding: 10px 12px;
      }
    }
  `]
})
export class NotificationCenterComponent implements OnInit {
  constructor(
    private notificationService: NotificationService,
    private realTimeService: RealTimeService,
    private snackBar: MatSnackBar
  ) {}
  
  // Service data - getter properties to avoid initialization issues
  get notifications() {
    return this.notificationService.notifications;
  }
  
  get unreadCount() {
    return this.notificationService.unreadCount;
  }
  
  // Real-time connection status - computed properties
  isConnected = computed(() => this.realTimeService.connectionStatus().isConnected);
  isConnecting = computed(() => this.realTimeService.isConnecting());
  
  // Computed properties
  recentNotifications = computed(() => 
    this.notifications().slice(0, 5) // Show only recent 5 in dropdown
  );

  ngOnInit(): void {
    // Load initial notifications
    this.notificationService.loadNotifications();
    
    // Only request permission if user hasn't been asked before
    if (Notification.permission === 'default') {
      // Don't auto-request permission, let user decide from settings
      console.log('Browser notifications available - configure in notification preferences');
    }
  }

  async requestNotificationPermission(): Promise<void> {
    // Only request permission if explicitly called (e.g., from settings)
    const granted = await this.realTimeService.requestNotificationPermission();
    if (!granted) {
      this.snackBar.open('Browser notifications are disabled. Enable them in your browser settings for real-time alerts.', 'Close', {
        duration: 3000
      });
    } else {
      this.snackBar.open('Browser notifications enabled successfully!', 'Close', {
        duration: 2000
      });
    }
  }

  hasNotificationPermission(): boolean {
    return Notification.permission === 'granted';
  }

  async markAsRead(notification: NotificationDto, event: Event): Promise<void> {
    event.stopPropagation();
    
    try {
      await this.notificationService.markAsRead(notification.id).toPromise();
      this.notificationService.updateNotification({ ...notification, isRead: true });
      
      this.snackBar.open('Notification marked as read', 'Close', {
        duration: 2000
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      this.snackBar.open('Failed to mark notification as read', 'Close', {
        duration: 3000
      });
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await this.notificationService.markAllAsRead();
      this.snackBar.open('All notifications marked as read', 'Close', {
        duration: 2000
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      this.snackBar.open('Failed to mark all notifications as read', 'Close', {
        duration: 3000
      });
    }
  }

  async deleteNotification(notification: NotificationDto, event: Event): Promise<void> {
    event.stopPropagation();
    
    try {
      await this.notificationService.deleteNotification(notification.id).toPromise();
      this.notificationService.removeNotification(notification.id);
      
      this.snackBar.open('Notification deleted', 'Close', {
        duration: 2000
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      this.snackBar.open('Failed to delete notification', 'Close', {
        duration: 3000
      });
    }
  }

  async refreshNotifications(): Promise<void> {
    await this.notificationService.loadNotifications();
    this.snackBar.open('Notifications refreshed', 'Close', {
      duration: 1000
    });
  }

  onNotificationClick(notification: NotificationDto): void {
    // Mark as read if not already read
    if (!notification.isRead) {
      this.markAsRead(notification, new Event('click'));
    }

    // Navigate to action URL if available
    if (notification.actionUrl) {
      // Use router navigation or window.location based on URL
      if (notification.actionUrl.startsWith('/')) {
        // Internal route - could add router navigation here
        window.location.href = notification.actionUrl;
      } else {
        // External URL
        window.open(notification.actionUrl, '_blank');
      }
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

  getConnectionTooltip(): string {
    if (this.isConnecting()) return 'Connecting to real-time notifications...';
    return this.isConnected() ? 'Real-time notifications connected' : 'Real-time notifications disconnected';
  }

  getRelativeTime(dateString: string): string {
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
  }
}
