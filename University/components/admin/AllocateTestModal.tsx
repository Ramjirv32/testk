'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GRE_API_URL } from '@/lib/config';
import { X, Check, Search, ShieldCheck, Layers, Calendar, Clock, AlertCircle } from 'lucide-react';

interface Question {
  id: string;
  subject: string;
  category: string;
  level: string;
  question_text: string;
}

interface CategoryStat {
  subject: string;
  category: string;
  level: string;
  count: number;
}

interface AllocateTestModalProps {
  token: string;
  studentId?: string;
  studentName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId?: string | null;
  initialTicketType?: string;
  initialCategory?: string;
  initialLevel?: string;
}

const CATEGORY_TAXONOMY: Record<string, Record<string, string[]>> = {
  "Quantitative Reasoning": {
    "Geometry & Measurement": ["Circle", "2D Geometry", "3D Geometry", "3D Figures", "3d & Coordinate Geometry", "3D_Co-ordinate Geometry", "Coordinate geometry"],
    "Algebra & Functions": ["Linear Equations & Inequations", "Linear Equations and Inequations", "Functions", "Quadratic Equations"],
    "Arithmetic & Numbers": ["Fraction & Decimals", "Ratio and Proportion", "Average", "Percent", "Numbers and Number Properties"],
    "Data Analysis & Statistics": ["DATA INTERPRETATION", "Data Interpretation", "Probability", "Permutation & Combination"]
  },
  "Verbal Reasoning": {
    "Text Completion (TC)": ["GRE TEXT COMPLETION HARD", "GRE TEXT COMPLETION MEDIUM", "TEXT COMPLETION HARD", "Text Completion Single Blank"],
    "Sentence Equivalence (SE)": ["Sentence Equivalence", "GRE VERBAL MATERIAL", "Verbal New Format-2_ 189 Q_s", "Verbal  New Format-1_ 300 Q_s"],
    "Reading Comprehension (RC)": ["Reading Comprehension Short", "Reading Comprehension Long", "Critical Reasoning"]
  },
  "Analytical Writing (AWA)": {
    "Analyze an Issue": ["AWA", "AWA  ISSUE", "Issue Essay Prompt"]
  }
};

function formatDate12H(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    });
  } catch {
    return iso;
  }
}

interface DateTimePicker12HProps {
  label: string;
  valueISO: string;
  onChangeISO: (newISO: string) => void;
  accentColor?: 'blue' | 'red';
}

