// Audit Trail Logging utility for tracking all admin actions

export type AuditAction = 
  | 'TICKET_APPROVED'
  | 'TICKET_REJECTED'
  | 'TEST_ALLOCATED'
  | 'TEST_RESCHEDULED'
  | 'TEST_CANCELLED'
  | 'TEST_TERMINATED_MALPRACTICE'
  | 'STUDENT_CREATED'
  | 'STUDENT_UPDATED'
  | 'STUDENT_DELETED'
  | 'ADMIN_LOGIN'
  | 'ADMIN_LOGOUT'
  | 'SETTINGS_CHANGED';

export interface AuditTrailEntry {
  id?: string;
  admin_id: string;
  admin_email: string;
  action: AuditAction;
  resource_type: string; // 'TICKET', 'ALLOCATION', 'STUDENT', etc.
  resource_id: string;
  target_student_id?: string;
  target_student_email?: string;
  details: Record<string, any>;
  status: 'SUCCESS' | 'FAILED';
  ip_address?: string;
  user_agent?: string;
  timestamp: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
}

export class AuditLogger {
  private apiUrl: string;
  private token: string;
  private adminId: string;
  private adminEmail: string;

  constructor(apiUrl: string, token: string, adminId: string, adminEmail: string) {
    this.apiUrl = apiUrl;
    this.token = token;
    this.adminId = adminId;
    this.adminEmail = adminEmail;
  }

  /**
   * Log an audit trail entry
   */
  async logAction(
    action: AuditAction,
    resourceType: string,
    resourceId: string,
    details: Record<string, any>,
    targetStudentId?: string,
    targetStudentEmail?: string,
    changes?: AuditTrailEntry['changes']
  ): Promise<boolean> {
    try {
      const entry: AuditTrailEntry = {
        admin_id: this.adminId,
        admin_email: this.adminEmail,
        action,
        resource_type: resourceType,
        resource_id: resourceId,
        target_student_id: targetStudentId,
        target_student_email: targetStudentEmail,
        details,
        status: 'SUCCESS',
        timestamp: new Date().toISOString(),
        changes,
        ip_address: await this.getClientIpAddress(),
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      };

      const response = await fetch(`${this.apiUrl}/api/admin/audit-trail`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        console.error('Failed to log audit trail:', response.statusText);
        return false;
      }

      console.log(`[AUDIT] ${action} - ${resourceType}:${resourceId}`);
      return true;
    } catch (error) {
      console.error('Error logging audit trail:', error);
      return false;
    }
  }

  /**
   * Log ticket approval action
   */
  async logTicketApproved(
    ticketId: string,
    studentId: string,
    studentEmail: string,
    testType: string,
    autoAllocate: boolean,
    notes: string = ''
  ): Promise<boolean> {
    return this.logAction(
      'TICKET_APPROVED',
      'TICKET',
      ticketId,
      {
        test_type: testType,
        auto_allocate: autoAllocate,
        notes,
        approved_at: new Date().toISOString(),
      },
      studentId,
      studentEmail
    );
  }

  /**
   * Log ticket rejection action
   */
  async logTicketRejected(
    ticketId: string,
    studentId: string,
    studentEmail: string,
    testType: string,
    rejectionReason: string,
    notes: string = ''
  ): Promise<boolean> {
    return this.logAction(
      'TICKET_REJECTED',
      'TICKET',
      ticketId,
      {
        test_type: testType,
        rejection_reason: rejectionReason,
        notes,
        rejected_at: new Date().toISOString(),
      },
      studentId,
      studentEmail
    );
  }

  /**
   * Log test allocation action
   */
  async logTestAllocated(
    allocationId: string,
    studentId: string,
    studentEmail: string,
    testType: string,
    scheduledDate: string,
    scheduledTime: string,
    questionCount: number,
    duration: number,
    notes: string = ''
  ): Promise<boolean> {
    return this.logAction(
      'TEST_ALLOCATED',
      'ALLOCATION',
      allocationId,
      {
        test_type: testType,
        scheduled_date: scheduledDate,
        scheduled_time: scheduledTime,
        question_count: questionCount,
        duration_minutes: duration,
        notes,
        allocated_at: new Date().toISOString(),
      },
      studentId,
      studentEmail
    );
  }

