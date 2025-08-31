import { Injectable } from '@angular/core';
import { RealTimeService } from './real-time.service';
import { NotificationService } from './notification.service';
import { AuthService } from './auth.service';
import { ReportsService } from './reports.service';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface WorkflowNotificationConfig {
  enableEmail: boolean;
  enablePush: boolean;
  enableSms: boolean;
  enableTeams: boolean;
  enableSlack: boolean;
}

export interface WorkflowEvent {
  type: 'submission' | 'approval_required' | 'approved' | 'rejected' | 'due_date' | 'escalation';
  reportId: string;
  reportTitle: string;
  userId: string;
  userRole: string;
  department: string;
  timestamp: Date;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class WorkflowNotificationService {
  private workflowEvents$ = new Subject<WorkflowEvent>();
  
  // Default notification configuration
  private defaultConfig: WorkflowNotificationConfig = {
    enableEmail: true,
    enablePush: true,
    enableSms: false,
    enableTeams: true,
    enableSlack: false
  };

  constructor(
    private realTimeService: RealTimeService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private reportsService: ReportsService
  ) {
    this.initializeWorkflowEventHandlers();
  }

  // Initialize workflow event handlers
  private initializeWorkflowEventHandlers(): void {
    // Listen to real-time workflow events from SignalR
    this.setupSignalREventHandlers();
    
    // Subscribe to workflow events for processing
    this.workflowEvents$.subscribe(event => {
      this.processWorkflowEvent(event);
    });
  }

  // Setup SignalR event handlers for workflow events
  private setupSignalREventHandlers(): void {
    // Note: These handlers are already set up in RealTimeService
    // We'll enhance them to trigger workflow notifications
    
    // Listen for report submission events
    this.subscribeToReportEvents();
  }

  // Subscribe to report workflow events
  private subscribeToReportEvents(): void {
    // This would integrate with the reports service to listen for workflow events
    // For now, we'll create methods that can be called when workflow events occur
  }

  // Process workflow events and trigger appropriate notifications
  private async processWorkflowEvent(event: WorkflowEvent): Promise<void> {
    console.log('Processing workflow event:', event);

    const config = await this.getUserNotificationConfig(event.userId);
    
    switch (event.type) {
      case 'submission':
        await this.handleReportSubmission(event, config);
        break;
      case 'approval_required':
        await this.handleApprovalRequired(event, config);
        break;
      case 'approved':
        await this.handleReportApproved(event, config);
        break;
      case 'rejected':
        await this.handleReportRejected(event, config);
        break;
      case 'due_date':
        await this.handleDueDateReminder(event, config);
        break;
      case 'escalation':
        await this.handleEscalation(event, config);
        break;
    }
  }

  // Handle report submission notifications
  private async handleReportSubmission(event: WorkflowEvent, config: WorkflowNotificationConfig): Promise<void> {
    const notification = {
      title: '📝 Report Submitted Successfully',
      message: `Your report "${event.reportTitle}" has been submitted for review.`,
      type: 'Success' as const,
      priority: 'Normal' as const,
      actionUrl: `/reports/${event.reportId}`,
      metadata: {
        reportId: event.reportId,
        eventType: 'submission'
      }
    };

    // Send in-app notification
    await this.sendInAppNotification(event.userId, notification);

    // Send multi-channel notifications based on user preferences
    if (config.enableEmail) {
      await this.sendEmailNotification(event.userId, 'report_submitted', {
        reportTitle: event.reportTitle,
        reportId: event.reportId,
        submissionTime: event.timestamp
      });
    }

    if (config.enableTeams) {
      await this.sendTeamsNotification(event.department, {
        title: '📝 New Report Submitted',
        summary: `${await this.getUserName(event.userId)} submitted "${event.reportTitle}"`,
        reportId: event.reportId
      });
    }

    // Notify managers that approval is required
    await this.notifyManagersForApproval(event);
  }

  // Handle approval required notifications (to managers)
  private async handleApprovalRequired(event: WorkflowEvent, config: WorkflowNotificationConfig): Promise<void> {
    const managers = await this.getReportManagers(event.reportId);
    
    for (const manager of managers) {
      const notification = {
        title: '⏳ Approval Required',
        message: `Report "${event.reportTitle}" requires your approval.`,
        type: 'Warning' as const,
        priority: 'High' as const,
        actionUrl: `/reports/${event.reportId}`,
        metadata: {
          reportId: event.reportId,
          eventType: 'approval_required',
          submittedBy: event.userId
        }
      };

      // Send in-app notification
      await this.sendInAppNotification(manager.id, notification);

      const managerConfig = await this.getUserNotificationConfig(manager.id);

      // Send email notification
      if (managerConfig.enableEmail) {
        await this.sendEmailNotification(manager.id, 'approval_required', {
          reportTitle: event.reportTitle,
          reportId: event.reportId,
          submittedBy: await this.getUserName(event.userId),
          submissionTime: event.timestamp
        });
      }

      // Send Teams notification
      if (managerConfig.enableTeams) {
        await this.sendTeamsNotification(manager.department, {
          title: '⏳ Approval Required',
          summary: `Report "${event.reportTitle}" needs your approval`,
          reportId: event.reportId,
          priority: 'High'
        });
      }

      // Send SMS for critical/urgent reports
      if (managerConfig.enableSms && event.metadata?.urgent) {
        await this.sendSmsNotification(manager.id, `URGENT: Report "${event.reportTitle}" requires immediate approval. View: ${window.location.origin}/reports/${event.reportId}`);
      }
    }
  }

  // Handle report approved notifications
  private async handleReportApproved(event: WorkflowEvent, config: WorkflowNotificationConfig): Promise<void> {
    const notification = {
      title: '✅ Report Approved',
      message: `Your report "${event.reportTitle}" has been approved.`,
      type: 'Success' as const,
      priority: 'Normal' as const,
      actionUrl: `/reports/${event.reportId}`,
      metadata: {
        reportId: event.reportId,
        eventType: 'approved',
        approvedBy: event.metadata?.approvedBy
      }
    };

    // Send in-app notification to report submitter
    await this.sendInAppNotification(event.userId, notification);

    // Send multi-channel notifications
    if (config.enableEmail) {
      await this.sendEmailNotification(event.userId, 'report_approved', {
        reportTitle: event.reportTitle,
        reportId: event.reportId,
        approvedBy: await this.getUserName(event.metadata?.approvedBy),
        approvalTime: event.timestamp
      });
    }

    if (config.enableTeams) {
      await this.sendTeamsNotification(event.department, {
        title: '✅ Report Approved',
        summary: `Report "${event.reportTitle}" has been approved`,
        reportId: event.reportId
      });
    }

    // Notify stakeholders if configured
    await this.notifyStakeholders(event, 'approved');
  }

  // Handle report rejected notifications
  private async handleReportRejected(event: WorkflowEvent, config: WorkflowNotificationConfig): Promise<void> {
    const notification = {
      title: '❌ Report Rejected',
      message: `Your report "${event.reportTitle}" has been rejected. Please review and resubmit.`,
      type: 'Error' as const,
      priority: 'High' as const,
      actionUrl: `/reports/${event.reportId}`,
      metadata: {
        reportId: event.reportId,
        eventType: 'rejected',
        rejectedBy: event.metadata?.rejectedBy,
        rejectionReason: event.metadata?.rejectionReason
      }
    };

    // Send in-app notification
    await this.sendInAppNotification(event.userId, notification);

    // Send detailed email with rejection reasons
    if (config.enableEmail) {
      await this.sendEmailNotification(event.userId, 'report_rejected', {
        reportTitle: event.reportTitle,
        reportId: event.reportId,
        rejectedBy: await this.getUserName(event.metadata?.rejectedBy),
        rejectionReason: event.metadata?.rejectionReason,
        rejectionTime: event.timestamp
      });
    }

    // Send Teams notification for team awareness
    if (config.enableTeams) {
      await this.sendTeamsNotification(event.department, {
        title: '❌ Report Rejected',
        summary: `Report "${event.reportTitle}" was rejected and needs revision`,
        reportId: event.reportId,
        priority: 'High'
      });
    }

    // Send SMS for urgent rejections
    if (config.enableSms && event.metadata?.urgent) {
      await this.sendSmsNotification(event.userId, `URGENT: Report "${event.reportTitle}" rejected. Reason: ${event.metadata?.rejectionReason}. Resubmit ASAP.`);
    }
  }

  // Handle due date reminder notifications
  private async handleDueDateReminder(event: WorkflowEvent, config: WorkflowNotificationConfig): Promise<void> {
    const daysUntilDue = event.metadata?.daysUntilDue || 0;
    const isOverdue = daysUntilDue < 0;
    const isUrgent = Math.abs(daysUntilDue) <= 1;

    const notification = {
      title: isOverdue ? '🚨 Report Overdue' : '⏰ Due Date Reminder',
      message: isOverdue 
        ? `Report "${event.reportTitle}" is ${Math.abs(daysUntilDue)} day(s) overdue.`
        : `Report "${event.reportTitle}" is due in ${daysUntilDue} day(s).`,
      type: isOverdue ? 'Error' as const : 'Warning' as const,
      priority: isUrgent ? 'Critical' as const : 'High' as const,
      actionUrl: `/reports/${event.reportId}`,
      metadata: {
        reportId: event.reportId,
        eventType: 'due_date',
        daysUntilDue,
        isOverdue
      }
    };

    // Send in-app notification
    await this.sendInAppNotification(event.userId, notification);

    // Send email reminder
    if (config.enableEmail) {
      await this.sendEmailNotification(event.userId, isOverdue ? 'report_overdue' : 'due_date_reminder', {
        reportTitle: event.reportTitle,
        reportId: event.reportId,
        dueDate: event.metadata?.dueDate,
        daysUntilDue
      });
    }

    // Send SMS for urgent/overdue reports
    if (config.enableSms && (isOverdue || isUrgent)) {
      const message = isOverdue 
        ? `OVERDUE: Report "${event.reportTitle}" is ${Math.abs(daysUntilDue)} days overdue. Submit immediately.`
        : `URGENT: Report "${event.reportTitle}" due in ${daysUntilDue} day(s). Submit soon.`;
      
      await this.sendSmsNotification(event.userId, message);
    }

    // Escalate to managers if overdue
    if (isOverdue) {
      await this.escalateToManagers(event);
    }
  }

  // Handle escalation notifications (to senior management)
  private async handleEscalation(event: WorkflowEvent, config: WorkflowNotificationConfig): Promise<void> {
    const seniors = await this.getSeniorManagers(event.department);
    
    for (const senior of seniors) {
      const notification = {
        title: '🚨 Escalation Required',
        message: `Report "${event.reportTitle}" requires senior management attention.`,
        type: 'Error' as const,
        priority: 'Critical' as const,
        actionUrl: `/reports/${event.reportId}`,
        metadata: {
          reportId: event.reportId,
          eventType: 'escalation',
          escalationReason: event.metadata?.reason
        }
      };

      // Send in-app notification
      await this.sendInAppNotification(senior.id, notification);

      const seniorConfig = await this.getUserNotificationConfig(senior.id);

      // Send email escalation
      if (seniorConfig.enableEmail) {
        await this.sendEmailNotification(senior.id, 'escalation', {
          reportTitle: event.reportTitle,
          reportId: event.reportId,
          escalationReason: event.metadata?.reason,
          originalSubmitter: await this.getUserName(event.userId)
        });
      }

      // Send Teams escalation
      if (seniorConfig.enableTeams) {
        await this.sendTeamsNotification('management', {
          title: '🚨 Escalation Alert',
          summary: `Report "${event.reportTitle}" escalated to senior management`,
          reportId: event.reportId,
          priority: 'Critical'
        });
      }

      // Always send SMS for escalations
      await this.sendSmsNotification(senior.id, `ESCALATION: Report "${event.reportTitle}" requires your immediate attention. View details at ${window.location.origin}/reports/${event.reportId}`);
    }
  }

  // Public methods to trigger workflow events
  async triggerReportSubmission(reportId: string, reportTitle: string): Promise<void> {
    const currentUser = this.authService.currentUser();
    if (!currentUser) return;

    const event: WorkflowEvent = {
      type: 'submission',
      reportId,
      reportTitle,
      userId: currentUser.id,
      userRole: currentUser.role.toString(),
      department: currentUser.department.toString(),
      timestamp: new Date()
    };

    this.workflowEvents$.next(event);
  }

  async triggerApprovalRequired(reportId: string, reportTitle: string, submitterId: string): Promise<void> {
    const submitter = await this.getUserById(submitterId);
    if (!submitter) return;

    const event: WorkflowEvent = {
      type: 'approval_required',
      reportId,
      reportTitle,
      userId: submitterId,
      userRole: submitter.role,
      department: submitter.department,
      timestamp: new Date()
    };

    this.workflowEvents$.next(event);
  }

  async triggerReportApproved(reportId: string, reportTitle: string, submitterId: string, approverId: string): Promise<void> {
    const submitter = await this.getUserById(submitterId);
    if (!submitter) return;

    const event: WorkflowEvent = {
      type: 'approved',
      reportId,
      reportTitle,
      userId: submitterId,
      userRole: submitter.role,
      department: submitter.department,
      timestamp: new Date(),
      metadata: { approvedBy: approverId }
    };

    this.workflowEvents$.next(event);
  }

  async triggerReportRejected(reportId: string, reportTitle: string, submitterId: string, rejectorId: string, reason: string): Promise<void> {
    const submitter = await this.getUserById(submitterId);
    if (!submitter) return;

    const event: WorkflowEvent = {
      type: 'rejected',
      reportId,
      reportTitle,
      userId: submitterId,
      userRole: submitter.role,
      department: submitter.department,
      timestamp: new Date(),
      metadata: { 
        rejectedBy: rejectorId,
        rejectionReason: reason
      }
    };

    this.workflowEvents$.next(event);
  }

  // Helper methods for sending notifications to different channels
  private async sendInAppNotification(userId: string, notification: any): Promise<void> {
    try {
      // Send via real-time service to specific user
      await this.realTimeService.sendNotificationToUser(userId, notification);
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
    }
  }

  private async sendEmailNotification(userId: string, template: string, data: any): Promise<void> {
    try {
      // This would integrate with the backend email service
      const response = await fetch(`/api/notifications/email/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authService.getToken()}`
        },
        body: JSON.stringify({
          template,
          data
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send email notification');
      }
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }

  private async sendTeamsNotification(channel: string, message: any): Promise<void> {
    try {
      // This would integrate with the backend Teams service
      const response = await fetch('/api/teams/send-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authService.getToken()}`
        },
        body: JSON.stringify({
          channel,
          message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send Teams notification');
      }
    } catch (error) {
      console.error('Failed to send Teams notification:', error);
    }
  }

  private async sendSmsNotification(userId: string, message: string): Promise<void> {
    try {
      // This would integrate with the backend SMS service
      const response = await fetch(`/api/sms/send/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.authService.getToken()}`
        },
        body: JSON.stringify({
          message
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send SMS notification');
      }
    } catch (error) {
      console.error('Failed to send SMS notification:', error);
    }
  }

  // Helper methods for user and management data
  private async getUserNotificationConfig(userId: string): Promise<WorkflowNotificationConfig> {
    try {
      const response = await fetch(`/api/users/${userId}/notification-preferences`, {
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get user notification config:', error);
    }

    return this.defaultConfig;
  }

  private async getUserName(userId: string): Promise<string> {
    try {
      const user = await this.getUserById(userId);
      return user ? `${user.firstName} ${user.lastName}` : 'Unknown User';
    } catch (error) {
      console.error('Failed to get user name:', error);
      return 'Unknown User';
    }
  }

  private async getUserById(userId: string): Promise<any> {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get user:', error);
    }

    return null;
  }

  private async getReportManagers(reportId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/reports/${reportId}/managers`, {
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get report managers:', error);
    }

    return [];
  }

  private async getSeniorManagers(department: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/users/senior-managers/${department}`, {
        headers: {
          'Authorization': `Bearer ${this.authService.getToken()}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Failed to get senior managers:', error);
    }

    return [];
  }

  private async notifyManagersForApproval(event: WorkflowEvent): Promise<void> {
    const approvalEvent: WorkflowEvent = {
      ...event,
      type: 'approval_required'
    };

    this.workflowEvents$.next(approvalEvent);
  }

  private async notifyStakeholders(event: WorkflowEvent, eventType: string): Promise<void> {
    // Implementation for notifying stakeholders based on report type and department
    console.log('Notifying stakeholders for:', eventType, event.reportId);
  }

  private async escalateToManagers(event: WorkflowEvent): Promise<void> {
    const escalationEvent: WorkflowEvent = {
      ...event,
      type: 'escalation',
      metadata: {
        ...event.metadata,
        reason: 'Report overdue'
      }
    };

    this.workflowEvents$.next(escalationEvent);
  }

  // Observable for subscribing to workflow events
  get workflowEvents(): Observable<WorkflowEvent> {
    return this.workflowEvents$.asObservable();
  }
}
