'use client';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GRE_API_URL } from '@/lib/config';
import StudentLayout from '@/components/student/StudentLayout';

interface Allocation {
  id: string;
  test_type: string;
  test_title: string;
  question_ids: any;
  status: string;
  score_percent?: number;
  scheduled_at?: string;
  expires_at?: string;
  created_at: string;
}

interface Ticket {
  id: string;
  ticket_type: string;
  requested_category?: string;
  requested_level?: string;
  subject?: string;
  category?: string;
  level?: string;
  status: string;
  admin_notes?: string;
  unread_count?: number;
  created_at: string;
  updated_at?: string;
}

interface ChatMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: string;
  sender_name: string;
  message_text: string;
  attachment_url?: string;
  attachment_type?: string;
  is_read?: boolean;
  created_at: string;
}

const TICKET_TYPE_OPTIONS = [
  { value: 'FULL_LENGTH', label: 'Full-Length GRE Test' },
  { value: 'SECTIONAL', label: 'Sectional Test' },
  { value: 'TOPIC_WISE', label: 'Topic-Wise Practice' },
  { value: 'PRACTICE', label: 'Minimal Practice' },
  { value: 'GENERAL', label: 'General Query / Support' },
];

const SUBJECT_OPTIONS = ['Verbal', 'Quant', 'AWA'];
const CATEGORY_OPTIONS = ['Reading Comprehension', 'Text Completion', 'Sentence Equivalence', 'Algebra', 'Geometry', 'Arithmetic', 'Data Analysis'];
const LEVEL_OPTIONS = ['Easy', 'Medium', 'Hard'];

/** 12-hour AM/PM format matching original formatDate12H */
function formatDate12H(val?: string | null): string {
  if (!val) return 'N/A';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return 'N/A';
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  } catch {
    return 'N/A';
  }
}