  /**
   * Log test rescheduling action
   */
  async logTestRescheduled(
    allocationId: string,
    studentId: string,
    studentEmail: string,
    oldScheduledDate: string,
    oldScheduledTime: string,
    newScheduledDate: string,
    newScheduledTime: string,
    reason: string = '',
    notes: string = ''
  ): Promise<boolean> {
    return this.logAction(
      'TEST_RESCHEDULED',
      'ALLOCATION',
      allocationId,
      {
        old_scheduled: `${oldScheduledDate} ${oldScheduledTime}`,
        new_scheduled: `${newScheduledDate} ${newScheduledTime}`,
        reason,
        notes,
        rescheduled_at: new Date().toISOString(),
      },
      studentId,
      studentEmail,
      {
        before: {
          scheduled_date: oldScheduledDate,
          scheduled_time: oldScheduledTime,
        },
        after: {
          scheduled_date: newScheduledDate,
          scheduled_time: newScheduledTime,
        },
      }
    );
  }

  /**
   * Log test cancellation action
   */
  async logTestCancelled(
    allocationId: string,
    studentId: string,
    studentEmail: string,
    cancellationReason: string,
    notes: string = ''
  ): Promise<boolean> {
    return this.logAction(
      'TEST_CANCELLED',
      'ALLOCATION',
      allocationId,
      {
        cancellation_reason: cancellationReason,
        notes,
        cancelled_at: new Date().toISOString(),
      },
      studentId,
      studentEmail
    );
  }

  /**
   * Log malpractice termination
   */
  async logTestTerminatedMalpractice(
    allocationId: string,
    studentId: string,
    studentEmail: string,
    violationCount: number,
    violationType: string,
    notes: string = ''
  ): Promise<boolean> {
    return this.logAction(
      'TEST_TERMINATED_MALPRACTICE',
      'ALLOCATION',
      allocationId,
      {
        violation_count: violationCount,
        violation_type: violationType,
        notes,
        terminated_at: new Date().toISOString(),
      },
      studentId,
      studentEmail
    );
  }

  /**
   * Log admin login
   */
  async logAdminLogin(loginMethod: string = 'EMAIL'): Promise<boolean> {
    return this.logAction(
      'ADMIN_LOGIN',
      'ADMIN',
      this.adminId,
      {
        login_method: loginMethod,
        logged_in_at: new Date().toISOString(),
      }
    );
  }

  /**
   * Log admin logout
   */
  async logAdminLogout(): Promise<boolean> {
    return this.logAction(
      'ADMIN_LOGOUT',
      'ADMIN',
      this.adminId,
      {
        logged_out_at: new Date().toISOString(),
      }
    );
  }

  /**
   * Get client IP address (attempt)
   */
  private async getClientIpAddress(): Promise<string | undefined> {
    try {
      const response = await fetch('https://api.ipify.org?format=json', { 
        timeout: 5000 
      } as any);
      if (response.ok) {
        const data = await response.json();
        return data.ip;
      }
    } catch (error) {
      // Silently fail - IP is optional
    }
    return undefined;
  }

  /**
   * Fetch audit trail entries with filtering
   */
  async fetchAuditTrail(
    filters?: {
      action?: AuditAction;
      resourceType?: string;
      resourceId?: string;
      targetStudentId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AuditTrailEntry[]> {
    try {
      const params = new URLSearchParams();
      if (filters) {
        if (filters.action) params.append('action', filters.action);
        if (filters.resourceType) params.append('resource_type', filters.resourceType);
        if (filters.resourceId) params.append('resource_id', filters.resourceId);
        if (filters.targetStudentId) params.append('target_student_id', filters.targetStudentId);
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.offset) params.append('offset', filters.offset.toString());
      }

      const response = await fetch(
        `${this.apiUrl}/api/admin/audit-trail?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.entries || [];
      }
      return [];
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      return [];
    }
  }
}

/**
 * Create audit logger instance
 */
export function createAuditLogger(
  apiUrl: string,
  token: string,
  adminId: string,
  adminEmail: string
): AuditLogger {
  return new AuditLogger(apiUrl, token, adminId, adminEmail);
}
