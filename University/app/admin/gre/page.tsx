'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { GRE_API_URL } from '@/lib/config';
import { get, post } from '@/lib/fetch-wrapper';

interface AdminGREStats {
  total_students: number;
  pending_tickets: number;
  total_allocations: number;
  total_questions: number;
  malpractice_terminations: number;
  tests_completed_today: number;
  average_score: number;
}

interface Allocation {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  test_type: string;
  test_title: string;
  subject: string;
  category: string;
  level: string;
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  question_count: number;
  created_at: string;
}

const AdminGREStatsIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-2a6 6 0 0112 0v2zm0 0h6v-2a6 6 0 00-9-5.656M12 4.354a4 4 0 110 5.292M9 21h6v-2a6 6 0 00-9-5.656" />
  </svg>
);

const TicketIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

export default function GREAdminPage() {
  const router = useRouter();
  const { user, token, isLoading } = useAuth();
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'scheduled' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);
  const [adminStats, setAdminStats] = useState<AdminGREStats>({
    total_students: 0,
    pending_tickets: 0,
    total_allocations: 0,
    total_questions: 0,
    malpractice_terminations: 0,
    tests_completed_today: 0,
    average_score: 0,
  });
  const [stats, setStats] = useState({
    pending: 0,
    scheduled: 0,
    completed: 0,
  });
  const [selectedStudent, setSelectedStudent] = useState('');
  const [testType, setTestType] = useState('FULL_LENGTH');
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [scheduleStartDate, setScheduleStartDate] = useState('');
  const [scheduleStartPeriod, setScheduleStartPeriod] = useState<'AM' | 'PM'>('AM');
  const [scheduleEndDate, setScheduleEndDate] = useState('');
  const [scheduleEndPeriod, setScheduleEndPeriod] = useState<'AM' | 'PM'>('PM');

  const getTimeForPeriod = (period: 'AM' | 'PM') => (period === 'AM' ? '09:00' : '15:00');

  const isSunday = (value: string) => {
    if (!value) return false;
    const date = new Date(`${value}T00:00:00`);
    return date.getDay() === 0;
  };

  const isPastDate = (value: string) => {
    if (!value) return false;
    const date = new Date(`${value}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
      return;
    }

    if (user && token) {
      fetchData();
    }
  }, [user, token, isLoading, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch allocations by status
      const result = await get(`${GRE_API_URL}/api/admin/allocations?status=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (result.ok && result.data) {
        const list = Array.isArray(result.data.allocations) 
          ? result.data.allocations 
          : (Array.isArray(result.data.data?.allocations) 
              ? result.data.data.allocations 
              : (Array.isArray(result.data.data) ? result.data.data : []));
        setAllocations(list);
      }

      // Fetch admin stats
      const statsResult = await get(`${GRE_API_URL}/api/admin/gre/stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (statsResult.ok && statsResult.data) {
        setAdminStats(statsResult.data.stats || statsResult.data.data);
      }

      // Fetch allocation stats by status
      const allocStatsResult = await get(`${GRE_API_URL}/api/admin/gre/allocation-stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (allocStatsResult.ok && allocStatsResult.data) {
        setStats(allocStatsResult.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateTest = async () => {
    if (!selectedStudent) {
      alert('Please select a student');
      return;
    }

    if (!scheduleStartDate || !scheduleEndDate) {
      alert('Please select both a start date and an end date');
      return;
    }

    if (isPastDate(scheduleStartDate) || isPastDate(scheduleEndDate)) {
      alert('Please choose today or a future date');
      return;
    }

    if (isSunday(scheduleStartDate) || isSunday(scheduleEndDate)) {
      alert('Sunday is disabled for GRE allocations');
      return;
    }

    const startDateTime = new Date(`${scheduleStartDate}T${getTimeForPeriod(scheduleStartPeriod)}`);
    const endDateTime = new Date(`${scheduleEndDate}T${getTimeForPeriod(scheduleEndPeriod)}`);

    if (Number.isNaN(startDateTime.getTime()) || Number.isNaN(endDateTime.getTime()) || endDateTime <= startDateTime) {
      alert('End date and time must be after the start date and time');
      return;
    }

    try {
      const result = await post(`${GRE_API_URL}/api/allocations/allocate`, {
        student_id: selectedStudent,
        student_email: selectedStudent.includes('@') ? selectedStudent : undefined,
        test_type: testType,
        subject: testType === 'SECTIONAL' ? 'Verbal' : null,
        category: testType === 'TOPIC_WISE' ? 'Reading Comprehension' : null,
        level: testType === 'TOPIC_WISE' ? 'Medium' : null,
        scheduled_date: scheduleStartDate,
        scheduled_time: getTimeForPeriod(scheduleStartPeriod),
        expiry_date: scheduleEndDate,
        expiry_time: getTimeForPeriod(scheduleEndPeriod),
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (result.ok) {
        setShowAllocateModal(false);
        setSelectedStudent('');
        setScheduleStartDate('');
        setScheduleStartPeriod('AM');
        setScheduleEndDate('');
        setScheduleEndPeriod('PM');
        fetchData();
        alert('Test allocated successfully!');
      } else {
        alert(result.error || 'Failed to allocate test');
      }
    } catch (error) {
      console.error('Error allocating test:', error);
      alert('Failed to allocate test');
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <AdminLayout>
      <div style={{ padding: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#2d2d2d', marginBottom: '8px' }}>
            GRE Test Management
          </h1>
          <p style={{ color: '#5a5a5a', marginBottom: '24px' }}>
            Allocate and manage GRE tests for students
          </p>

          <button
            onClick={() => setShowAllocateModal(true)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#e61a8d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Allocate New Test
          </button>
        </div>

        {/* Admin Stats Cards - 5 stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #3b82f6',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div style={{ color: '#5a5a5a', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Total Students</div>
              <div style={{ color: '#3b82f6', opacity: 0.6 }}>
                <UsersIcon />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6' }}>{adminStats.total_students}</div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #f59e0b',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div style={{ color: '#5a5a5a', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Pending Tickets</div>
              <div style={{ color: '#f59e0b', opacity: 0.6 }}>
                <TicketIcon />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#f59e0b' }}>{adminStats.pending_tickets}</div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #10b981',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div style={{ color: '#5a5a5a', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Total Allocations</div>
              <div style={{ color: '#10b981', opacity: 0.6 }}>
                <AdminGREStatsIcon />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#10b981' }}>{adminStats.total_allocations}</div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #8b5cf6',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div style={{ color: '#5a5a5a', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Total Questions</div>
              <div style={{ color: '#8b5cf6', opacity: 0.6 }}>
                <AdminGREStatsIcon />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#8b5cf6' }}>{adminStats.total_questions}</div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #ef4444',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
              <div style={{ color: '#5a5a5a', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}>Malpractice Terminated</div>
              <div style={{ color: '#ef4444', opacity: 0.6 }}>
                <AlertIcon />
              </div>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>{adminStats.malpractice_terminations}</div>
          </div>
        </div>

        {/* Allocation Status Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '32px' }}>
          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #ffc107',
            }}
          >
            <div style={{ color: '#5a5a5a', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Pending</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#2d2d2d' }}>{stats.pending}</div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #0d6efd',
            }}
          >
            <div style={{ color: '#5a5a5a', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Scheduled</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#2d2d2d' }}>{stats.scheduled}</div>
          </div>

          <div
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderLeft: '4px solid #10b981',
            }}
          >
            <div style={{ color: '#5a5a5a', fontSize: '14px', marginBottom: '8px', fontWeight: '600' }}>Completed</div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#2d2d2d' }}>{stats.completed}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #ede9e4' }}>
          {['pending', 'scheduled', 'completed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              style={{
                padding: '12px 20px',
                borderBottom: activeTab === tab ? '2px solid #e61a8d' : 'none',
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontWeight: activeTab === tab ? '700' : '500',
                color: activeTab === tab ? '#e61a8d' : '#5a5a5a',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Allocations Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#5a5a5a' }}>
              Loading...
            </div>
          ) : allocations.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#5a5a5a' }}>
              No allocations found
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f5f0', borderBottom: '1px solid #ede9e4' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d2d2d' }}>
                    Student
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d2d2d' }}>
                    Test Type
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d2d2d' }}>
                    Scheduled
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d2d2d' }}>
                    Status
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d2d2d' }}>
                    Questions
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d2d2d' }}>
                    Duration
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: '#2d2d2d' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {(Array.isArray(allocations) ? allocations : []).map((allocation, idx) => (
                  <tr
                    key={allocation.id}
                    style={{
                      borderBottom: idx !== allocations.length - 1 ? '1px solid #ede9e4' : 'none',
                    }}
                  >
                    <td style={{ padding: '16px', color: '#2d2d2d' }}>
                      <div style={{ fontWeight: '600' }}>{allocation.student_name}</div>
                      <div style={{ fontSize: '12px', color: '#5a5a5a' }}>{allocation.student_email}</div>
                    </td>
                    <td style={{ padding: '16px', color: '#2d2d2d' }}>
                      {allocation.test_type}
                    </td>
                    <td style={{ padding: '16px', color: '#2d2d2d' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CalendarIcon />
                        {allocation.scheduled_date} {allocation.scheduled_time}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor:
                            allocation.status === 'COMPLETED' ? '#d4edda' :
                            allocation.status === 'IN_PROGRESS' ? '#cfe2ff' :
                            '#fff3cd',
                          color:
                            allocation.status === 'COMPLETED' ? '#155724' :
                            allocation.status === 'IN_PROGRESS' ? '#084298' :
                            '#664d03',
                        }}
                      >
                        {allocation.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: '#2d2d2d' }}>
                      {allocation.question_count}
                    </td>
                    <td style={{ padding: '16px', color: '#2d2d2d' }}>
                      {allocation.duration_minutes} min
                    </td>
                    <td style={{ padding: '16px' }}>
                      <button
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#e61a8d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Allocate Modal */}
      {showAllocateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: 'white',
              padding: '32px',
              borderRadius: '12px',
              maxWidth: '400px',
              width: '90%',
            }}
          >
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px', color: '#2d2d2d' }}>
              Allocate Test
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d2d2d' }}>
                Select Student
              </label>
              <input
                type="text"
                placeholder="Enter student email or ID"
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ede9e4',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d2d2d' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  value={scheduleStartDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduleStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ede9e4',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d2d2d' }}>
                  Start Slot
                </label>
                <select
                  value={scheduleStartPeriod}
                  onChange={(e) => setScheduleStartPeriod(e.target.value as 'AM' | 'PM')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ede9e4',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: '12px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d2d2d' }}>
                  End Date
                </label>
                <input
                  type="date"
                  value={scheduleEndDate}
                  min={scheduleStartDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => setScheduleEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ede9e4',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d2d2d' }}>
                  End Slot
                </label>
                <select
                  value={scheduleEndPeriod}
                  onChange={(e) => setScheduleEndPeriod(e.target.value as 'AM' | 'PM')}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ede9e4',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '12px', color: '#5a5a5a' }}>
              Sundays are disabled. Start and end slots use fixed GRE session windows.
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d2d2d' }}>
                Test Type
              </label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ede9e4',
                  borderRadius: '6px',
                  fontSize: '14px',
                }}
              >
                <option value="FULL_LENGTH">Full Length (54 questions, 118 min)</option>
                <option value="SECTIONAL">Sectional (20 questions, 35 min)</option>
                <option value="TOPIC_WISE">Topic Wise (15 questions, 20 min)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowAllocateModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'white',
                  border: '1px solid #ede9e4',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#2d2d2d',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAllocateTest}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#e61a8d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                Allocate
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
