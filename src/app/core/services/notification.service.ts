import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: 'Info' | 'Warning' | 'Error' | 'Success';
  priority: 'Low' | 'Normal' | 'High' | 'Critical';
  isRead: boolean;
  createdAt: string;
  userId: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationStatsDto {
  totalNotifications: number;
  unreadNotifications: number;
  readNotifications: number;
  notificationsByType: { [key: string]: number };
  notificationsByPriority: { [key: string]: number };
}

export interface NotificationFilterDto {
  isRead?: boolean;
  type?: string;
  priority?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;
  
  // Signal-based reactive state
  notifications = signal<NotificationDto[]>([]);
  unreadCount = signal<number>(0);
  stats = signal<NotificationStatsDto | null>(null);
  
  // For real-time updates
  private notificationsSubject = new BehaviorSubject<NotificationDto[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadNotifications();
    this.loadStats();
  }

  // Get user notifications with filtering
  getNotifications(filter?: NotificationFilterDto): Observable<{
    notifications: NotificationDto[];
    totalCount: number;
    page: number;
    pageSize: number;
  }> {
    const params = filter ? this.buildQueryParams(filter) : {};
    return this.http.get<any>(`${this.apiUrl}`, { params }).pipe(
      catchError((error) => {
        console.warn('Backend not available, using mock data:', error);
        return of({
          notifications: this.getMockNotifications(),
          totalCount: 3,
          page: 1,
          pageSize: 10
        });
      })
    );
  }

  // Get notification statistics
  getNotificationStats(): Observable<NotificationStatsDto> {
    return this.http.get<NotificationStatsDto>(`${this.apiUrl}/stats`).pipe(
      catchError((error) => {
        console.warn('Backend not available, using mock stats:', error);
        return of({
          totalNotifications: 3,
          unreadNotifications: 2,
          readNotifications: 1,
          notificationsByType: { Info: 1, Success: 2 },
          notificationsByPriority: { Normal: 2, Low: 1 }
        });
      })
    );
  }

  // Mark notification as read
  markAsRead(notificationId: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  // Mark multiple notifications as read
  markMultipleAsRead(notificationIds: string[]): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/mark-read`, { notificationIds });
  }

  // Delete notification
  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${notificationId}`);
  }

  // Create notification (admin only)
  createNotification(notification: Partial<NotificationDto>): Observable<NotificationDto> {
    return this.http.post<NotificationDto>(`${this.apiUrl}`, notification);
  }

  // Broadcast notification (admin only)
  broadcastNotification(notification: {
    title: string;
    message: string;
    type: string;
    priority: string;
    actionUrl?: string;
    actionText?: string;
  }): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/broadcast`, notification);
  }

  // Load notifications and update signals
  async loadNotifications(filter?: NotificationFilterDto): Promise<void> {
    try {
      const response = await this.getNotifications(filter).toPromise();
      if (response && response.notifications) {
        this.notifications.set(response.notifications);
        this.notificationsSubject.next(response.notifications);
        this.updateUnreadCount(response.notifications);
      } else {
        // Handle empty response or missing notifications array
        this.notifications.set([]);
        this.notificationsSubject.next([]);
        this.updateUnreadCount([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Set empty arrays on error to prevent undefined access
      this.notifications.set([]);
      this.notificationsSubject.next([]);
      this.updateUnreadCount([]);
    }
  }

  // Load statistics and update signal
  async loadStats(): Promise<void> {
    try {
      const stats = await this.getNotificationStats().toPromise();
      if (stats) {
        this.stats.set(stats);
        this.unreadCount.set(stats.unreadNotifications);
      }
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  }

  // Add new notification (for real-time updates)
  addNotification(notification: NotificationDto): void {
    const current = this.notifications();
    const updated = [notification, ...current];
    this.notifications.set(updated);
    this.notificationsSubject.next(updated);
    this.updateUnreadCount(updated);
  }

  // Update notification (for real-time updates)
  updateNotification(updatedNotification: NotificationDto): void {
    const current = this.notifications();
    const updated = current.map(n => 
      n.id === updatedNotification.id ? updatedNotification : n
    );
    this.notifications.set(updated);
    this.notificationsSubject.next(updated);
    this.updateUnreadCount(updated);
  }

  // Remove notification (for real-time updates)
  removeNotification(notificationId: string): void {
    const current = this.notifications();
    const updated = current.filter(n => n.id !== notificationId);
    this.notifications.set(updated);
    this.notificationsSubject.next(updated);
    this.updateUnreadCount(updated);
  }

  // Helper methods
  private updateUnreadCount(notifications: NotificationDto[]): void {
    if (!notifications) {
      this.unreadCount.set(0);
      return;
    }
    const unread = notifications.filter(n => !n.isRead).length;
    this.unreadCount.set(unread);
  }

  private buildQueryParams(filter: NotificationFilterDto): any {
    const params: any = {};
    
    if (filter.isRead !== undefined) params.isRead = filter.isRead.toString();
    if (filter.type) params.type = filter.type;
    if (filter.priority) params.priority = filter.priority;
    if (filter.fromDate) params.fromDate = filter.fromDate;
    if (filter.toDate) params.toDate = filter.toDate;
    if (filter.page) params.page = filter.page.toString();
    if (filter.pageSize) params.pageSize = filter.pageSize.toString();
    
    return params;
  }

  // Utility methods for notification management
  async markAllAsRead(): Promise<void> {
    const unreadNotifications = this.notifications().filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;

    const notificationIds = unreadNotifications.map(n => n.id);
    try {
      await this.markMultipleAsRead(notificationIds).toPromise();
      await this.loadNotifications(); // Refresh
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  // Get notifications by priority
  getNotificationsByPriority(priority: string): NotificationDto[] {
    return this.notifications().filter(n => n.priority === priority);
  }

  // Get notifications by type
  getNotificationsByType(type: string): NotificationDto[] {
    return this.notifications().filter(n => n.type === type);
  }

  // Mark notification as unread
  markAsUnread(id: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}/unread`, {}).pipe(
      tap(() => {
        const notification = this.notifications().find(n => n.id === id);
        if (notification && notification.isRead) {
          this.updateNotification({ ...notification, isRead: false });
        }
      }),
      catchError(this.handleError<void>('markAsUnread'))
    );
  }

  // Clear all notifications
  async clearAllNotifications(): Promise<void> {
    try {
      await this.http.delete<void>(`${this.apiUrl}/clear-all`).toPromise();
      this.notifications.set([]);
      this.notificationsSubject.next([]);
      this.unreadCount.set(0);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      throw error;
    }
  }

  // Mock notifications for when backend is not available
  private getMockNotifications(): NotificationDto[] {
    return [
      {
        id: 'mock-1',
        title: '🔧 Development Mode',
        message: 'Backend API is not running. Using mock notifications for testing.',
        type: 'Info',
        priority: 'Normal',
        isRead: false,
        createdAt: new Date().toISOString(),
        userId: 'mock-user',
        actionUrl: '/notifications/preferences'
      },
      {
        id: 'mock-2',
        title: '🎉 Welcome!',
        message: 'Welcome to the Project Controls Reporting Tool notification system.',
        type: 'Success',
        priority: 'Normal',
        isRead: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        userId: 'mock-user'
      },
      {
        id: 'mock-3',
        title: '⚙️ System Ready',
        message: 'All notification features are working in development mode.',
        type: 'Success',
        priority: 'Low',
        isRead: true,
        createdAt: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        userId: 'mock-user'
      }
    ];
  }

  // Error handler
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      return of(result as T);
    };
  }
}