export default function GRETicketsPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();

  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const limit = 10;

  // Form State
  const [formTicketType, setFormTicketType] = useState('FULL_LENGTH');
  const [formSubject, setFormSubject] = useState('Verbal');
  const [formCategory, setFormCategory] = useState('Reading Comprehension');
  const [formLevel, setFormLevel] = useState('Medium');

  // Active Chat State
  const [activeChatTicket, setActiveChatTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState<string>('');
  const [sendingMsg, setSendingMsg] = useState<boolean>(false);
  const [messagesLoading, setMessagesLoading] = useState<boolean>(false);

  // Voice recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingTime, setRecordingTime] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // Chat message container scroll ref
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  const fetchData = React.useCallback(async () => {
    if (!token) return;
    try {
      const [allocRes, ticketRes] = await Promise.all([
        fetch(`${GRE_API_URL}/api/allocations/my-allocations`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch(`${GRE_API_URL}/api/tickets/my-requests`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      if (allocRes && allocRes.ok) {
        const data = await allocRes.json();
        setAllocations(data.data || data.allocations || []);
      }

      if (ticketRes && ticketRes.ok) {
        const data = await ticketRes.json();
        const fetched = data.tickets || data.data || [];
        setTickets(Array.isArray(fetched) ? fetched : []);
      }
    } catch (err) {
      console.error('Failed to fetch ticket data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Initial load + 8s auto-refresh polling (matches original)
  useEffect(() => {
    if (!token) return;
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [fetchData, token]);

  const fetchTicketMessages = React.useCallback(async (ticketId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`${GRE_API_URL}/api/tickets/${ticketId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || data.data || []);
      }
    } catch (err) {
      console.error('Failed to load chat messages:', err);
    }
  }, [token]);

  // Active chat polling (every 4s) (matches original)
  useEffect(() => {
    if (activeChatTicket) {
      setMessagesLoading(true);
      fetchTicketMessages(activeChatTicket.id).finally(() => setMessagesLoading(false));
      const interval = setInterval(() => {
        fetchTicketMessages(activeChatTicket.id);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [activeChatTicket, fetchTicketMessages]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filtered tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const q = search.toLowerCase();
      const formattedDate = formatDate12H(t.created_at).toLowerCase();
      return (
        !q ||
        (t.id || '').toLowerCase().includes(q) ||
        (t.ticket_type || '').toLowerCase().includes(q) ||
        (t.requested_category || t.category || '').toLowerCase().includes(q) ||
        (t.requested_level || t.level || '').toLowerCase().includes(q) ||
        (t.status || '').toLowerCase().includes(q) ||
        formattedDate.includes(q)
      );
    });
  }, [tickets, search]);

  const totalPages = Math.ceil(filteredTickets.length / limit) || 1;
  const paginatedTickets = filteredTickets.slice((currentPage - 1) * limit, currentPage * limit);

  // Create new ticket
  const handleCreateTicket = async () => {
    setCreating(true);
    setError('');
    try {
      const body: Record<string, string> = { ticket_type: formTicketType };
      if (formTicketType !== 'GENERAL') {
        body.subject = formSubject;
        body.category = formCategory;
        body.level = formLevel;
        body.requested_category = formCategory;
        body.requested_level = formLevel;
      }
      const response = await fetch(`${GRE_API_URL}/api/tickets/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        const data = await response.json();
        const newTicket = data.ticket || data.data;
        setShowCreateForm(false);
        await fetchData();
        if (newTicket) {
          setActiveChatTicket(newTicket);
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create ticket');
      }
    } catch (err) {
      setError('Error creating ticket');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  // Send message
  const handleSendMessage = async (text?: string, attachmentUrl?: string, attachmentType?: string) => {
    if (!activeChatTicket || !token) return;
    const msgText = text ?? newMessageText;
    if (!msgText.trim() && !attachmentUrl) return;

    setSendingMsg(true);
    try {
      const res = await fetch(`${GRE_API_URL}/api/tickets/${activeChatTicket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          message_text: msgText,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
        }),
      });
      if (res.ok) {
        setNewMessageText('');
        await fetchTicketMessages(activeChatTicket.id);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMsg(false);
    }
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result as string;
      try {
        setSendingMsg(true);
        const uploadRes = await fetch(`${GRE_API_URL}/api/tickets/upload`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            file_data: base64Data,
            file_name: file.name,
            file_type: 'IMAGE',
          }),
        });
        if (uploadRes.ok) {
          const data = await uploadRes.json();
          await handleSendMessage('', data.attachment_url, 'IMAGE');
        } else {
          alert('Failed to upload screenshot image');
        }
      } catch (err) {
        alert('Failed to upload screenshot image');
      } finally {
        setSendingMsg(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Voice Note Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            setSendingMsg(true);
            const uploadRes = await fetch(`${GRE_API_URL}/api/tickets/upload`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({
                file_data: base64Audio,
                file_name: `voice_${Date.now()}.webm`,
                file_type: 'AUDIO',
              }),
            });
            if (uploadRes.ok) {
              const data = await uploadRes.json();
              await handleSendMessage('🎙️ Voice Recording Note', data.attachment_url, 'AUDIO');
            } else {
              alert('Failed to send voice recording note');
            }
          } catch (err) {
            alert('Failed to send voice recording note');
          } finally {
            setSendingMsg(false);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert('Microphone permission denied or unavailable.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  const handleCloseTicket = async () => {
    if (!activeChatTicket || !token) return;
    try {
      const res = await fetch(`${GRE_API_URL}/api/tickets/${activeChatTicket.id}/close`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setActiveChatTicket(prev => prev ? { ...prev, status: 'CLOSED' } : null);
        fetchData();
      }
    } catch (err) {
      console.error('Error closing ticket:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }}>Pending Review</span>;
      case 'APPROVED':
        return <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', backgroundColor: '#dbeafe', color: '#1e3a8a', border: '1px solid #93c5fd' }}>Approved</span>;
      case 'OPEN':
        return <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}>Open Chat</span>;
      case 'CLOSED':
        return <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }}>Closed</span>;
      case 'REJECTED':
        return <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca' }}>Rejected</span>;
      default:
        return <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: '700', backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' }}>{status}</span>;
    }
  };

  if (isLoading || loading) {
    return (
      <StudentLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #f3e8f7', borderTop: '4px solid #e61a8d', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div style={{ flex: 1, minWidth: 0 }}>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b',
            padding: '14px 18px', borderRadius: '10px', marginBottom: '24px',
            fontSize: '13px', fontWeight: '500',
          }}>
            {error}
          </div>
        )}

        {/* HEADER BANNER */}
        <div style={{
          backgroundColor: '#e61a8d', color: 'white', borderRadius: '16px',
          padding: '20px 24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(230,26,141,0.2)',
          display: 'flex', flexWrap: 'wrap',
          alignItems: 'center', justifyContent: 'space-between', gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px', height: '46px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                Support Tickets &amp; Test Requests
              </h1>
              <p style={{ fontSize: '12px', color: '#fce7f3', fontWeight: '500', margin: '4px 0 0' }}>
                Raise test allocation tickets, send voice notes or screenshots, and chat with support.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            style={{
              backgroundColor: 'white', color: '#e61a8d', border: 'none',
              borderRadius: '8px', padding: '10px 18px', fontSize: '12px',
              fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Raise New Ticket
          </button>
        </div>

        {/* CREATE TICKET FORM PANEL */}
        {showCreateForm && (
          <div style={{
            backgroundColor: 'white', borderRadius: '12px', padding: '24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px',
            border: '1px solid #f0e8f5',
          }}>
            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#1a1a1a', margin: '0 0 20px 0' }}>
              Create New Support Ticket / Request
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', textTransform: 'uppercase', marginBottom: '6px' }}>Ticket Type</label>
                <select
                  value={formTicketType}
                  onChange={(e) => setFormTicketType(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit' }}
                >
                  {TICKET_TYPE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>

              {formTicketType !== 'GENERAL' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', textTransform: 'uppercase', marginBottom: '6px' }}>Subject</label>
                    <select
                      value={formSubject}
                      onChange={(e) => setFormSubject(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit' }}
                    >
                      {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', textTransform: 'uppercase', marginBottom: '6px' }}>Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit' }}
                    >
                      {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#555', textTransform: 'uppercase', marginBottom: '6px' }}>Difficulty Level</label>
                    <select
                      value={formLevel}
                      onChange={(e) => setFormLevel(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', fontSize: '13px', fontWeight: '600', color: '#1a1a1a', outline: 'none', fontFamily: 'inherit' }}
                    >
                      {LEVEL_OPTIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateForm(false)}
                style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#555', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTicket}
                disabled={creating}
                style={{ padding: '10px 20px', backgroundColor: '#e61a8d', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', opacity: creating ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {creating ? 'Creating...' : 'Submit Ticket'}
              </button>
            </div>
          </div>
        )}

        {/* TICKET LIST HEADER & SEARCH */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f0e8f5',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden',
        }}>
          <div style={{
            padding: '16px 20px', borderBottom: '1px solid #f0e8f5', backgroundColor: '#fafafa',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e61a8d" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
              </svg>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#1a1a1a' }}>
                My Support &amp; Test Ticket History
              </h3>
            </div>

            {/* SEARCH BOX FOR STUDENT TICKETS */}
            <div style={{ position: 'relative', width: '280px' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" style={{ position: 'absolute', left: '10px', top: '9px' }}>
                <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search date, ID, format, status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 32px 8px 32px', border: '1px solid #e5e7eb',
                  borderRadius: '8px', fontSize: '12px', outline: 'none', fontFamily: 'inherit', color: '#1a1a1a',
                }}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  style={{ position: 'absolute', right: '9px', top: '6px', background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: '13px', fontWeight: '700' }}
                >✕</button>
              )}
            </div>
          </div>

          {/* TABLE OF TICKETS */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: '#fafafa', color: '#5a5a5a', borderBottom: '1px solid #ede9e4' }}>
                  {['Ticket ID', 'Test Format', 'Category / Topic', 'Level', 'Created Date', 'Status', 'Chat & Action'].map((h, i) => (
                    <th key={h} style={{
                      padding: '12px 14px', textAlign: i === 6 ? 'center' : 'left',
                      fontWeight: '700', fontSize: '11px', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTickets.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#aaa', fontWeight: '700' }}>
                      {search ? `No support tickets found matching "${search}".` : 'No support tickets yet. Click "Raise New Ticket" to create one.'}
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map(ticket => (
                    <tr
                      key={ticket.id}
                      style={{
                        borderBottom: '1px solid #faf5fa',
                        backgroundColor: ticket.unread_count && ticket.unread_count > 0 ? '#fff0f6' : 'transparent',
                        transition: 'background 0.12s',
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#e61a8d', fontFamily: 'monospace' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>#{ticket.id.slice(0, 8)}</span>
                          {(ticket.unread_count || 0) > 0 && (
                            <span style={{ backgroundColor: '#e11d48', color: 'white', fontSize: '10px', fontWeight: '800', padding: '2px 6px', borderRadius: '10px' }}>
                              🔴 {ticket.unread_count} new
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: '700', color: '#1a1a1a' }}>
                        {TICKET_TYPE_OPTIONS.find(t => t.value === ticket.ticket_type)?.label || ticket.ticket_type}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#555', fontWeight: '600' }}>
                        {ticket.requested_category || ticket.category || 'All Topics'}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#555', fontWeight: '600' }}>
                        {ticket.requested_level || ticket.level || 'Medium'}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#888', fontSize: '11px' }}>
                        {formatDate12H(ticket.created_at)}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {getStatusBadge(ticket.status)}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => setActiveChatTicket(ticket)}
                          style={{
                            padding: '6px 14px', borderRadius: '8px', fontSize: '11px', fontWeight: '700',
                            cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px',
                            backgroundColor: (ticket.unread_count || 0) > 0 ? '#e11d48' : '#e61a8d',
                            color: 'white', border: 'none', boxShadow: '0 2px 6px rgba(230,26,141,0.2)',
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                          </svg>
                          {(ticket.unread_count || 0) > 0 ? `Open Chat (${ticket.unread_count} new)` : 'Open Chat Window'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* NUMBERED PAGINATION CONTROL BAR */}
          {filteredTickets.length > 0 && (
            <div style={{
              padding: '16px 20px', borderTop: '1px solid #ede9e4', backgroundColor: '#fafafa',
              display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
              gap: '12px', fontSize: '12px',
            }}>
              <span style={{ color: '#5a5a5a', fontWeight: '500' }}>
                Page <strong style={{ color: '#2d2d2d' }}>{currentPage}</strong> of <strong style={{ color: '#2d2d2d' }}>{totalPages}</strong> ({filteredTickets.length} total support tickets)
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  style={{
                    padding: '6px 12px', backgroundColor: 'white', border: '1px solid #ede9e4',
                    borderRadius: '6px', fontWeight: '700', fontSize: '11px', color: '#5a5a5a',
                    cursor: currentPage <= 1 ? 'not-allowed' : 'pointer', opacity: currentPage <= 1 ? 0.4 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  ← Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      width: '32px', height: '32px', borderRadius: '6px', fontWeight: '800',
                      fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit',
                      backgroundColor: currentPage === pageNum ? '#e61a8d' : 'white',
                      color: currentPage === pageNum ? 'white' : '#5a5a5a',
                      border: '1px solid ' + (currentPage === pageNum ? '#e61a8d' : '#ede9e4'),
                      transition: 'all 0.15s',
                    }}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  style={{
                    padding: '6px 12px', backgroundColor: 'white', border: '1px solid #ede9e4',
                    borderRadius: '6px', fontWeight: '700', fontSize: '11px', color: '#5a5a5a',
                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', opacity: currentPage >= totalPages ? 0.4 : 1,
                    fontFamily: 'inherit',
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* LIVE CHAT DRAWER MODAL */}
        {activeChatTicket && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 50, backgroundColor: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(2px)', display: 'flex', justifyContent: 'flex-end',
          }}>
            <div style={{
              backgroundColor: 'white', width: '100%', maxWidth: '520px', height: '100%',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column',
            }}>
              {/* CHAT HEADER */}
              <div style={{
                padding: '16px 20px', backgroundColor: '#e61a8d', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800' }}>
                      Ticket Support Chat <span style={{ fontFamily: 'monospace', color: '#fce7f3' }}>#{activeChatTicket.id.slice(0, 8)}</span>
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#fce7f3' }}>
                      Format: {activeChatTicket.ticket_type} • Status: {activeChatTicket.status}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeChatTicket.status !== 'CLOSED' && activeChatTicket.status !== 'REJECTED' && (
                    <button
                      onClick={handleCloseTicket}
                      style={{ padding: '5px 10px', backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Close Ticket
                    </button>
                  )}
                  <button
                    onClick={() => setActiveChatTicket(null)}
                    style={{ background: 'none', border: 'none', color: 'white', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}
                  >✕</button>
                </div>
              </div>

              {/* CHAT STATUS BANNER */}
              {activeChatTicket.status === 'CLOSED' && (
                <div style={{ backgroundColor: '#fdf2f8', color: '#e61a8d', padding: '10px 16px', fontSize: '11px', fontWeight: '700', textAlign: 'center', borderBottom: '1px solid #fbcfe8' }}>
                  🔒 This ticket has been closed by support. You can raise a new ticket if needed.
                </div>
              )}

              {/* MESSAGES STREAM */}
              <div style={{ flex: 1, padding: '16px', overflowY: 'auto', backgroundColor: '#faf5fa', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messagesLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#aaa', fontSize: '12px', fontWeight: '600' }}>
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#888', fontSize: '12px', fontWeight: '600' }}>
                    No messages yet in this ticket thread.<br />
                    Type a message, attach a screenshot, or record a voice note below.
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender_role === 'STUDENT';

                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                        <span style={{ fontSize: '10px', color: '#888', fontWeight: '700', marginBottom: '3px', padding: '0 4px' }}>
                          {msg.sender_name} ({msg.sender_role}) • {formatDate12H(msg.created_at)}
                        </span>

                        <div style={{
                          maxWidth: '85%', padding: '12px 14px', borderRadius: '14px',
                          borderBottomRightRadius: isMe ? '2px' : '14px',
                          borderBottomLeftRadius: isMe ? '14px' : '2px',
                          backgroundColor: isMe ? '#e61a8d' : 'white',
                          color: isMe ? 'white' : '#1a1a1a',
                          border: isMe ? 'none' : '1px solid #e5e7eb',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                        }}>
                          {msg.message_text && (
                            <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.5', fontWeight: '500', whiteSpace: 'pre-wrap' }}>
                              {msg.message_text}
                            </p>
                          )}

                          {/* ATTACHMENT IMAGE */}
                          {msg.attachment_url && msg.attachment_type === 'IMAGE' && (
                            <div style={{ marginTop: '8px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.2)' }}>
                              <img
                                src={msg.attachment_url.startsWith('http') ? msg.attachment_url : `${GRE_API_URL}${msg.attachment_url}`}
                                alt="Screenshot attachment"
                                style={{ maxHeight: '220px', width: '100%', objectFit: 'contain', backgroundColor: 'rgba(0,0,0,0.05)' }}
                              />
                            </div>
                          )}

                          {/* ATTACHMENT VOICE AUDIO */}
                          {msg.attachment_url && msg.attachment_type === 'AUDIO' && (
                            <div style={{ marginTop: '8px', backgroundColor: 'rgba(0,0,0,0.1)', padding: '6px', borderRadius: '8px' }}>
                              <audio
                                controls
                                src={msg.attachment_url.startsWith('http') ? msg.attachment_url : `${GRE_API_URL}${msg.attachment_url}`}
                                style={{ height: '32px', maxWidth: '100%' }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* RECORDING OVERLAY BANNER */}
              {isRecording && (
                <div style={{
                  padding: '12px 16px', backgroundColor: '#e11d48', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontSize: '12px', fontWeight: '700',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    </svg>
                    Recording Voice Note... ({recordingTime}s)
                  </div>
                  <button
                    onClick={stopRecording}
                    style={{
                      backgroundColor: 'white', color: '#e11d48', border: 'none',
                      borderRadius: '6px', padding: '4px 10px', fontSize: '11px',
                      fontWeight: '800', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    ■ Stop &amp; Send
                  </button>
                </div>
              )}

              {/* INPUT BAR */}
              {activeChatTicket.status !== 'CLOSED' ? (
                <div style={{ padding: '12px 16px', backgroundColor: 'white', borderTop: '1px solid #e5e7eb' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                    {/* SCREENSHOT / IMAGE UPLOAD BUTTON */}
                    <label
                      title="Attach Screenshot / Image"
                      style={{
                        padding: '8px', backgroundColor: '#f3f4f6', borderRadius: '8px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                      </svg>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        disabled={sendingMsg || isRecording}
                      />
                    </label>

                    {/* VOICE RECORDING BUTTON */}
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={sendingMsg}
                      title="Record Voice Note"
                      style={{
                        padding: '8px', borderRadius: '8px', border: 'none',
                        backgroundColor: isRecording ? '#e11d48' : '#f3f4f6',
                        color: isRecording ? 'white' : '#555', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      </svg>
                    </button>

                    {/* TEXT MESSAGE INPUT */}
                    <input
                      type="text"
                      placeholder="Type your message to support..."
                      value={newMessageText}
                      onChange={(e) => setNewMessageText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                      disabled={sendingMsg || isRecording}
                      style={{
                        flex: 1, padding: '9px 12px', border: '1px solid #e5e7eb',
                        borderRadius: '8px', fontSize: '12px', fontWeight: '500',
                        outline: 'none', fontFamily: 'inherit', color: '#1a1a1a',
                      }}
                    />

                    {/* SEND BUTTON */}
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={sendingMsg || !newMessageText.trim() || isRecording}
                      title="Send Message"
                      style={{
                        padding: '9px 14px', backgroundColor: '#e61a8d', color: 'white',
                        border: 'none', borderRadius: '8px', fontSize: '12px',
                        fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit',
                        opacity: sendingMsg || !newMessageText.trim() || isRecording ? 0.4 : 1,
                        display: 'flex', alignItems: 'center', gap: '4px',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '14px', backgroundColor: '#fafafa', borderTop: '1px solid #e5e7eb', textAlign: 'center', fontSize: '11px', fontWeight: '700', color: '#888' }}>
                  This ticket has been closed. Create a new request to initiate chat.
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
}
