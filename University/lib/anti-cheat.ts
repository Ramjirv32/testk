// Anti-cheat logging utility for GRE exams
// Tracks suspicious activities and logs them to server

export type MalpracticeEvent = 
  | 'TAB_SWITCH'
  | 'FULLSCREEN_EXIT'
  | 'COPY_PASTE'
  | 'WINDOW_BLUR'
  | 'SCREENSHOT_ATTEMPT'
  | 'DEV_TOOLS_OPEN';

export interface MalpracticeLog {
  allocation_id: string;
  event_type: MalpracticeEvent;
  timestamp: string;
  details?: Record<string, any>;
  severity: 'low' | 'medium' | 'high';
}

export class AntiCheatMonitor {
  private allocationId: string;
  private violationCount = 0;
  private maxViolations = 3;
  private token: string;
  private apiUrl: string;
  private isMonitoring = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor(allocationId: string, token: string, apiUrl: string) {
    this.allocationId = allocationId;
    this.token = token;
    this.apiUrl = apiUrl;
  }

  /**
   * Start monitoring for anti-cheat violations
   */
  start() {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitor tab/window switches
    this.monitorVisibilityChange();

    // Monitor fullscreen exit
    this.monitorFullscreenExit();

    // Monitor copy/paste attempts
    this.monitorCopyPaste();

    // Monitor window blur (user switching to another window)
    this.monitorWindowBlur();

    // Monitor dev tools
    this.monitorDevTools();

    console.log('Anti-cheat monitoring started for allocation:', this.allocationId);
  }

  /**
   * Stop monitoring
   */
  stop() {
    this.isMonitoring = false;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
    document.removeEventListener('copy', this.handleCopy);
    document.removeEventListener('paste', this.handlePaste);
    window.removeEventListener('blur', this.handleWindowBlur);
    document.removeEventListener('keydown', this.handleDevToolsDetection);
    console.log('Anti-cheat monitoring stopped');
  }

  /**
   * Monitor tab/window visibility changes
   */
  private monitorVisibilityChange = () => {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  };

  private handleVisibilityChange = async () => {
    if (document.hidden) {
      await this.logMalpracticeEvent('TAB_SWITCH', {
        documentHidden: true,
        timestamp: new Date().toISOString(),
      }, 'high');
      this.violationCount++;
      this.checkViolationThreshold();
    }
  };

