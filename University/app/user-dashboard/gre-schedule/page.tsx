'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { GRE_API_URL } from '@/lib/config';
import StudentLayout from '@/components/student/StudentLayout';

interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  booked: number;
  available: boolean;
  already_scheduled?: boolean;
}

interface AvailableTest {
  id: string;
  test_type: string;
  test_title: string;
  duration_minutes: number;
  question_count: number;
}

const convertTo12Hour = (time24?: string): string => {
  if (!time24 || typeof time24 !== 'string') return '';
  if (time24.includes('T')) {
    try {
      return new Date(time24).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {}
  }
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return time24;
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const formatSlotTimeRange = (startTime?: string, endTime?: string, durationMinutes: number = 60): string => {
  if (!startTime) return '';
  const startStr = convertTo12Hour(startTime);
  if (endTime && endTime.trim() !== '') {
    const endStr = convertTo12Hour(endTime);
    return `${startStr} - ${endStr}`;
  }

  const parts = startTime.split(':');
  if (parts.length >= 2) {
    const startH = parseInt(parts[0], 10);
    const startM = parseInt(parts[1], 10);
    if (!isNaN(startH) && !isNaN(startM)) {
      const totalM = startH * 60 + startM + durationMinutes;
      const endH = Math.floor(totalM / 60) % 24;
      const endM = totalM % 60;
      const period = endH >= 12 ? 'PM' : 'AM';
      const hours12 = endH % 12 || 12;
      const endStr = `${hours12}:${endM.toString().padStart(2, '0')} ${period}`;
      return `${startStr} - ${endStr}`;
    }
  }

  return startStr;
};

const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`;
  return `${hours} hr${hours > 1 ? 's' : ''} ${remainingMinutes} minutes`;
};

const icons = {
  dashboard: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>),
  ticket: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>),
  results: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  plus: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>),
  analytics: (<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>),
  calendar: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>),
  clock: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
  check: (<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>),
};

const menuItems = [
  { path: '/user-dashboard/gre-dashboard', label: 'Dashboard Overview', icon: icons.dashboard },
  { path: '/user-dashboard/gre-tests', label: 'My Tests & Results', icon: icons.results },
  { path: '/user-dashboard/gre-schedule', label: 'Schedule New Test', icon: icons.plus },
  { path: '/user-dashboard/gre-analytics', label: 'Performance Analytics', icon: icons.analytics },
  { path: '/user-dashboard/gre-tickets', label: 'Support & Tickets', icon: icons.ticket },
];

export default function GRESchedulePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, token, isLoading } = useAuth();
  const [testType, setTestType] = useState<'TOPIC_WISE' | 'SECTIONAL' | 'FULL_LENGTH'>('FULL_LENGTH');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [subject, setSubject] = useState('Verbal');
  const [category, setCategory] = useState('');
  const [level, setLevel] = useState('');

  // Clean categories mapping - removes junk values and maps to proper ones
  const categoryOptions = {
    Verbal: [
      'Reading Comprehension',
      'Text Completion',
      'Sentence Equivalence',
      'Critical Reasoning',
      'AWA',
    ],
    Quant: [
      'Algebra',
      'Arithmetic',
      'Geometry',
      'Data Interpretation',
      'Word Problems',
      'Probability',
      'Permutation and Combination',
      'Number Properties',
      'Ratios and Proportions',
      'Functions',
    ]
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const getDaysArray = (year: number, month: number) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const daysInCurrentMonth = getDaysArray(currentYear, currentMonth);
  const daysInNextMonth = getDaysArray(currentYear, currentMonth + 1);
  const getTestSpecs = (type: string, sub: string, lev: string) => {
    if (type === 'FULL_LENGTH') {
      return { question_count: 54, duration_minutes: 118, label: '54 questions • 118 minutes (Full GRE)' };
    }
    if (type === 'SECTIONAL') {
      if (sub === 'Quant') {
        return { question_count: 27, duration_minutes: 47, label: '27 questions • 47 minutes (Quant Section)' };
      }
      if (sub === 'Verbal') {
        return { question_count: 27, duration_minutes: 41, label: '27 questions • 41 minutes (Verbal Section)' };
      }
      return { question_count: 27, duration_minutes: 45, label: '27 questions • 45 minutes (Sectional)' };
    }
    if (lev === 'Hard') {
      return { question_count: 10, duration_minutes: 20, label: '10 questions • 20 minutes (Topic Wise - Hard)' };
    }
    if (lev === 'Medium') {
      return { question_count: 7, duration_minutes: 18, label: '7 questions • 18 minutes (Topic Wise - Medium)' };
    }
    return { question_count: 5, duration_minutes: 15, label: '5 questions • 15 minutes (Topic Wise - Easy)' };
  };

  useEffect(() => {
    if (!selectedDate || !token) return;

    const fetchSlots = async () => {
      try {
        const res = await fetch(`${GRE_API_URL}/api/allocations/available-slots?date=${selectedDate}&test_type=${testType}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.slots && Array.isArray(data.slots)) {
            const apiSlots: TimeSlot[] = data.slots.map((s: any) => ({
              id: s.id || s.time,
              date: selectedDate,
              startTime: s.time || s.startTime,
              endTime: s.endTime || '',
              capacity: 10,
              booked: s.available ? 0 : 10,
              available: !!s.available,
              already_scheduled: !!s.already_scheduled || !!data.student_already_scheduled,
            }));
            setTimeSlots(apiSlots);
            if (data.student_already_scheduled) {
              setError('You already have an active test scheduled for this date and test type.');
            } else {
              setError('');
            }
            return;
          }
        }
      } catch (err) {
        console.error('Error fetching available slots:', err);
      }

      setTimeSlots([
        { id: '1', date: selectedDate, startTime: '08:00', endTime: '', capacity: 10, booked: 0, available: true },
        { id: '2', date: selectedDate, startTime: '10:00', endTime: '', capacity: 10, booked: 0, available: true },
        { id: '3', date: selectedDate, startTime: '12:00', endTime: '', capacity: 10, booked: 0, available: true },
        { id: '4', date: selectedDate, startTime: '14:00', endTime: '', capacity: 10, booked: 0, available: true },
        { id: '5', date: selectedDate, startTime: '16:00', endTime: '', capacity: 10, booked: 0, available: true },
        { id: '6', date: selectedDate, startTime: '18:00', endTime: '', capacity: 10, booked: 0, available: true },
        { id: '7', date: selectedDate, startTime: '20:00', endTime: '', capacity: 10, booked: 0, available: true },
      ]);
    };

    fetchSlots();
  }, [selectedDate, testType, subject, category, level, token]);

  const formatDate = (day: number, month: number = currentMonth, year: number = currentYear) => {
    const y = String(year);
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isDateValid = (day: number | null, month: number = currentMonth, year: number = currentYear) => {
    if (day === null) return false;
    const date = new Date(year, month, day);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    // Allow today and next 90 days
    return date >= todayDate && date < new Date(todayDate.getTime() + 91 * 24 * 60 * 60 * 1000);
  };

  const handleScheduleTest = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch(`${GRE_API_URL}/api/allocations/schedule`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: user?.id,
          test_type: testType,
          subject: testType === 'TOPIC_WISE' ? subject : (testType === 'SECTIONAL' ? subject : null),
          category: testType === 'TOPIC_WISE' ? category : null,
          level: testType === 'TOPIC_WISE' ? level : null,
          scheduled_date: selectedSlot.date,
          scheduled_time: selectedSlot.startTime,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/user-dashboard/gre-tests');
        }, 2000);
      } else {
        setError(data.error || 'Failed to schedule test');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return (
    <div style={{ backgroundColor: '#faf4ec', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '50px', height: '50px', border: '4px solid #e5e7eb', borderTop: '4px solid #e61a8d', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#5a5a5a' }}>Loading...</p>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  return (
    <StudentLayout>
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header Banner */}
        <div style={{ backgroundColor: '#e61a8d', borderRadius: '16px', padding: '20px 24px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(230,26,141,0.2)' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'white', margin: '0' }}>Schedule Your GRE Test</h1>
          <p style={{ color: '#fce7f3', fontSize: '12px', margin: '4px 0 0 0' }}>Choose a test type and select your preferred date and time</p>
        </div>

        {success && (
          <div
            style={{
              backgroundColor: '#d4edda',
              border: '1px solid #c3e6cb',
              color: '#155724',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <span style={{ color: '#155724', display: 'flex', alignItems: 'center' }}>{icons.check}</span>
            <div>
              <strong>Success!</strong> Your test has been scheduled. Redirecting...
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              color: '#721c24',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '24px',
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          {/* Left: Test Type Selection */}
          <div>
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#2d2d2d' }}>
                Test Type
              </h2>

              {/* Full Length */}
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="testType"
                  value="FULL_LENGTH"
                  checked={testType === 'FULL_LENGTH'}
                  onChange={(e) => setTestType(e.target.value as any)}
                  style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#2d2d2d' }}>Full Length Test</div>
                  <div style={{ fontSize: '14px', color: '#5a5a5a' }}>54 questions • {formatDuration(118)}</div>
                </div>
              </label>

              {/* Sectional */}
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="testType"
                  value="SECTIONAL"
                  checked={testType === 'SECTIONAL'}
                  onChange={(e) => setTestType(e.target.value as any)}
                  style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#2d2d2d' }}>Sectional Test</div>
                  <div style={{ fontSize: '14px', color: '#5a5a5a' }}>20 questions • {formatDuration(35)}</div>
                </div>
              </label>

              {/* Topic Wise */}
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="testType"
                  value="TOPIC_WISE"
                  checked={testType === 'TOPIC_WISE'}
                  onChange={(e) => setTestType(e.target.value as any)}
                  style={{ marginRight: '12px', width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: '600', color: '#2d2d2d' }}>Topic Wise Test</div>
                  <div style={{ fontSize: '14px', color: '#5a5a5a' }}>15 questions • {formatDuration(20)}</div>
                </div>
              </label>

              {/* Topic Wise Options */}
              {testType === 'TOPIC_WISE' && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ede9e4' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d2d2d' }}>
                      Subject
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => {
                        setSubject(e.target.value);
                        setCategory(''); // Reset category when subject changes
                      }}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ede9e4',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="Verbal">Verbal Reasoning</option>
                      <option value="Quant">Quantitative Reasoning</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d2d2d' }}>
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ede9e4',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="">Select Category</option>
                      {categoryOptions[subject as keyof typeof categoryOptions]?.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d2d2d' }}>
                      Difficulty Level
                    </label>
                    <select
                      value={level}
                      onChange={(e) => setLevel(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        border: '1px solid #ede9e4',
                        borderRadius: '6px',
                        fontSize: '14px',
                      }}
                    >
                      <option value="">Select Level</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
              )}

              {testType === 'SECTIONAL' && (
                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #ede9e4' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#2d2d2d' }}>
                    Choose Subject
                  </label>
                  <select
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ede9e4',
                      borderRadius: '6px',
                      fontSize: '14px',
                    }}
                  >
                    <option value="Verbal">Verbal Reasoning</option>
                    <option value="Quant">Quantitative Reasoning</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Right: Date & Time Selection */}
          <div>
            {/* Calendar */}
            <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#2d2d2d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {icons.calendar} Select Date
              </h2>

              {/* Current Month */}
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2d2d2d' }}>
                  {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                  {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                    <div key={day} style={{ textAlign: 'center', fontWeight: '600', fontSize: '12px', color: '#5a5a5a', padding: '8px' }}>
                      {day}
                    </div>
                  ))}
                  {daysInCurrentMonth.map((day, idx) => {
                    const isValid = isDateValid(day, currentMonth, currentYear);
                    const dateStr = day ? formatDate(day, currentMonth, currentYear) : '';
                    const isSelected = dateStr === selectedDate;

                    return (
                      <button
                        key={idx}
                        onClick={() => day && isValid && setSelectedDate(dateStr)}
                        disabled={!isValid}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          border: isSelected ? '2px solid #e61a8d' : '1px solid #ede9e4',
                          backgroundColor: isSelected ? '#e61a8d' : isValid ? 'white' : '#f0f0f0',
                          color: isSelected ? 'white' : isValid ? '#2d2d2d' : '#ccc',
                          cursor: isValid ? 'pointer' : 'not-allowed',
                          fontWeight: '500',
                          fontSize: '12px',
                        }}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Next Month - Only show if no date selected */}
              {!selectedDate && (
                <div>
                  <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#2d2d2d' }}>
                    {new Date(currentYear, currentMonth + 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} style={{ textAlign: 'center', fontWeight: '600', fontSize: '12px', color: '#5a5a5a', padding: '8px' }}>
                        {day}
                      </div>
                    ))}
                    {daysInNextMonth.map((day, idx) => {
                      const isValid = isDateValid(day, currentMonth + 1, currentYear);
                      const dateStr = day ? formatDate(day, currentMonth + 1, currentYear) : '';
                      const isSelected = dateStr === selectedDate;

                      return (
                        <button
                          key={idx}
                          onClick={() => day && isValid && setSelectedDate(dateStr)}
                          disabled={!isValid}
                          style={{
                            padding: '8px',
                            borderRadius: '6px',
                            border: isSelected ? '2px solid #e61a8d' : '1px solid #ede9e4',
                            backgroundColor: isSelected ? '#e61a8d' : isValid ? 'white' : '#f0f0f0',
                            color: isSelected ? 'white' : isValid ? '#2d2d2d' : '#ccc',
                            cursor: isValid ? 'pointer' : 'not-allowed',
                            fontWeight: '500',
                            fontSize: '12px',
                          }}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px', color: '#2d2d2d', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {icons.clock} Select Time
                </h2>

                {timeSlots.length === 0 ? (
                  <div style={{
                    padding: '24px',
                    textAlign: 'center',
                    backgroundColor: '#f9f3f0',
                    borderRadius: '8px',
                    border: '1px solid #ede9e4'
                  }}>
                    <p style={{ color: '#5a5a5a', fontSize: '14px' }}>
                      No available slots for today. Please select a future date.
                    </p>
                  </div>
                ) : (
                  <>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                      gap: '12px',
                      maxHeight: '400px',
                      overflowY: 'auto',
                      paddingRight: '8px'
                    }}>
                      {timeSlots.map((slot) => {
                        const durationM = getTestSpecs(testType, subject, level).duration_minutes || 60;
                        const isSelected = selectedSlot?.id === slot.id;
                        const isAvailable = slot.available && !slot.already_scheduled;
                        const slotLabel = slot.already_scheduled
                          ? 'Already Scheduled'
                          : isAvailable
                            ? 'Slot available'
                            : 'Fully booked';

                        return (
                          <button
                            key={slot.id}
                            onClick={() => isAvailable && setSelectedSlot(slot)}
                            disabled={!isAvailable}
                            style={{
                              padding: '14px',
                              borderRadius: '8px',
                              border: isSelected ? '2px solid #e61a8d' : (isAvailable ? '1px solid #ede9e4' : '1px solid #fee2e2'),
                              backgroundColor: isSelected ? '#fde8f5' : (isAvailable ? 'white' : '#fff5f5'),
                              cursor: isAvailable ? 'pointer' : 'not-allowed',
                              textAlign: 'center',
                              opacity: isAvailable ? 1 : 0.7,
                              transition: 'all 0.2s',
                            }}
                          >
                            <div style={{ fontWeight: '700', color: isAvailable ? '#2d2d2d' : '#9ca3af', fontSize: '14px' }}>
                              {formatSlotTimeRange(slot.startTime, slot.endTime, durationM)}
                            </div>
                            <div style={{ fontSize: '12px', color: slot.already_scheduled ? '#dc2626' : (isAvailable ? '#059669' : '#9ca3af'), marginTop: '4px', fontWeight: '600' }}>
                              {slotLabel}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Schedule Button */}
                    <button
                      onClick={handleScheduleTest}
                      disabled={!selectedSlot || submitting}
                      style={{
                        width: '100%',
                        marginTop: '24px',
                        padding: '12px',
                        backgroundColor: selectedSlot && !submitting ? '#e61a8d' : '#ccc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '600',
                        cursor: selectedSlot && !submitting ? 'pointer' : 'not-allowed',
                        fontSize: '16px',
                      }}
                    >
                      {submitting ? 'Scheduling...' : 'Schedule Test'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
