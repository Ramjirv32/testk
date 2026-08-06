import { useMemo } from 'react';
import { createAuditLogger, AuditLogger } from '@/lib/audit-trail';
import { API_URL } from '@/lib/config';

interface UseAuditLoggerProps {
  token: string;
  adminId: string;
  adminEmail: string;
  enabled?: boolean;
}

/**
 * Hook to get audit logger instance
 */
export function useAuditLogger({
  token,
  adminId,
  adminEmail,
  enabled = true,
}: UseAuditLoggerProps): AuditLogger | null {
  return useMemo(() => {
    if (!enabled || !token || !adminId || !adminEmail) {
      return null;
    }

    return createAuditLogger(API_URL, token, adminId, adminEmail);
  }, [token, adminId, adminEmail, enabled]);
}
