'use client';

import React, { useState } from 'react';
import { GRE_API_URL } from '@/lib/config';
import { X, AlertCircle } from 'lucide-react';

interface RejectTicketModalProps {
  token: string;
  ticketId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RejectTicketModal: React.FC<RejectTicketModalProps> = ({
  token,
  ticketId,
  studentName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${GRE_API_URL}/api/admin/tickets/${ticketId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rejection_reason: reason || 'Rejected by admin',
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to reject ticket');
      }

      onSuccess();
      onClose();
      setReason('');
    } catch (err: any) {
      setError(err.message || 'Failed to reject ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        <div className="bg-rose-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-300" />
            <h3 className="font-bold text-sm">Reject Test Request</h3>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleReject} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg font-bold">
              {error}
            </div>
          )}

          <p className="text-slate-600 font-medium">
            You are about to reject the test request from <strong className="text-slate-900">{studentName}</strong>.
            Please provide a reason for the rejection (optional but recommended).
          </p>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Rejection Reason</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Insufficient preparation time, please retake after 2 weeks..."
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-rose-500 font-medium resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Rejecting...' : 'Confirm Reject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