  /**
   * Monitor fullscreen exit
   */
  requestFullscreen = async () => {
    this.emit('fullscreen_change', { isFullscreen: true });
    if (typeof document !== 'undefined' && document.documentElement) {
      try {
        if (!document.fullscreenElement) {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
          } else if ((document.documentElement as any).webkitRequestFullscreen) {
            await (document.documentElement as any).webkitRequestFullscreen();
          } else if ((document.documentElement as any).msRequestFullscreen) {
            await (document.documentElement as any).msRequestFullscreen();
          }
        }
      } catch (err) {
        console.warn('Fullscreen request failed:', err);
      }
    }
  };

  /**
   * Monitor fullscreen exit
   */
  private monitorFullscreenExit = () => {
    document.addEventListener('fullscreenchange', this.handleFullscreenChange);
  };

  private handleFullscreenChange = async () => {
    const isFS = !!document.fullscreenElement;
    this.emit('fullscreen_change', { isFullscreen: isFS });

    if (!isFS) {
      await this.logMalpracticeEvent('FULLSCREEN_EXIT', {
        fullscreenExited: true,
        timestamp: new Date().toISOString(),
      }, 'high');
      this.violationCount++;
      this.checkViolationThreshold();
    }
  };

  /**
   * Monitor copy attempts
   */
  private monitorCopyPaste = () => {
    document.addEventListener('copy', this.handleCopy);
    document.addEventListener('paste', this.handlePaste);
  };

  private handleCopy = async (e: ClipboardEvent) => {
    e.preventDefault();
    await this.logMalpracticeEvent('COPY_PASTE', {
      action: 'copy',
      selectedText: window.getSelection()?.toString() || '',
      timestamp: new Date().toISOString(),
    }, 'medium');
    this.violationCount++;
    this.checkViolationThreshold();
  };

  private handlePaste = async (e: ClipboardEvent) => {
    e.preventDefault();
    await this.logMalpracticeEvent('COPY_PASTE', {
      action: 'paste',
      timestamp: new Date().toISOString(),
    }, 'medium');
    this.violationCount++;
    this.checkViolationThreshold();
  };

  /**
   * Monitor window blur (user switches to another window/app)
   */
  private monitorWindowBlur = () => {
    window.addEventListener('blur', this.handleWindowBlur);
  };

  private handleWindowBlur = async () => {
    await this.logMalpracticeEvent('WINDOW_BLUR', {
      windowLostFocus: true,
      timestamp: new Date().toISOString(),
    }, 'high');
    this.violationCount++;
    this.checkViolationThreshold();
  };

  /**
   * Monitor dev tools detection (Ctrl+Shift+I, F12, etc.)
   */
  private monitorDevTools = () => {
    document.addEventListener('keydown', this.handleDevToolsDetection);
  };

  private handleDevToolsDetection = async (e: KeyboardEvent) => {
    // F12 or Ctrl+Shift+I or Ctrl+Shift+C or Ctrl+Shift+J
    if (
      e.key === 'F12' ||
      (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
      (e.metaKey && e.altKey && e.key === 'U')
    ) {
      e.preventDefault();
      await this.logMalpracticeEvent('DEV_TOOLS_OPEN', {
        keyCombo: `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`,
        timestamp: new Date().toISOString(),
      }, 'high');
      this.violationCount++;
      this.checkViolationThreshold();
    }
  };

  /**
   * Log malpractice event to server
   */
  private logMalpracticeEvent = async (
    eventType: MalpracticeEvent,
    details: Record<string, any>,
    severity: 'low' | 'medium' | 'high'
  ) => {
    try {
      const log: MalpracticeLog = {
        allocation_id: this.allocationId,
        event_type: eventType,
        timestamp: new Date().toISOString(),
        details,
        severity,
      };

      // Send to server
      const response = await fetch(`${this.apiUrl}/api/admin/malpractice-logs`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(log),
      });

      if (!response.ok) {
        console.error('Failed to log malpractice event:', response.statusText);
      }

      // Emit event for subscribers
      this.emit('violation', {
        eventType,
        count: this.violationCount,
        maxViolations: this.maxViolations,
      });

      console.warn(`Malpractice violation: ${eventType} (${this.violationCount}/${this.maxViolations})`);
    } catch (error) {
      console.error('Error logging malpractice event:', error);
    }
  };

  /**
   * Check if violation threshold exceeded
   */
  private checkViolationThreshold = async () => {
    if (this.violationCount >= this.maxViolations) {
      await this.terminateExam();
    }
  };

  /**
   * Terminate exam due to malpractice
   */
  private terminateExam = async () => {
    this.stop();

    try {
      const response = await fetch(
        `${this.apiUrl}/api/allocations/${this.allocationId}/terminate-malpractice`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            reason: 'Malpractice detected - too many violations',
            violation_count: this.violationCount,
          }),
        }
      );

      if (response.ok) {
        this.emit('terminated', {
          reason: 'Malpractice detected',
          violationCount: this.violationCount,
        });
        console.warn('Exam terminated due to malpractice violations');
      }
    } catch (error) {
      console.error('Error terminating exam:', error);
    }
  };

  /**
   * Get current violation count
   */
  getViolationCount(): number {
    return this.violationCount;
  }

  /**
   * Reset violation count (for testing)
   */
  resetViolationCount() {
    this.violationCount = 0;
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  /**
   * Emit events
   */
  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
  }
}

// Export singleton instance creator
export function createAntiCheatMonitor(
  allocationId: string,
  token: string,
  apiUrl: string
): AntiCheatMonitor {
  return new AntiCheatMonitor(allocationId, token, apiUrl);
}