const DateTimePicker12H: React.FC<DateTimePicker12HProps> = ({ label, valueISO, onChangeISO, accentColor = 'blue' }) => {
  const d = valueISO ? new Date(valueISO) : new Date();
  const isValid = !isNaN(d.getTime());
  const dateStr = isValid
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    : '';

  let h24 = isValid ? d.getHours() : 12;
  const mins = isValid ? String(Math.floor(d.getMinutes() / 5) * 5).padStart(2, '0') : '00';
  const ampm = h24 >= 12 ? 'PM' : 'AM';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  const hourStr = String(h12).padStart(2, '0');

  const updateParts = (newDate: string, newHour: string, newMin: string, newAmPm: string) => {
    if (!newDate) return;
    let h = parseInt(newHour, 10) || 12;
    if (newAmPm === 'PM' && h < 12) h += 12;
    if (newAmPm === 'AM' && h === 12) h = 0;
    const hStr = String(h).padStart(2, '0');
    const mStr = String(parseInt(newMin, 10) || 0).padStart(2, '0');
    onChangeISO(`${newDate}T${hStr}:${mStr}`);
  };

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <div>
      <label className="block font-bold text-slate-700 mb-1">{label}</label>
      <div className="flex flex-wrap items-center gap-1.5 bg-white p-2 border border-slate-300 rounded-lg shadow-2xs">
        <input
          type="date"
          value={dateStr}
          onChange={e => updateParts(e.target.value, hourStr, mins, ampm)}
          className="px-2 py-1 border border-slate-300 rounded font-bold text-slate-900 bg-slate-50 text-xs focus:outline-none flex-1 min-w-[125px]"
        />
        <select
          value={hourStr}
          onChange={e => updateParts(dateStr, e.target.value, mins, ampm)}
          className="px-1.5 py-1 border border-slate-300 rounded font-bold text-slate-800 bg-slate-50 text-xs focus:outline-none"
        >
          {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
        </select>
        <span className="font-bold text-slate-500">:</span>
        <select
          value={minutesList.includes(mins) ? mins : '00'}
          onChange={e => updateParts(dateStr, hourStr, e.target.value, ampm)}
          className="px-1.5 py-1 border border-slate-300 rounded font-bold text-slate-800 bg-slate-50 text-xs focus:outline-none"
        >
          {minutesList.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select
          value={ampm}
          onChange={e => updateParts(dateStr, hourStr, mins, e.target.value)}
          className="px-2.5 py-1 border border-slate-300 rounded font-bold text-white bg-slate-900 text-xs focus:outline-none cursor-pointer"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
      {valueISO && (
        <span className={`text-[10px] font-bold block mt-1 ${accentColor === 'red' ? 'text-red-600' : 'text-blue-700'}`}>
          {accentColor === 'red' ? 'Expires' : 'Starts'}: {formatDate12H(valueISO)}
        </span>
      )}
    </div>
  );
};

export const AllocateTestModal: React.FC<AllocateTestModalProps> = ({
  token,
  studentId,
  studentName,
  isOpen,
  onClose,
  onSuccess,
  ticketId,
  initialTicketType,
  initialCategory,
  initialLevel,
}) => {
  const [allocationMode, setAllocationMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [testType, setTestType] = useState<string>('TOPIC_WISE');
  const [testTitle, setTestTitle] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<string>('');

  const [selectedRoot, setSelectedRoot] = useState<string>('Quantitative Reasoning');
  const [selectedGroup, setSelectedGroup] = useState<string>('Geometry & Measurement');
  const [selectedSubCat, setSelectedSubCat] = useState<string>('Circle');
  const [level, setLevel] = useState<string>('Medium');

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestionIDs, setSelectedQuestionIDs] = useState<string[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [studentsList, setStudentsList] = useState<{ id: string; email: string; name?: string }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>(studentId || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const getPresetDurationMinutes = (type: string) => {
    if (type === 'FULL_LENGTH') return 118;
    if (type === 'SECTIONAL') return 35;
    return 20;
  };

  const calculateDefaultExpiry = (startISO: string, type: string) => {
    if (!startISO) return '';
    try {
      const startDate = new Date(startISO);
      const durationMins = getPresetDurationMinutes(type);
      const expiryDate = new Date(startDate.getTime() + durationMins * 60 * 1000);
      return new Date(expiryDate.getTime() - expiryDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategoryHierarchy();
      fetchStudentsList();
      setSelectedStudentId(studentId || '');
      const now = new Date();
      const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
      setScheduledAt(localNow);
      setExpiresAt(calculateDefaultExpiry(localNow, testType));

      if (initialTicketType) {
        setTestType(initialTicketType);
        if (initialTicketType === 'FULL_LENGTH') {
          setAllocationMode('AUTO');
        }
      }
      if (initialLevel) {
        setLevel(initialLevel);
      }
      if (initialCategory) {
        for (const root of Object.keys(CATEGORY_TAXONOMY)) {
          for (const group of Object.keys(CATEGORY_TAXONOMY[root])) {
            const subs = CATEGORY_TAXONOMY[root][group];
            if (subs.includes(initialCategory)) {
              setSelectedRoot(root);
              setSelectedGroup(group);
              setSelectedSubCat(initialCategory);
              break;
            }
          }
        }
      }
    }
  }, [isOpen, initialTicketType, initialCategory, initialLevel, testType]);

  const handleScheduledAtChange = (newStartISO: string) => {
    setScheduledAt(newStartISO);
    setExpiresAt(calculateDefaultExpiry(newStartISO, testType));
  };

  const handleTestTypeChange = (newType: string) => {
    setTestType(newType);
    if (newType === 'FULL_LENGTH') {
      setAllocationMode('AUTO');
    }
    if (scheduledAt) {
      setExpiresAt(calculateDefaultExpiry(scheduledAt, newType));
    }
  };

  useEffect(() => {
    if (isOpen && studentId && allocationMode === 'MANUAL') {
      fetchAvailableQuestions();
    }
  }, [isOpen, studentId, allocationMode, testType, selectedSubCat, level]);

  const fetchCategoryHierarchy = async () => {
    try {
      const res = await fetch(`${GRE_API_URL}/api/admin/questions/categories`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setCategoryStats(data.data || data || []);
    } catch (err) {
      console.error('Failed to fetch categories hierarchy', err);
    }
  };

  const fetchStudentsList = async () => {
    try {
      const res = await fetch(`${GRE_API_URL}/api/admin/students`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.data?.students || data.students || [];
        const studentArr = Array.isArray(list) ? list : [];
        setStudentsList(studentArr);
        if (!selectedStudentId && !studentId && studentArr.length > 0) {
          setSelectedStudentId(studentArr[0].id || studentArr[0].email);
        }
      }
    } catch (err) {
      console.error('Failed to fetch students list', err);
    }
  };

  const fetchAvailableQuestions = async () => {
    setLoading(true);
    try {
      let url = `${GRE_API_URL}/api/admin/questions/available?student_id=${studentId}`;
      if (testType === 'TOPIC_WISE') {
        url += `&category=${encodeURIComponent(selectedSubCat)}&level=${level}`;
      }
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      setAvailableQuestions(data.data?.available_questions || data.available_questions || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch unassigned questions');
    } finally {
      setLoading(false);
    }
  };

  const categoryCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    categoryStats.forEach((item: any) => {
      const cnt = parseInt(item.count as any, 10) || 0;
      map[item.category] = (map[item.category] || 0) + cnt;
    });
    return map;
  }, [categoryStats]);

  const subjectCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    categoryStats.forEach((item: any) => {
      const cnt = parseInt(item.count as any, 10) || 0;
      const s = item.subject === 'Quant' ? 'Quantitative Reasoning' : item.subject === 'Verbal' ? 'Verbal Reasoning' : 'Analytical Writing (AWA)';
      map[s] = (map[s] || 0) + cnt;
    });
    return map;
  }, [categoryStats]);

  const handleToggleQuestion = (qid: string) => {
    setSelectedQuestionIDs(prev =>
      prev.includes(qid) ? prev.filter(id => id !== qid) : [...prev, qid]
    );
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const targetStudent = selectedStudentId || studentId;
    if (!targetStudent) {
      setError('Please select a Target Student Account from the dropdown before allocating.');
      setSubmitting(false);
      return;
    }

    const now = new Date();
    if (scheduledAt && new Date(scheduledAt) < new Date(now.getTime() - 2 * 60 * 1000)) {
      setError('Scheduled Start Date & Time cannot be in the past. Please select a current or future time.');
      setSubmitting(false);
      return;
    }
    if (scheduledAt && expiresAt && new Date(expiresAt) <= new Date(scheduledAt)) {
      setError('Expiry Date & Time must be set AFTER the Scheduled Start Date & Time.');
      setSubmitting(false);
      return;
    }

    const rawName = typeof studentName === 'string' ? studentName.trim() : '';
    const sName = rawName && rawName.toLowerCase() !== 'undefined' && rawName.toLowerCase() !== 'null' ? rawName : '';
    const autoTitle = `${testType} ${testType === 'TOPIC_WISE' ? `(${selectedSubCat} ${level})` : '(Auto-Mixed)'}${sName ? ` for ${sName}` : ''}`;

    try {
      const payload: any = {
        ticket_type: testType,
        test_title: testTitle || autoTitle,
        requested_category: testType === 'TOPIC_WISE' ? selectedSubCat : undefined,
        requested_level: testType === 'TOPIC_WISE' ? level : undefined,
        allocation_mode: allocationMode,
        question_ids: selectedQuestionIDs,
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      };

      let res: Response;
      if (ticketId) {
        res = await fetch(`${GRE_API_URL}/api/admin/tickets/${ticketId}/approve`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auto_allocate: true,
            test_type: payload.ticket_type,
            test_title: payload.test_title,
            subject: selectedRoot === 'Quantitative Reasoning' ? 'Quant' : selectedRoot === 'Verbal Reasoning' ? 'Verbal' : 'AWA',
            category: payload.requested_category,
            level: payload.requested_level,
            allocation_mode: payload.allocation_mode,
            question_ids: payload.question_ids,
            scheduled_at: payload.scheduled_at,
            expires_at: payload.expires_at,
          }),
        });
      } else {
        res = await fetch(`${GRE_API_URL}/api/admin/allocations/direct`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...payload,
            student_id: selectedStudentId || studentId,
            test_type: testType,
            category: testType === 'TOPIC_WISE' ? selectedSubCat : undefined,
            level: testType === 'TOPIC_WISE' ? level : undefined,
            subject: selectedRoot === 'Quantitative Reasoning' ? 'Quant' : selectedRoot === 'Verbal Reasoning' ? 'Verbal' : 'AWA',
          }),
        });
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to allocate test');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to allocate test');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">

        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="font-bold text-sm">Allocate Test for {studentName || 'Student'}</h3>
              <p className="text-[11px] text-slate-400">ETS Shorter GRE Section-Adaptive Test Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAllocate} className="p-6 flex-1 overflow-y-auto space-y-5 text-xs font-sans">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-lg font-bold">
              {error}
            </div>
          )}

          {/* STUDENT SELECTION */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
            <label className="block font-bold text-slate-800 uppercase text-[11px] tracking-wider">
              Target Student Selection (Select by Email)
            </label>
            <select
              value={selectedStudentId}
              onChange={e => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">-- Choose Student Account by Email --</option>
              {studentsList.map(s => (
                <option key={s.id || s.email} value={s.id || s.email}>
                  {s.email} {s.name ? `(${s.name})` : ''} — ID: {s.id}
                </option>
              ))}
            </select>
          </div>

          {/* 1. TEST FORMAT PRESETS */}
          <div>
            <label className="block font-bold text-slate-800 mb-1.5 uppercase text-[11px] tracking-wider">
              1. Select GRE Test Format Preset
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleTestTypeChange('TOPIC_WISE')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  testType === 'TOPIC_WISE' ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block font-bold text-xs">Topic-Wise Test</span>
                <span className="text-[10px] text-slate-500 font-normal">10-15 Qs (3 Difficulty Levels)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestTypeChange('SECTIONAL')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  testType === 'SECTIONAL' ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block font-bold text-xs">Sectional Test</span>
                <span className="text-[10px] text-slate-500 font-normal">20 Qs (Multi-Topic Mix)</span>
              </button>

              <button
                type="button"
                onClick={() => handleTestTypeChange('FULL_LENGTH')}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  testType === 'FULL_LENGTH' ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold shadow-xs' : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="block font-bold text-xs">Full-Length GRE Exam</span>
                <span className="text-[10px] text-slate-500 font-normal">54 Qs (27 Q + 27 V) + 1 AWA (118 Mins)</span>
              </button>
            </div>
          </div>

          {/* 2. SCHEDULED START DATE/TIME & AUTOMATED EXPIRATION WINDOW */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-blue-600" /> 2. Test Scheduled Start & Automated Expiration Window
            </h4>
            <p className="text-[11px] text-slate-500">
              Select the Scheduled Start Date & 12-Hour AM/PM Time. The expiration window is dynamically calculated based on test type (+118 Mins for Full-Length GRE).
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 items-start">
              <DateTimePicker12H
                label="Scheduled Start Time (12H AM/PM)"
                valueISO={scheduledAt}
                onChangeISO={newISO => handleScheduledAtChange(newISO)}
                accentColor="blue"
              />

              <div className="bg-white p-3 border border-slate-200 rounded-xl space-y-1 shadow-2xs">
                <span className="block font-bold text-slate-700 text-xs uppercase tracking-wider">
                  Automated Dynamic Expiration Window
                </span>
                {expiresAt ? (
                  <div>
                    <span className="text-xs font-bold text-red-600 block">
                      Expires: {formatDate12H(expiresAt)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                      (Dynamically calculated +{getPresetDurationMinutes(testType)} Mins based on preset)
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400 font-semibold block">Calculating expiration time...</span>
                )}
              </div>
            </div>
          </div>

          {/* 3. TEST TITLE & ALLOCATION MODE */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Test Custom Title</label>
              <input
                type="text"
                placeholder="e.g. Full-Length GRE Exam 1"
                value={testTitle}
                onChange={e => setTestTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">Allocation Mode</label>
              <select
                value={allocationMode}
                onChange={e => setAllocationMode(e.target.value as 'AUTO' | 'MANUAL')}
                disabled={testType === 'FULL_LENGTH'}
                className={`w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500 font-bold ${
                  testType === 'FULL_LENGTH' ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'bg-white'
                }`}
              >
                <option value="AUTO">Automatic (Random Unassigned Questions)</option>
                {testType !== 'FULL_LENGTH' && (
                  <option value="MANUAL">Manual Question Selection</option>
                )}
              </select>
            </div>
          </div>

          {/* 4. TOPIC-WISE TAXONOMY PICKER */}
          {testType === 'TOPIC_WISE' && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <Layers className="w-4 h-4 text-blue-600" /> 4. GRE Root Subject & Sub-Category Taxonomy
              </h4>

              {/* Level 1: Root Domain Buttons */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Root Domain</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(CATEGORY_TAXONOMY).map(rootKey => {
                    const qCount = subjectCountMap[rootKey] || 0;
                    return (
                      <button
                        key={rootKey}
                        type="button"
                        onClick={() => {
                          setSelectedRoot(rootKey);
                          const groups = Object.keys(CATEGORY_TAXONOMY[rootKey]);
                          setSelectedGroup(groups[0]);
                          setSelectedSubCat(CATEGORY_TAXONOMY[rootKey][groups[0]][0]);
                        }}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          selectedRoot === rootKey ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {rootKey}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${selectedRoot === rootKey ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                          {qCount} Qs
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Level 2 & 3 Group & Sub-Category Options */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Core Topic Group</label>
                  <select
                    value={selectedGroup}
                    onChange={e => {
                      setSelectedGroup(e.target.value);
                      const subCats = CATEGORY_TAXONOMY[selectedRoot][e.target.value] || [];
                      if (subCats.length > 0) setSelectedSubCat(subCats[0]);
                    }}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {Object.keys(CATEGORY_TAXONOMY[selectedRoot] || {}).map(groupKey => (
                      <option key={groupKey} value={groupKey}>{groupKey}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inner Sub-Category (With Live Counts)</label>
                  <select
                    value={selectedSubCat}
                    onChange={e => setSelectedSubCat(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 font-bold text-blue-700"
                  >
                    {(CATEGORY_TAXONOMY[selectedRoot]?.[selectedGroup] || []).map(subCat => {
                      const cnt = categoryCountMap[subCat] || 0;
                      return (
                        <option key={subCat} value={subCat}>
                          {subCat} ({cnt} Questions)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Difficulty Level (Easy / Medium / Hard)</label>
                <div className="flex gap-3">
                  {['Easy', 'Medium', 'Hard'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setLevel(lvl)}
                      className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                        level === lvl
                          ? lvl === 'Hard' ? 'bg-red-600 text-white' : lvl === 'Medium' ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                          : 'bg-white border border-slate-300 text-slate-700'
                      }`}
                    >
                      {lvl} Level
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Full Length Exam Spec Info */}
          {testType === 'FULL_LENGTH' && (
            <div className="border border-blue-200 rounded-xl p-4 bg-blue-50 text-xs space-y-1.5">
              <p className="font-bold text-blue-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#0073b7]" /> Official ETS Shorter GRE Exam Timers & Section Breakdown:
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[11px] font-semibold pt-1">
                <div className="bg-white p-2 rounded border border-blue-200">AWA: 1 Essay (30 Min)</div>
                <div className="bg-white p-2 rounded border border-blue-200">Verbal 1: 12 Qs (18 Min)</div>
                <div className="bg-white p-2 rounded border border-blue-200">Verbal 2: 15 Qs (23 Min)</div>
                <div className="bg-white p-2 rounded border border-blue-200">Quant 1: 12 Qs (21 Min)</div>
                <div className="bg-white p-2 rounded border border-blue-200">Quant 2: 15 Qs (26 Min)</div>
              </div>
            </div>
          )}

          {/* Manual Question Picker */}
          {allocationMode === 'MANUAL' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-slate-800">
                  Select Questions ({selectedQuestionIDs.length} Selected)
                </span>
                <span className="text-blue-600 font-semibold text-[11px]">
                  Strict Non-Repetition: Previously taken questions are excluded
                </span>
              </div>

              <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                {loading ? (
                  <div className="p-4 text-center text-slate-500">Loading unassigned questions...</div>
                ) : availableQuestions.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 font-medium">
                    No unassigned questions remaining for this student in {selectedSubCat} ({level}).
                  </div>
                ) : (
                  availableQuestions.map(q => (
                    <div
                      key={q.id}
                      onClick={() => handleToggleQuestion(q.id)}
                      className={`p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${
                        selectedQuestionIDs.includes(q.id) ? 'bg-blue-50/80 border-l-4 border-blue-600' : ''
                      }`}
                    >
                      <div className="pr-4">
                        <span className="font-bold text-slate-900 mr-2">[{q.id}]</span>
                        <span className="text-slate-700">{q.question_text?.slice(0, 85)}...</span>
                      </div>
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                        selectedQuestionIDs.includes(q.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                      }`}>
                        {selectedQuestionIDs.includes(q.id) && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Preset: <strong className="text-slate-900">{testType.replace(/_/g, ' ')}</strong>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-[#0073b7] hover:bg-[#005a92] text-white rounded-lg font-bold shadow-2xs transition-all cursor-pointer"
              >
                {submitting ? 'Allocating...' : 'Allocate Test Now'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
