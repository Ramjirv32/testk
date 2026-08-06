'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { GRE_API_URL } from '@/lib/config';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  admin_email: string;
  target_id: string;
  details: string;
  created_at: string;
  metadata?: Record<string, any>;
}

export default function AdminAuditPage() {
  const { token, isAdmin } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  useEffect(() => {
    if (token && isAdmin()) {
      fetchAuditLogs();
    }
  }, [token, isAdmin, filterAction]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = filterAction !== 'ALL' ? `?action=${filterAction}` : '';
      const res = await fetch(`${GRE_API_URL}/api/admin/audit-trail${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setLogs(data.data?.logs || data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'TICKET_APPROVED':
      case 'TEST_ALLOCATED':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'TICKET_REJECTED':
      case 'ALLOCATION_CANCELLED':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-blue-600" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'TICKET_APPROVED':
      case 'TEST_ALLOCATED':
        return 'bg-green-50 border-green-200';
      case 'TICKET_REJECTED':
      case 'ALLOCATION_CANCELLED':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const actions = [
    'ALL',
    'TICKET_APPROVED',
    'TICKET_REJECTED',
    'TEST_ALLOCATED',
    'TEST_STARTED',
    'TEST_COMPLETED',
    'ALLOCATION_MODIFIED',
    'ALLOCATION_CANCELLED',
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Audit Trail</h1>
          <p className="text-slate-600 text-sm">Track all admin activities and changes</p>
        </div>

        {/* Action Filter */}
        <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-2">
          {actions.map((action) => (
            <button
              key={action}
              onClick={() => setFilterAction(action)}
              className={`px-3 py-1 font-medium text-sm whitespace-nowrap transition-colors border-b-2 ${
                filterAction === action
                  ? 'text-blue-600 border-blue-600'
                  : 'text-slate-600 border-transparent hover:text-slate-900'
              }`}
            >
              {action}
            </button>
          ))}
        </div>

        {/* Audit Logs Timeline */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-slate-600">Loading audit logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-lg">
              <p className="text-slate-600">No audit logs found</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-0 bottom-0 w-1 bg-slate-200"></div>

              {/* Log entries */}
              <div className="space-y-6">
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                      {getActionIcon(log.action)}
                    </div>

                    {/* Log content */}
                    <div className={`flex-1 p-4 rounded-lg border ${getActionColor(log.action)}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-slate-900">{log.action}</h4>
                          <p className="text-xs text-slate-600">{log.details}</p>
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap ml-4">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-600">Admin:</span>
                          <p className="font-medium text-slate-900">{log.admin_email}</p>
                        </div>
                        <div>
                          <span className="text-slate-600">Target ID:</span>
                          <p className="font-mono text-slate-900 break-all">{log.target_id}</p>
                        </div>
                      </div>

                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <div className="mt-2 p-2 bg-white rounded border border-slate-200">
                          <p className="text-xs font-semibold text-slate-600 mb-1">Metadata:</p>
                          <div className="text-xs text-slate-600 space-y-1">
                            {Object.entries(log.metadata).map(([key, value]) => (
                              <div key={key}>
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
