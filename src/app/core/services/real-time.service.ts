import { Injectable, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import { NotificationService, NotificationDto } from './notification.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export interface ConnectionStatus {
  isConnected: boolean;
  connectionId?: string;
  lastConnected?: Date;
  reconnectAttempts: number;
}

@Injectable({
  providedIn: 'root'
})
export class RealTimeService {
  private hubConnection: HubConnection | null = null;
  private readonly hubUrl = `${environment.apiUrl}/notificationHub`;
  
  // Connection status signals
  connectionStatus = signal<ConnectionStatus>({
    isConnected: false,
    reconnectAttempts: 0
  });
  
  // Activity signals
  isConnecting = signal(false);
  lastActivity = signal<Date | null>(null);

  constructor(
    private notificationService: NotificationService,
    private authService: AuthService
  ) {
    // Initialize connection when user is authenticated
    this.authService.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        this.startConnection();
      } else {
        this.stopConnection();
      }
    });
  }

  // Start SignalR connection
  async startConnection(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      console.log('SignalR already connected');
      return;
    }

    this.isConnecting.set(true);

    try {
      // Build the connection
      this.hubConnection = new HubConnectionBuilder()
        .withUrl(this.hubUrl, {
          accessTokenFactory: () => this.authService.getToken() || ''
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start the connection
      await this.hubConnection.start();
      
      this.updateConnectionStatus(true);
      this.isConnecting.set(false);
      
      console.log('SignalR Connected successfully');
      
      // Join user group for targeted notifications
      await this.joinUserGroup();
      
    } catch (error) {
      console.warn('SignalR Connection failed (backend may not be running):', error);
      this.updateConnectionStatus(false);
      this.isConnecting.set(false);
      
      // Only retry if it's not a 404 (backend not available)
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (!errorMessage.includes('404')) {
        // Retry connection after 5 seconds
        setTimeout(() => {
          this.startConnection();
        }, 5000);
      }
    }
  }

  // Stop SignalR connection
  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        this.updateConnectionStatus(false);
        console.log('SignalR Connection stopped');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      }
    }
  }

  // Setup event handlers for SignalR
  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // Connection events
    this.hubConnection.onreconnecting(() => {
      console.log('SignalR Reconnecting...');
      this.updateConnectionStatus(false);
    });

    this.hubConnection.onreconnected(() => {
      console.log('SignalR Reconnected');
      this.updateConnectionStatus(true);
      this.joinUserGroup(); // Rejoin user group after reconnection
    });

    this.hubConnection.onclose(() => {
      console.log('SignalR Connection closed');
      this.updateConnectionStatus(false);
    });

    // Notification events from backend
    this.hubConnection.on('ReceiveNotification', (notification: NotificationDto) => {
      console.log('Received real-time notification:', notification);
      this.notificationService.addNotification(notification);
      this.lastActivity.set(new Date());
      this.showBrowserNotification(notification);
    });

    this.hubConnection.on('NotificationRead', (notificationId: string) => {
      console.log('Notification marked as read:', notificationId);
      // Update the notification in the service
      const current = this.notificationService.notifications();
      const updated = current.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      this.notificationService.notifications.set(updated);
      this.lastActivity.set(new Date());
    });

    this.hubConnection.on('NotificationDeleted', (notificationId: string) => {
      console.log('Notification deleted:', notificationId);
      this.notificationService.removeNotification(notificationId);
      this.lastActivity.set(new Date());
    });

    // Report workflow events
    this.hubConnection.on('ReportSubmitted', (data: any) => {
      console.log('Report submitted event:', data);
      this.lastActivity.set(new Date());
    });

    this.hubConnection.on('ReportApproved', (data: any) => {
      console.log('Report approved event:', data);
      this.lastActivity.set(new Date());
    });

    this.hubConnection.on('ReportRejected', (data: any) => {
      console.log('Report rejected event:', data);
      this.lastActivity.set(new Date());
    });

    // System events
    this.hubConnection.on('SystemBroadcast', (message: string) => {
      console.log('System broadcast:', message);
      this.lastActivity.set(new Date());
      // Show system notification
      this.showSystemNotification(message);
    });

    this.hubConnection.on('UserConnected', (userId: string) => {
      console.log('User connected:', userId);
    });

    this.hubConnection.on('UserDisconnected', (userId: string) => {
      console.log('User disconnected:', userId);
    });
  }

  // Join user-specific group for targeted notifications
  private async joinUserGroup(): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      try {
        const currentUser = this.authService.currentUser();
        if (currentUser && currentUser.id) {
          await this.hubConnection.invoke('JoinUserGroup', currentUser.id);
          console.log('Joined user group:', currentUser.id);
        }
      } catch (error) {
        console.error('Error joining user group:', error);
      }
    }
  }

  // Send notification to specific user (admin only)
  async sendNotificationToUser(userId: string, notification: any): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      try {
        await this.hubConnection.invoke('SendNotificationToUser', userId, notification);
        console.log('Notification sent to user:', userId);
      } catch (error) {
        console.error('Error sending notification to user:', error);
      }
    }
  }

  // Send notification to all users (admin only)
  async sendBroadcastNotification(notification: any): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      try {
        await this.hubConnection.invoke('SendBroadcastNotification', notification);
        console.log('Broadcast notification sent');
      } catch (error) {
        console.error('Error sending broadcast notification:', error);
      }
    }
  }

  // Send notification to department (manager only)
  async sendDepartmentNotification(department: string, notification: any): Promise<void> {
    if (this.hubConnection && this.hubConnection.state === 'Connected') {
      try {
        await this.hubConnection.invoke('SendDepartmentNotification', department, notification);
        console.log('Department notification sent:', department);
      } catch (error) {
        console.error('Error sending department notification:', error);
      }
    }
  }

  // Update connection status
  private updateConnectionStatus(isConnected: boolean): void {
    const current = this.connectionStatus();
    this.connectionStatus.set({
      ...current,
      isConnected,
      connectionId: this.hubConnection?.connectionId || undefined,
      lastConnected: isConnected ? new Date() : current.lastConnected,
      reconnectAttempts: isConnected ? 0 : current.reconnectAttempts + 1
    });
  }

  // Show browser notification if permitted
  private showBrowserNotification(notification: NotificationDto): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/assets/icons/icon-192x192.svg',
        badge: '/assets/icons/icon-72x72.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'Critical'
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          // Navigate to the action URL
          window.location.href = notification.actionUrl;
        }
        browserNotification.close();
      };

      // Auto close after 5 seconds unless critical
      if (notification.priority !== 'Critical') {
        setTimeout(() => browserNotification.close(), 5000);
      }
    }
  }

  // Show system notification
  private showSystemNotification(message: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification('System Notification', {
        body: message,
        icon: '/assets/icons/icon-192x192.svg',
        tag: 'system-broadcast',
        requireInteraction: true
      });

      setTimeout(() => notification.close(), 10000);
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Get connection info
  getConnectionInfo(): {
    isConnected: boolean;
    connectionId?: string;
    state?: string;
  } {
    return {
      isConnected: this.connectionStatus().isConnected,
      connectionId: this.hubConnection?.connectionId || undefined,
      state: this.hubConnection?.state
    };
  }

  // Reconnect manually
  async reconnect(): Promise<void> {
    await this.stopConnection();
    await this.startConnection();
  }
}
