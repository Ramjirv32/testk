'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { GRE_API_URL } from '@/lib/config';
import AWAEssayEditor from '@/components/exam/AWAEssayEditor';

interface Question {
  id: string;
  question_text: string;
  options: any;
  category: string;
  level: string;
  subject?: string;
  question_type?: string;
  passage?: string;
  question_image_url?: string;
  answer?: string;
}

interface ExamState {
  current_question: number;
  section: number;
  answers: Record<string, string>;
  marked_for_review: Set<string>;
  time_remaining: number;
}

const SECTION_CONFIGS = [
  { id: 1, name: 'Analytical Writing (AWA)', time: 1800, count: 1, type: 'AWA' },
  { id: 2, name: 'Verbal Reasoning 1', time: 1080, count: 12, type: 'VERBAL' },
  { id: 3, name: 'Verbal Reasoning 2', time: 1380, count: 15, type: 'VERBAL' },
  { id: 4, name: 'Quantitative Reasoning 1', time: 1260, count: 12, type: 'QUANT' },
  { id: 5, name: 'Quantitative Reasoning 2', time: 1560, count: 15, type: 'QUANT' },
];

const parseOptions = (raw: any): string[] => {
  if (!raw) raw = [];
  let list: string[] = [];

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed.map(String);
      else if (typeof parsed === 'string') list = [parsed];
      else list = [String(raw)];
    } catch {
      list = [String(raw)];
    }
  } else if (Array.isArray(raw)) {
    list = raw.map(String);
  }

  if (list.length === 1 && typeof list[0] === 'string') {
    const single = list[0].trim();
    if (single.startsWith('[') && single.endsWith(']')) {
      try {
        const inner = JSON.parse(single);
        if (Array.isArray(inner)) list = inner.map(String);
      } catch {}
    }
  }

  if (list.length === 1 && typeof list[0] === 'string') {
    const single = list[0].trim();
    if (single.includes(',')) {
      list = single.split(',').map(s => s.trim());
    }
  }

  list = list
    .map(opt => opt.trim())
    .filter(opt => opt.length > 0 && opt !== ',')
    .map(opt => opt.replace(/^(Option\s+[A-E]\s*:\s*|\([a-eA-E]\)\s*|[a-eA-E]\.\s*)/i, '').trim());

  return list;
};

const getFormattedImgUrl = (rawUrl?: string | null): string => {
  if (!rawUrl) return '';
  let url = String(rawUrl).trim();
  if (!url) return '';

  let filename = url;
  if (url.includes('/')) {
    filename = url.split('/').pop() || url;
  }
  try {
    filename = decodeURIComponent(filename);
  } catch {}

  return `${GRE_API_URL}/images/${encodeURIComponent(filename)}`;
};

const TimerIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const BookmarkIcon = ({ filled }: { filled?: boolean }) => (
  <svg className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

function GREExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, isLoading } = useAuth();

  const allocationId = searchParams.get('allocation_id');
  const [sessionId, setSessionId] = useState<string>('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [examState, setExamState] = useState<ExamState>({
    current_question: 0,
    section: 1,
    answers: {},
    marked_for_review: new Set(),
    time_remaining: 118 * 60,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [fullscreenEntered, setFullscreenEntered] = useState(false);
  const [sectionBreak, setSectionBreak] = useState(false);
  const [allocationType, setAllocationType] = useState<string>('');

  const antiCheatState = useAntiCheat({
    allocationId: allocationId || '',
    token: token || '',
    enabled: !!allocationId && !!token,
  });

  useEffect(() => {
    if (!allocationId || !token) return;

    const initExam = async () => {
      try {
        const response = await fetch(`${GRE_API_URL}/api/exam/start`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ allocation_id: allocationId }),
        });

        if (response.ok) {
          const data = await response.json();
          const activeSessionId = data.sessionId || data.data?.session?.id || data.data?.id || '';
          setSessionId(activeSessionId);
          const rawQuestions = data.questions || data.data?.questions || [];
          const qs = rawQuestions.map((q: Question) => ({ ...q, options: parseOptions(q.options) }));
          setQuestions(qs);
          const allocType = data.allocation?.test_type || data.data?.allocation?.test_type || '';
          setAllocationType(allocType);
          const isFullLength = allocType === 'FULL_LENGTH' || qs.length >= 50;
          if (isFullLength) {
            const secIdx = 0;
            setExamState(prev => ({
              ...prev,
              section: 1,
              time_remaining: SECTION_CONFIGS[secIdx]?.time || 1080,
            }));
          } else {
            const totalTime = (data.allocation?.duration_minutes || data.data?.allocation?.duration_minutes || 60) * 60;
            setExamState(prev => ({ ...prev, time_remaining: totalTime }));
          }
        } else {
          const data = await response.json().catch(() => null);
          setLoadError(data?.error || 'Unable to start exam session');
        }
      } catch (error) {
        console.error('Error starting exam:', error);
        setLoadError('Unable to start exam session. Please check your network.');
      } finally {
        setLoading(false);
      }
    };

    initExam();
  }, [allocationId, token]);

  useEffect(() => {
    if (!loading && questions.length > 0 && antiCheatState.requestFullscreen) {
      antiCheatState.requestFullscreen();
    }
  }, [loading, questions.length]);

  useEffect(() => {
    if (loading || submitting || sectionBreak) return;
    const interval = setInterval(() => {
      setExamState(prev => {
        const newTime = prev.time_remaining - 1;
        if (newTime <= 0) {
          clearInterval(interval);
          handleTimeExpire();
          return prev;
        }
        return { ...prev, time_remaining: newTime };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, submitting, sectionBreak]);

  const isFullLengthTest = allocationType === 'FULL_LENGTH' || questions.length >= 50;

  // Section-adaptive difficulty: track target difficulty for V2 and Q2
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<{ v2: string; q2: string }>({ v2: 'mixed', q2: 'mixed' });

  // Calculate accuracy for a set of questions in a section
  const calculateSectionAccuracy = (sectionQs: Question[], answers: Record<string, string>): number => {
    if (sectionQs.length === 0) return 0;
    let correct = 0;
    for (const q of sectionQs) {
      const studentAnswer = answers[q.id];
      if (studentAnswer && q.answer && String(studentAnswer).trim().toLowerCase() === String(q.answer).trim().toLowerCase()) {
        correct++;
      }
    }
    return (correct / sectionQs.length) * 100;
  };

  // Determine adaptive difficulty based on accuracy
  // >= 60% correct → Hard (student is strong, give harder questions)
  // 40-59% → Medium
  // < 40% → Easy (student is struggling, give easier questions)
  const getAdaptiveDifficulty = (accuracy: number): string => {
    if (accuracy >= 60) return 'Hard';
    if (accuracy >= 40) return 'Medium';
    return 'Easy';
  };

  // Sort questions by target difficulty, putting matching difficulty first
  const sortByDifficulty = (qs: Question[], targetDifficulty: string): Question[] => {
    if (targetDifficulty === 'mixed') return qs;
    const difficultyOrder: Record<string, number> = {};
    qs.forEach(q => {
      const level = (q.level || '').toUpperCase();
      if (level.includes(targetDifficulty.toUpperCase())) {
        difficultyOrder[q.id] = 0;
      } else if (level.includes('EASY') && targetDifficulty === 'Hard') {
        difficultyOrder[q.id] = 2;
      } else if (level.includes('HARD') && targetDifficulty === 'Easy') {
        difficultyOrder[q.id] = 2;
      } else {
        difficultyOrder[q.id] = 1;
      }
    });
    return [...qs].sort((a, b) => (difficultyOrder[a.id] || 1) - (difficultyOrder[b.id] || 1));
  };

  const currentSectionQuestions = useMemo(() => {
    if (!isFullLengthTest) return questions;
    if (examState.section === 1) return questions.slice(0, 1);
    if (examState.section === 2) return questions.slice(1, 13);
    if (examState.section === 3) {
      const v2Qs = questions.slice(13, 28);
      return sortByDifficulty(v2Qs, adaptiveDifficulty.v2);
    }
    if (examState.section === 4) return questions.slice(28, 40);
    const q2Qs = questions.slice(40, 55);
    return sortByDifficulty(q2Qs, adaptiveDifficulty.q2);
  }, [questions, examState.section, isFullLengthTest, adaptiveDifficulty]);

  const handleTimeExpire = () => {
    if (isFullLengthTest && examState.section < SECTION_CONFIGS.length) {
      handleCompleteCurrentSection();
    } else {
      handleSubmitExam();
    }
  };

  const handleCompleteCurrentSection = () => {
    // Section-adaptive: calculate difficulty for V2 based on V1 performance
    if (isFullLengthTest && examState.section === 2) {
      const v1Qs = questions.slice(1, 13);
      const accuracy = calculateSectionAccuracy(v1Qs, examState.answers);
      const diff = getAdaptiveDifficulty(accuracy);
      setAdaptiveDifficulty(prev => ({ ...prev, v2: diff }));
    }
    // Section-adaptive: calculate difficulty for Q2 based on Q1 performance
    if (isFullLengthTest && examState.section === 4) {
      const q1Qs = questions.slice(28, 40);
      const accuracy = calculateSectionAccuracy(q1Qs, examState.answers);
      const diff = getAdaptiveDifficulty(accuracy);
      setAdaptiveDifficulty(prev => ({ ...prev, q2: diff }));
    }

    if (isFullLengthTest && examState.section < SECTION_CONFIGS.length) {
      setSectionBreak(true);
    } else {
      handleSubmitExam();
    }
  };

  const handleStartNextSection = () => {
    const nextSec = examState.section + 1;
    setExamState(prev => ({
      ...prev,
      section: nextSec,
      current_question: 0,
      time_remaining: SECTION_CONFIGS[nextSec - 1]?.time || 1080,
    }));
    setSectionBreak(false);
  };

  const handleAnswerSelect = useCallback(async (questionId: string, answer: string) => {
    setExamState(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answer },
    }));

    try {
      await fetch(`${GRE_API_URL}/api/exam/save-answer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId || allocationId,
          allocationId: allocationId,
          questionId: questionId,
          selectedAnswer: answer,
        }),
      });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  }, [token, allocationId, sessionId]);

  const handleMarkForReview = useCallback(async (questionId: string) => {
    const isCurrentlyMarked = examState.marked_for_review.has(questionId);

    setExamState(prev => {
      const newMarked = new Set(prev.marked_for_review);
      if (isCurrentlyMarked) {
        newMarked.delete(questionId);
      } else {
        newMarked.add(questionId);
      }
      return { ...prev, marked_for_review: newMarked };
    });

    try {
      await fetch(`${GRE_API_URL}/api/exam/mark-for-review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: sessionId || allocationId,
          questionId: questionId,
          marked: !isCurrentlyMarked,
        }),
      });
    } catch (err) {
      console.error('Error marking question for review:', err);
    }
  }, [token, sessionId, allocationId, examState.marked_for_review]);

  const handleNextQuestion = () => {
    if (examState.current_question < currentSectionQuestions.length - 1) {
      setExamState(prev => ({ ...prev, current_question: prev.current_question + 1 }));
    }
  };

  const handlePrevQuestion = () => {
    if (examState.current_question > 0) {
      setExamState(prev => ({ ...prev, current_question: prev.current_question - 1 }));
    }
  };

  const handleNextSection = () => {
    handleCompleteCurrentSection();
  };

  const handleSubmitExam = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${GRE_API_URL}/api/exam/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allocationId: allocationId,
          sessionId: sessionId || allocationId,
          answers: examState.answers,
        }),
      });

      if (response.ok) {
        router.push(`/user-dashboard/gre-result?allocation_id=${allocationId}`);
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isNumericEntry = (opts: string[]) => opts.length === 0;
  const is3Blank = (q: Question, opts: string[]) =>
    opts.length === 9 || (q.question_text?.includes('(blank I)') && q.question_text?.includes('(blank II)') && q.question_text?.includes('(blank III)')) ||
    (q.question_text?.includes('(i)') && q.question_text?.includes('(ii)') && q.question_text?.includes('(iii)'));
  const isMultiSelect = (q: Question) =>
    q.question_type?.toUpperCase().includes('MULTI') ||
    q.question_text?.toLowerCase().includes('select all') ||
    q.question_text?.toLowerCase().includes('select two') ||
    q.question_text?.toLowerCase().includes('select one or more');
  const isAWA = (q: Question) => (q.subject || '').toUpperCase() === 'AWA' || (q.category || '').toUpperCase().includes('AWA');

  const renderOptions = (q: Question, opts: string[]) => {
    if (!q) return null;

    if (isNumericEntry(opts)) {
      return (
        <div style={{ padding: '16px', backgroundColor: '#f8f5f0', border: '1px solid #ede9e4', borderRadius: '8px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#5a5a5a', marginBottom: '8px', textTransform: 'uppercase' }}>
            Numeric Entry Answer
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="text"
              value={examState.answers[q.id] || ''}
              onChange={(e) => handleAnswerSelect(q.id, e.target.value)}
              placeholder="Enter numeric value..."
              style={{
                maxWidth: '300px',
                padding: '12px',
                border: '1px solid #ede9e4',
                borderRadius: '8px',
                fontSize: '14px',
                fontFamily: 'monospace',
                fontWeight: 600,
                outline: 'none',
                backgroundColor: 'white',
              }}
            />
            <span style={{ fontSize: '12px', color: '#5a5a5a' }}>Type your numerical answer above</span>
          </div>
        </div>
      );
    }

    if (is3Blank(q, opts) && opts.length >= 9) {
      const blank1Opts = opts.slice(0, 3);
      const blank2Opts = opts.slice(3, 6);
      const blank3Opts = opts.slice(6, 9);

      let selected: string[] = [];
      if (examState.answers[q.id]) {
        selected = examState.answers[q.id].split(',').map(s => s.trim());
      }

      const selectBlank = (blankIdx: number, val: string) => {
        const newSel = [selected[0] || '', selected[1] || '', selected[2] || ''];
        newSel[blankIdx] = val;
        handleAnswerSelect(q.id, newSel.join(', '));
      };

      const renderBlankColumn = (blankOpts: string[], blankIdx: number, label: string, startLetter: number) => (
        <div style={{ border: '1px solid #ede9e4', borderRadius: '8px', padding: '12px', backgroundColor: '#fafafa' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2d2d2d', paddingBottom: '8px', borderBottom: '1px solid #ede9e4', marginBottom: '8px' }}>
            {label}
          </div>
          {blankOpts.map((opt, idx) => {
            const letter = String.fromCharCode(startLetter + idx);
            const isSelected = selected[blankIdx] === opt || selected[blankIdx] === letter;
            return (
              <button
                key={idx}
                onClick={() => selectBlank(blankIdx, opt)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '6px',
                  border: isSelected ? '2px solid #e61a8d' : '1px solid #ede9e4',
                  backgroundColor: isSelected ? '#fde8f5' : 'white',
                  color: isSelected ? '#e61a8d' : '#2d2d2d',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '6px',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid #e61a8d' : '1px solid #ede9e4',
                  backgroundColor: isSelected ? '#e61a8d' : 'white',
                  color: isSelected ? 'white' : '#5a5a5a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>{letter}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt}</span>
              </button>
            );
          })}
        </div>
      );

      return (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#e61a8d', marginBottom: '12px' }}>
            Select one choice from each column for Blank (i), Blank (ii), and Blank (iii):
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {renderBlankColumn(blank1Opts, 0, 'Blank (i)', 65)}
            {renderBlankColumn(blank2Opts, 1, 'Blank (ii)', 68)}
            {renderBlankColumn(blank3Opts, 2, 'Blank (iii)', 71)}
          </div>
        </div>
      );
    }

    if (isMultiSelect(q)) {
      let selected: string[] = [];
      if (examState.answers[q.id]) {
        selected = examState.answers[q.id].split(',').map(s => s.trim()).filter(Boolean);
      }

      const toggleOption = (opt: string) => {
        let newSel = [...selected];
        if (newSel.includes(opt)) {
          newSel = newSel.filter(s => s !== opt);
        } else {
          newSel.push(opt);
        }
        handleAnswerSelect(q.id, newSel.join(', '));
      };

      return (
        <div style={{ marginTop: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#e61a8d', marginBottom: '12px' }}>
            Select all choices that apply:
          </p>
          {opts.map((opt, oIdx) => {
            const isSelected = selected.includes(opt);
            const letter = String.fromCharCode(65 + oIdx);
            return (
              <button
                key={oIdx}
                onClick={() => toggleOption(opt)}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '8px',
                  border: isSelected ? '2px solid #e61a8d' : '1px solid #ede9e4',
                  backgroundColor: isSelected ? '#fde8f5' : 'white',
                  color: isSelected ? '#e61a8d' : '#2d2d2d',
                  fontWeight: isSelected ? 700 : 400,
                  fontSize: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  marginBottom: '10px',
                  transition: 'all 0.2s',
                }}
              >
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  border: isSelected ? '2px solid #e61a8d' : '1px solid #ede9e4',
                  backgroundColor: isSelected ? '#e61a8d' : 'white',
                  color: isSelected ? 'white' : '#5a5a5a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '2px',
                }}>{isSelected ? '✓' : letter}</span>
                <span style={{ lineHeight: '1.5', flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div style={{ marginTop: '16px' }}>
        {opts.map((option, idx) => {
          const optionLetter = String.fromCharCode(65 + idx);
          const isSelected = examState.answers[q.id] === option;

          return (
            <button
              key={idx}
              onClick={() => handleAnswerSelect(q.id, option)}
              style={{
                width: '100%',
                padding: '16px',
                textAlign: 'left',
                border: isSelected ? '2px solid #e61a8d' : '1px solid #ede9e4',
                backgroundColor: isSelected ? '#fde8f5' : 'white',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                marginBottom: '10px',
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: isSelected ? '#e61a8d' : '#f0f0f0',
                color: isSelected ? 'white' : '#5a5a5a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                flexShrink: 0,
              }}>
                {optionLetter}
              </div>
              <div style={{ flex: 1, color: isSelected ? '#e61a8d' : '#2d2d2d', fontWeight: isSelected ? 600 : 400, lineHeight: '1.5' }}>
                {option}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  if (isLoading || loading) return (
    <div style={{ backgroundColor: '#faf4ec', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '50px', height: '50px', border: '4px solid #e5e7eb', borderTop: '4px solid #e61a8d', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#5a5a5a' }}>Loading exam...</p>
        <style jsx>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
  if (loadError) return (
    <div style={{ backgroundColor: '#faf4ec', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', maxWidth: '500px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', marginBottom: '12px' }}>Unable to Start Exam</h2>
        <p style={{ color: '#5a5a5a', fontSize: '14px', marginBottom: '24px' }}>{loadError}</p>
        <button onClick={() => router.push('/user-dashboard/gre-tests')} style={{ padding: '12px 24px', backgroundColor: '#e61a8d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Back to Tests</button>
      </div>
    </div>
  );
  if (questions.length === 0) return (
    <div style={{ backgroundColor: '#faf4ec', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', maxWidth: '500px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#2d2d2d', marginBottom: '12px' }}>No Questions Found</h2>
        <p style={{ color: '#5a5a5a', fontSize: '14px', marginBottom: '24px' }}>This test does not have any questions assigned.</p>
        <button onClick={() => router.push('/user-dashboard/gre-tests')} style={{ padding: '12px 24px', backgroundColor: '#e61a8d', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Back to Tests</button>
      </div>
    </div>
  );
  if (antiCheatState.isTerminated) {
    return (
      <div style={{ backgroundColor: '#faf4ec', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', maxWidth: '500px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626', marginBottom: '12px' }}>
            Exam Terminated
          </h2>
          <p style={{ color: '#5a5a5a', fontSize: '16px', marginBottom: '12px' }}>
            Your exam has been terminated due to malpractice detection.
          </p>
          <p style={{ color: '#999', fontSize: '14px', marginBottom: '24px' }}>
            Violations detected: {antiCheatState.violationCount}
          </p>
          <button
            onClick={() => router.push('/user-dashboard/gre-dashboard')}
            style={{
              padding: '12px 24px',
              backgroundColor: '#e61a8d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = currentSectionQuestions[examState.current_question];
  const parsedOpts = parseOptions(currentQuestion?.options);
  const isAnswered = currentQuestion && currentQuestion.id in examState.answers;
  const isMarked = currentQuestion && examState.marked_for_review.has(currentQuestion.id);
  const timeWarning = examState.time_remaining < 300;
  const curSecConfig = SECTION_CONFIGS[examState.section - 1];
  const isAwaQuestion = isFullLengthTest
    ? curSecConfig?.type === 'AWA'
    : isAWA(currentQuestion);
  const hasPassage = !!currentQuestion?.passage;

  if (sectionBreak) {
    return (
      <div style={{ backgroundColor: '#faf4ec', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ backgroundColor: 'white', padding: '40px', borderRadius: '12px', maxWidth: '500px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#d4edda', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
            ✓
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#2d2d2d', marginBottom: '12px' }}>
            Section {examState.section} Completed!
          </h2>
          <p style={{ color: '#5a5a5a', fontSize: '14px', marginBottom: '24px' }}>
            {isFullLengthTest && examState.section < SECTION_CONFIGS.length
              ? `Take a short break before continuing to Section ${examState.section + 1}: ${SECTION_CONFIGS[examState.section]?.name}. The timer for the next section (${Math.round((SECTION_CONFIGS[examState.section]?.time || 0) / 60)} minutes) will start when you click below.`
              : 'All sections completed. Click below to submit your exam.'}
          </p>
          {(isFullLengthTest && (examState.section === 2 || examState.section === 4)) && (
            <div style={{ backgroundColor: '#f0f4ff', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', color: '#3b5998' }}>
              <strong>Section-Adaptive Routing:</strong>{' '}
              {examState.section === 2
                ? `Based on your Verbal 1 performance, Verbal 2 questions will be ${adaptiveDifficulty.v2} difficulty.`
                : `Based on your Quant 1 performance, Quant 2 questions will be ${adaptiveDifficulty.q2} difficulty.`}
            </div>
          )}
          <button
            onClick={handleStartNextSection}
            style={{
              padding: '12px 24px',
              backgroundColor: '#e61a8d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
            }}
          >
            {isFullLengthTest && examState.section < SECTION_CONFIGS.length
              ? `Begin Section ${examState.section + 1}`
              : 'Submit Exam'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#faf4ec', minHeight: '100vh', padding: '20px' }}>
      {/* Header */}
      <div style={{
        backgroundColor: 'white',
        padding: '16px 24px',
        borderRadius: '8px',
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 700, color: '#2d2d2d', margin: 0 }}>
            GRE Exam{isFullLengthTest ? ` - Section ${examState.section} of ${SECTION_CONFIGS.length}: ${curSecConfig?.name || ''}` : ''}
          </h1>
          <p style={{ fontSize: '14px', color: '#5a5a5a', margin: '4px 0 0 0' }}>
            Question {examState.current_question + 1} of {currentSectionQuestions.length}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {antiCheatState.violationCount > 0 && (
            <div style={{
              padding: '10px 16px',
              backgroundColor: antiCheatState.violationCount >= 3 ? '#dc2626' : '#f59e0b',
              color: 'white',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '12px',
            }}>
              Violations: {antiCheatState.violationCount}/3
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 16px',
            backgroundColor: timeWarning ? '#fff3cd' : '#f0f0f0',
            borderRadius: '8px',
          }}>
            <TimerIcon />
            <div style={{ fontWeight: 700, color: timeWarning ? '#856404' : '#2d2d2d', fontSize: '14px' }}>
              {formatTime(examState.time_remaining)}
            </div>
          </div>

          <button
            onClick={() => setShowExitConfirm(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#f0f0f0',
              border: '1px solid #ede9e4',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              color: '#2d2d2d',
            }}
          >
            Exit
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
        {/* Main Question Area */}
        <div style={{ backgroundColor: 'white', padding: '32px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>

          {hasPassage ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
              <div style={{ borderRight: '1px solid #ede9e4', paddingRight: '24px', overflowY: 'auto', maxHeight: '500px' }}>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#5a5a5a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                  Reading Passage
                </h3>
                <p style={{ fontSize: '14px', color: '#2d2d2d', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                  {currentQuestion.passage}
                </p>
              </div>
              <div style={{ overflowY: 'auto', maxHeight: '500px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2d2d2d', marginBottom: '12px' }}>
                  Question {examState.current_question + 1}
                </h2>
                <p style={{ fontSize: '15px', color: '#2d2d2d', lineHeight: '1.6', marginBottom: '16px' }}>
                  {currentQuestion.question_text}
                </p>
                {currentQuestion.question_image_url && (
                  <img
                    src={getFormattedImgUrl(currentQuestion.question_image_url)}
                    alt="Question"
                    style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', marginBottom: '20px' }}
                    onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                  />
                )}
                {renderOptions(currentQuestion, parsedOpts)}
              </div>
            </div>
          ) : isAwaQuestion ? (
            <div style={{ marginBottom: '24px' }}>
              <AWAEssayEditor
                promptText={currentQuestion?.question_text || 'Write a response in which you discuss the extent to which you agree or disagree with the statement and explain your reasoning for the position you take.'}
                value={examState.answers[currentQuestion?.id] || ''}
                onChange={(val) => {
                  if (currentQuestion) {
                    handleAnswerSelect(currentQuestion.id, val);
                  }
                }}
              />
            </div>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#2d2d2d', marginBottom: '12px' }}>
                Question {examState.current_question + 1}
              </h2>
              <p style={{ fontSize: '15px', color: '#2d2d2d', lineHeight: '1.6', marginBottom: '16px' }}>
                {currentQuestion.question_text}
              </p>
              {currentQuestion.question_image_url && (
                <img
                  src={getFormattedImgUrl(currentQuestion.question_image_url)}
                  alt="Question"
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', marginBottom: '20px' }}
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              )}
              {renderOptions(currentQuestion, parsedOpts)}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between', marginTop: '24px' }}>
            <button
              onClick={() => handleMarkForReview(currentQuestion.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                backgroundColor: isMarked ? '#e61a8d' : 'white',
                color: isMarked ? 'white' : '#e61a8d',
                border: '1px solid #e61a8d',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <BookmarkIcon filled={isMarked} />
              {isMarked ? 'Marked' : 'Mark'}
            </button>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handlePrevQuestion}
                disabled={examState.current_question === 0}
                style={{
                  padding: '10px 16px',
                  backgroundColor: examState.current_question === 0 ? '#f0f0f0' : 'white',
                  border: '1px solid #ede9e4',
                  borderRadius: '6px',
                  cursor: examState.current_question === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 600,
                  color: '#2d2d2d',
                  opacity: examState.current_question === 0 ? 0.5 : 1,
                }}
              >
                <ChevronLeftIcon />
                Prev
              </button>

              {examState.current_question === currentSectionQuestions.length - 1 ? (
                isFullLengthTest && examState.section < SECTION_CONFIGS.length ? (
                  <button
                    onClick={handleCompleteCurrentSection}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#e61a8d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Next Section →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitExam}
                    disabled={submitting}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#e61a8d',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: submitting ? 'not-allowed' : 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                )
              ) : (
                <button
                  onClick={handleNextQuestion}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: 'white',
                    border: '1px solid #ede9e4',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: 600,
                    color: '#2d2d2d',
                  }}
                >
                  Next
                  <ChevronRightIcon />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Question Navigator */}
        <div style={{ backgroundColor: 'white', padding: '16px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', height: 'fit-content', position: 'sticky', top: '20px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', color: '#2d2d2d' }}>
            {isFullLengthTest ? `Section ${examState.section} Questions` : 'Questions'}
          </h3>
          {isFullLengthTest && (
            <p style={{ fontSize: '11px', color: '#888', margin: '0 0 12px' }}>
              {curSecConfig?.name}
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px', maxHeight: '400px', overflowY: 'auto' }}>
            {currentSectionQuestions.map((q: Question, idx: number) => {
              const isCurrentQ = idx === examState.current_question;
              const isAnsweredQ = q.id in examState.answers;
              const isMarkedQ = examState.marked_for_review.has(q.id);

              return (
                <button
                  key={q.id}
                  onClick={() => setExamState(prev => ({ ...prev, current_question: idx }))}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '6px',
                    border: isCurrentQ ? '2px solid #e61a8d' : '1px solid #ede9e4',
                    backgroundColor: isCurrentQ
                      ? '#e61a8d'
                      : isMarkedQ
                      ? '#fff3cd'
                      : isAnsweredQ
                      ? '#d4edda'
                      : 'white',
                    color: isCurrentQ ? 'white' : '#2d2d2d',
                    fontWeight: 600,
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Section Progress for Full-Length */}
          {isFullLengthTest && (
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #ede9e4' }}>
              {SECTION_CONFIGS.map(sec => {
                const isActive = sec.id === examState.section;
                const isDone = sec.id < examState.section;
                return (
                  <div key={sec.id} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '4px 6px', borderRadius: '4px', marginBottom: '3px',
                    fontSize: '10px', fontWeight: 600,
                    backgroundColor: isActive ? '#fde8f5' : isDone ? '#d4edda' : 'transparent',
                    color: isActive ? '#e61a8d' : isDone ? '#065f46' : '#aaa',
                  }}>
                    <span>{isDone ? '✓' : isActive ? '●' : '○'}</span>
                    <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.name}</span>
                    <span>{sec.count}Q</span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop: '16px', fontSize: '11px', color: '#5a5a5a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#d4edda', borderRadius: '2px' }}></div>
              Answered
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#fff3cd', borderRadius: '2px' }}></div>
              Marked
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: 'white', border: '1px solid #ede9e4', borderRadius: '2px' }}></div>
              Unanswered
            </div>
          </div>

          <button
            onClick={handleNextSection}
            style={{
              width: '100%',
              marginTop: '16px',
              padding: '10px',
              backgroundColor: '#e61a8d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            {isFullLengthTest && examState.section < SECTION_CONFIGS.length ? 'Finish Section' : 'Finish Test & Submit'}
          </button>
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '32px',
            borderRadius: '12px',
            maxWidth: '400px',
            textAlign: 'center',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px', color: '#2d2d2d' }}>
              Exit Exam?
            </h2>
            <p style={{ color: '#5a5a5a', marginBottom: '24px' }}>
              Exiting will submit your answers. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowExitConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: 'white',
                  border: '1px solid #ede9e4',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  color: '#2d2d2d',
                }}
              >
                Continue
              </button>
              <button
                onClick={handleSubmitExam}
                style={{
                  flex: 1,
                  padding: '12px',
                  backgroundColor: '#e61a8d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Submit & Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Required Warning Modal */}
      {!antiCheatState.isFullscreen && !loading && !loadError && questions.length > 0 && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '20px', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '32px', borderRadius: '16px',
            maxWidth: '460px', width: '100%', textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)', border: '2px solid #e61a8d'
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fde8f5',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              color: '#e61a8d'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18-5h-3a2 2 0 0 0-2 2v3M3 16v3a2 2 0 0 0 2 2h3m13-2v3a2 2 0 0 1-2 2h-3"/>
              </svg>
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#1a1a1a', margin: '0 0 8px' }}>
              {fullscreenEntered ? '⚠️ Fullscreen Exited' : '🔒 Fullscreen Mode Required'}
            </h2>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', margin: '0 0 20px' }}>
              {fullscreenEntered
                ? 'You exited fullscreen. This has been logged as a proctoring violation. Please re-enter fullscreen to continue your exam.'
                : 'To ensure test integrity and prevent malpractice, this GRE exam must be taken in Fullscreen mode. Exiting fullscreen is logged as a proctoring violation.'}
            </p>
            <button
              onClick={() => {
                setFullscreenEntered(true);
                if (antiCheatState.requestFullscreen) {
                  antiCheatState.requestFullscreen();
                }
              }}
              style={{
                width: '100%', padding: '14px', backgroundColor: '#e61a8d', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(230,26,141,0.3)'
              }}
            >
              {fullscreenEntered ? '🔒 Re-Enter Fullscreen Mode' : '🔒 Enter Fullscreen Mode'}
            </button>
          </div>
        </div>
      )}

      {/* Malpractice Terminated Modal */}
      {antiCheatState.isTerminated && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 3000, padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white', padding: '32px', borderRadius: '16px',
            maxWidth: '460px', width: '100%', textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)', border: '2px solid #dc2626'
          }}>
            <div style={{
              width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#fee2e2',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              color: '#dc2626'
            }}>
              ⚠️
            </div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626', margin: '0 0 8px' }}>
              Exam Terminated (Malpractice Detected)
            </h2>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.6', margin: '0 0 20px' }}>
              {antiCheatState.terminationReason || 'Multiple proctoring violations (fullscreen exit, tab switching, or window blur) were detected during your exam.'}
            </p>
            <button
              onClick={() => router.push('/user-dashboard/gre-dashboard')}
              style={{
                width: '100%', padding: '14px', backgroundColor: '#dc2626', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit'
              }}
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GREExamPageWrapper() {
  return (
    <Suspense fallback={
      <div style={{ backgroundColor: '#faf4ec', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#e61a8d', fontSize: '18px', fontWeight: 600 }}>Loading GRE Exam...</div>
        </div>
      </div>
    }>
      <GREExamPage />
    </Suspense>
  );
}
