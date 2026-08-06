'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { GRE_API_URL } from '@/lib/config';
import StudentLayout from '@/components/student/StudentLayout';

interface Question {
  id: string;
  question_text?: string;
  text?: string;
  options?: any;
  correct_option?: string | number;
  answer?: string;
  category?: string;
  subject?: string;
  difficulty?: string;
  level?: string;
  explanation?: string;
  question_image_url?: string;
  image_url?: string;
  student_answer?: string | null;
  is_correct?: boolean;
}

interface UserAnswer {
  question_id: string;
  selected_option: string | number | null;
  is_correct: boolean;
  time_spent?: number;
}

interface TestResultDetail {
  id: string;
  test_title: string;
  test_type: string;
  score_percent: number | null;
  total_questions: number;
  correct_answers: number;
  status: string;
  completed_at: string;
  questions: Question[];
  user_answers: UserAnswer[];
}

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

const parseOptions = (raw: any, qText?: string, qCategory?: string): string[] => {
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

  const isQC = (qText && (qText.includes('Quantity A') || qText.includes('Quantity B') || qText.includes('Column A') || qText.includes('Column B'))) ||
               (qCategory && qCategory.toLowerCase().includes('quantity'));

  if (isQC && (list.length === 0 || (list.length === 1 && list[0].length <= 3))) {
    return [
      'Quantity A is greater.',
      'Quantity B is greater.',
      'The two quantities are equal.',
      'The relationship cannot be determined from the information given.'
    ];
  }

  return list;
};

function GREResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, isLoading } = useAuth();

  const [result, setResult] = useState<TestResultDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL (Full Test)');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('ALL');

  const explanationsRef = useRef<HTMLDivElement>(null);

  const allocationId = searchParams.get('allocation_id') || searchParams.get('allocationId');
  const resultId = searchParams.get('result_id') || searchParams.get('resultId') || searchParams.get('id') || allocationId;

  useEffect(() => {
    if (!isLoading && !user) { router.push('/login'); }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!token || !resultId) return;

    const fetchResultDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        let res = await fetch(`${GRE_API_URL}/api/student/results/${resultId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) {
          res = await fetch(`${GRE_API_URL}/api/results/${resultId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        if (!res.ok) {
          res = await fetch(`${GRE_API_URL}/api/results/result/${resultId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }

        if (res.ok) {
          const raw = await res.json();
          const data = raw.data || raw;
          const alloc = data.allocation || data.result || data || {};
          const qList = data.questions || alloc.questions || raw.questions || [];
          const uAnswers = data.user_answers || raw.user_answers || [];

          const transformedResult: TestResultDetail = {
            id: alloc.id || resultId,
            test_title: alloc.test_title || alloc.test_type || 'GRE Test',
            test_type: alloc.test_type || 'PRACTICE',
            score_percent: typeof alloc.score_percent === 'number' ? alloc.score_percent : (typeof alloc.total_score === 'number' ? Math.round((alloc.total_score / 340) * 100) : 0),
            total_questions: qList.length,
            correct_answers: qList.filter((q: any) => q.is_correct === true).length,
            status: alloc.status || 'COMPLETED',
            completed_at: data.exam_session?.completed_at || alloc.submitted_at || alloc.created_at || new Date().toISOString(),
            questions: qList.map((q: any) => ({
              id: q.id,
              question_text: q.question_text || q.text || '',
              options: q.options || [],
              correct_option: q.correct_option || q.answer || '',
              category: q.category || 'General',
              subject: q.subject || 'Mixed',
              difficulty: q.difficulty || q.level || 'Medium',
              question_image_url: q.question_image_url || q.image_url,
              explanation: q.explanation || '',
              student_answer: q.student_answer,
              is_correct: q.is_correct ?? false,
            })),
            user_answers: uAnswers.length > 0 ? uAnswers : qList.map((q: any) => ({
              question_id: q.id,
              selected_option: q.student_answer,
              is_correct: q.is_correct ?? false,
              time_spent: 0,
            })),
          };

          setResult(transformedResult);
          setSelectedSubject('ALL (Full Test)');
        } else {
          setError('Failed to fetch detailed result report');
        }
      } catch (err: any) {
        setError('Error loading performance report');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResultDetail();
  }, [token, resultId]);

  const scrollToExplanations = () => {
    explanationsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (isLoading || loading) {
    return (
      <StudentLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #e61a8d', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </StudentLayout>
    );
  }

  if (error || !result) {
    return (
      <StudentLayout>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '40px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#e11d48', fontSize: '16px', fontWeight: '700' }}>{error || 'Test result scorecard not found'}</p>
          <Link href="/user-dashboard/gre-tests" style={{ color: '#e61a8d', fontWeight: '700', textDecoration: 'underline', marginTop: '12px', display: 'inline-block' }}>
            ← Return to My Tests &amp; Results
          </Link>
        </div>
      </StudentLayout>
    );
  }

  const getOptionLabel = (index: number) => String.fromCharCode(65 + index);

  const getRootSubject = (q: Question): string => {
    const sub = (q.subject || '').toUpperCase();
    const cat = (q.category || '').toUpperCase();
    if (sub === 'AWA' || cat.includes('AWA')) return 'Analytical Writing (AWA)';
    if (sub === 'VERBAL' || cat.includes('VERBAL') || cat.includes('TEXT COMPLETION') || cat.includes('READING') || cat.includes('SENTENCE')) return 'Verbal Reasoning';
    return 'Quantitative Reasoning';
  };

  const questionsInSubject = selectedSubject === 'ALL (Full Test)'
    ? result.questions
    : result.questions.filter((q) => getRootSubject(q) === selectedSubject);

  const subCategoriesInSubject = Array.from(new Set(questionsInSubject.map((q) => q.category || 'General')));

  const filteredQuestions = selectedSubCategory === 'ALL'
    ? questionsInSubject
    : questionsInSubject.filter((q) => (q.category || 'General') === selectedSubCategory);

  const answeredByStudent = result.user_answers.filter(a => a.selected_option !== null && a.selected_option !== undefined && String(a.selected_option).trim() !== '');
  const correctCount = result.user_answers.filter(a => a.is_correct === true).length;
  const totalQs = result.questions.length;
  const accuracyPct = answeredByStudent.length > 0 ? Math.round((correctCount / answeredByStudent.length) * 100) : 0;

  const verbalQs = result.questions.filter(q => getRootSubject(q) === 'Verbal Reasoning');
  const quantQs = result.questions.filter(q => getRootSubject(q) === 'Quantitative Reasoning');
  const verbalCorrect = result.user_answers.filter(a => a.is_correct && verbalQs.some(q => q.id === a.question_id)).length;
  const quantCorrect = result.user_answers.filter(a => a.is_correct && quantQs.some(q => q.id === a.question_id)).length;

  const verbalScore = verbalQs.length > 0 ? Math.round(130 + (verbalCorrect / verbalQs.length) * 40) : 130;
  const quantScore = quantQs.length > 0 ? Math.round(130 + (quantCorrect / quantQs.length) * 40) : 130;
  const overallScore = verbalScore + quantScore;

  const buildCategoryBreakdown = (questions: Question[]) => {
    const map: Record<string, { total: number; correct: number }> = {};
    questions.forEach(q => {
      const cat = q.category || q.subject || 'General';
      if (!map[cat]) map[cat] = { total: 0, correct: 0 };
      map[cat].total++;
      if (result.user_answers.find(a => a.question_id === q.id)?.is_correct) map[cat].correct++;
    });
    return Object.entries(map).map(([cat, { total, correct }]) => ({
      category: `${cat} (${correct}/${total})`,
      catName: cat,
      correct,
      total,
      pct: total > 0 ? Math.round((correct / total) * 100) : 0,
    }));
  };

  const verbalBreakdownItems = buildCategoryBreakdown(verbalQs);
  const quantBreakdownItems = buildCategoryBreakdown(quantQs);

  const allCategoryBreakdown = buildCategoryBreakdown(result.questions.filter(q => getRootSubject(q) !== 'Analytical Writing (AWA)'));
  const sortedByAcc = [...allCategoryBreakdown].sort((a, b) => b.pct - a.pct);
  const topStrengths = sortedByAcc.slice(0, 2).map(c => c.catName);
  const topWeaknesses = [...sortedByAcc].sort((a, b) => a.pct - b.pct).slice(0, 2).map(c => c.catName);

  return (
    <StudentLayout>
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* TOP BACK & REPORT TITLE HEADER BAR */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f0e8f5',
          padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '24px',
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px',
          borderLeft: '4px solid #e61a8d',
        }}>
          <div>
            <Link
              href="/user-dashboard/gre-dashboard"
              className="no-print"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: '700', color: '#e61a8d', textDecoration: 'none', marginBottom: '8px' }}
            >
              ← Back to Student Dashboard
            </Link>
            <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#2d2d2d', margin: '0' }}>
              Detailed Performance Report: {result.test_title}
            </h1>
            <p style={{ fontSize: '12px', color: '#5a5a5a', fontWeight: '500', margin: '6px 0 0' }}>
              Test Date: <strong>{formatDate12H(result.completed_at)}</strong> &nbsp;•&nbsp;
              Overall Score: <strong style={{ color: '#e61a8d' }}>{overallScore} / 340</strong> (Verbal: {verbalScore}, Quant: {quantScore})
              &nbsp;•&nbsp; Raw Accuracy: <strong style={{ color: '#059669' }}>{accuracyPct}%</strong> ({correctCount}/{answeredByStudent.length} Correct)
            </p>
            <p style={{ fontSize: '10px', color: '#888', fontWeight: '600', margin: '4px 0 0', fontStyle: 'italic' }}>
              * Note: On the official ETS GRE 130–170 scale, 130 is the minimum baseline score for 0% accuracy per section (Total base: 260).
            </p>
          </div>

          {/* TOP ACTION BUTTONS (PEARL & PINK THEME) */}
          <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button
              onClick={() => window.print()}
              style={{
                backgroundColor: '#e61a8d', color: 'white', border: 'none', borderRadius: '8px',
                padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px',
                boxShadow: '0 2px 6px rgba(230,26,141,0.25)',
              }}
            >
              📥 Download PDF Report
            </button>

            <button
              onClick={scrollToExplanations}
              style={{
                backgroundColor: '#fafafa', color: '#e61a8d', border: '1px solid #fbcfe8', borderRadius: '8px',
                padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
            >
              🔄 Re-attempt Weak Questions
            </button>

            <button
              onClick={scrollToExplanations}
              style={{
                backgroundColor: '#fafafa', color: '#e61a8d', border: '1px solid #fbcfe8', borderRadius: '8px',
                padding: '9px 16px', fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}
            >
              👁️ Review Explanations
            </button>
          </div>
        </div>

        {/* OVERVIEW KPI ROW: 4 CARDS WITH SPARKLINE GRAPHS */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px', marginBottom: '24px',
        }}>
          {/* Verbal Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f0e8f5', borderLeft: '4px solid #06b6d4', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#5a5a5a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Verbal</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2d2d2d', marginTop: '4px' }}>
                {verbalScore} <span style={{ fontSize: '12px', color: '#999', fontWeight: '500' }}>/ 170</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#5a5a5a', display: 'block', marginTop: '4px' }}>
                {verbalQs.length > 0 ? `${verbalCorrect}/${verbalQs.length} correct` : 'No verbal questions'}
              </span>
            </div>
            <svg width="60" height="32" viewBox="0 0 100 40" fill="none" stroke="#06b6d4" strokeWidth="3">
              <path d="M5 30 Q 30 25, 50 15 T 95 10" strokeLinecap="round" />
            </svg>
          </div>

          {/* Quant Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f0e8f5', borderLeft: '4px solid #3b82f6', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#5a5a5a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quant</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2d2d2d', marginTop: '4px' }}>
                {quantScore} <span style={{ fontSize: '12px', color: '#999', fontWeight: '500' }}>/ 170</span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#5a5a5a', display: 'block', marginTop: '4px' }}>
                {quantQs.length > 0 ? `${quantCorrect}/${quantQs.length} correct` : 'No quant questions'}
              </span>
            </div>
            <svg width="60" height="32" viewBox="0 0 100 40" fill="none" stroke="#3b82f6" strokeWidth="3">
              <path d="M5 32 Q 40 28, 65 18 T 95 8" strokeLinecap="round" />
            </svg>
          </div>

          {/* Total Time / Answered Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f0e8f5', borderLeft: '4px solid #10b981', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#5a5a5a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Time</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#2d2d2d', marginTop: '4px' }}>
                {answeredByStudent.length}/{totalQs}
              </div>
              <span style={{ fontSize: '11px', color: '#999', fontWeight: '500', display: 'block', marginTop: '4px' }}>Questions Answered</span>
            </div>
            <svg width="60" height="32" viewBox="0 0 100 40" fill="none" stroke="#10b981" strokeWidth="3">
              <path d="M5 25 Q 35 10, 60 20 T 95 15" strokeLinecap="round" />
            </svg>
          </div>

          {/* Accuracy Card */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #f0e8f5', borderLeft: '4px solid #e61a8d', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#5a5a5a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Accuracy</span>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#e61a8d', marginTop: '4px' }}>
                {accuracyPct}%
              </div>
              <span style={{ fontSize: '11px', color: '#999', fontWeight: '500', display: 'block', marginTop: '4px' }}>Accuracy (of answered)</span>
            </div>
            <svg width="60" height="32" viewBox="0 0 100 40" fill="none" stroke="#e61a8d" strokeWidth="3">
              <path d="M5 20 Q 30 18, 60 25 T 95 15" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* SECTION-BY-SECTION BREAKDOWN */}
        <div style={{
          backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '20px 24px', marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: '800', color: '#2d2d2d', margin: '0 0 16px 0', paddingBottom: '12px', borderBottom: '1px solid #ede9e4' }}>
            Section-by-Section Breakdown
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Verbal Reasoning Column */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#2d2d2d', margin: '0 0 14px 0' }}>
                Verbal Reasoning
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                {verbalBreakdownItems.length > 0 ? verbalBreakdownItems.map(item => (
                  <div key={item.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: '#2d2d2d', marginBottom: '4px' }}>
                      <span>{item.category}</span>
                      <span style={{ fontFamily: 'monospace', color: '#5a5a5a' }}>{item.pct}% correct</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%', borderRadius: '10px', transition: 'width 0.4s ease',
                          width: `${item.pct}%`,
                          backgroundColor: item.pct >= 70 ? '#10b981' : item.pct >= 40 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                )) : <div style={{ color: '#aaa', fontStyle: 'italic' }}>No verbal questions in this test</div>}
              </div>
            </div>

            {/* Quantitative Reasoning Column */}
            <div>
              <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#2d2d2d', margin: '0 0 14px 0' }}>
                Quantitative Reasoning
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
                {quantBreakdownItems.length > 0 ? quantBreakdownItems.map(item => (
                  <div key={item.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: '#2d2d2d', marginBottom: '4px' }}>
                      <span>{item.category}</span>
                      <span style={{ fontFamily: 'monospace', color: '#5a5a5a' }}>{item.pct}% correct</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%', borderRadius: '10px', transition: 'width 0.4s ease',
                          width: `${item.pct}%`,
                          backgroundColor: item.pct >= 70 ? '#10b981' : item.pct >= 40 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                )) : <div style={{ color: '#aaa', fontStyle: 'italic' }}>No quantitative questions in this test</div>}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: CATEGORY PERFORMANCE & STRENGTH/WEAKNESS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          {/* Category Performance */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#2d2d2d', margin: '0 0 14px 0' }}>
              Category Performance (% Correct)
            </h3>
            {allCategoryBreakdown.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                {allCategoryBreakdown.map(item => (
                  <div key={item.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', color: '#2d2d2d', marginBottom: '4px' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{item.catName}</span>
                      <span style={{ fontFamily: 'monospace', color: '#5a5a5a' }}>({item.correct}/{item.total}) &nbsp; {item.pct}%</span>
                    </div>
                    <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '10px', height: '8px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%', borderRadius: '10px', transition: 'width 0.4s ease',
                          width: `${item.pct}%`,
                          backgroundColor: item.pct >= 70 ? '#10b981' : item.pct >= 40 ? '#f59e0b' : '#ef4444',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: '#aaa', fontStyle: 'italic', fontSize: '12px' }}>No category data available</div>
            )}
          </div>

          {/* Top Strength & Weakness Areas */}
          <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#2d2d2d', margin: '0 0 16px 0' }}>
              Top Strength &amp; Weakness Areas
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
              <div>
                <span style={{ fontWeight: '800', color: '#059669', display: 'block', marginBottom: '8px' }}>Strength:</span>
                {topStrengths.length > 0 ? topStrengths.map(s => (
                  <div key={s} style={{ backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', padding: '10px', borderRadius: '8px', color: '#065f46', fontWeight: '700', marginBottom: '6px' }}>
                    {s}
                  </div>
                )) : <div style={{ color: '#aaa', fontStyle: 'italic' }}>No strength data</div>}
              </div>

              <div>
                <span style={{ fontWeight: '800', color: '#e11d48', display: 'block', marginBottom: '8px' }}>Weakness:</span>
                {topWeaknesses.length > 0 ? topWeaknesses.map(w => (
                  <div key={w} style={{ backgroundColor: '#fff1f2', border: '1px solid #fecdd3', padding: '10px', borderRadius: '8px', color: '#9f1239', fontWeight: '700', marginBottom: '6px' }}>
                    {w}
                  </div>
                )) : <div style={{ color: '#aaa', fontStyle: 'italic' }}>No weakness data</div>}
              </div>
            </div>
          </div>
        </div>

        {/* QUESTION-BY-QUESTION EXPLANATIONS REVIEW SECTION */}
        <div ref={explanationsRef} style={{ paddingTop: '16px', borderTop: '1px solid #ede9e4' }}>
          
          {/* Section Filter Header */}
          <div style={{
            backgroundColor: '#e61a8d', borderRadius: '12px',
            padding: '16px 20px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(230,26,141,0.2)',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
          }}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: '900', color: '#1a1a1a', margin: 0 }}>
                Question-by-Question Solution &amp; Audit Review
              </h2>
              <p style={{ fontSize: '11px', color: '#1a1a1a', fontWeight: '600', opacity: 0.9, margin: '2px 0 0' }}>
                Filter explanations by subject or topic category.
              </p>
            </div>

            {/* Subject Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['ALL (Full Test)', 'Verbal Reasoning', 'Quantitative Reasoning', 'Analytical Writing (AWA)'].map(sub => (
                <button
                  key={sub}
                  onClick={() => { setSelectedSubject(sub); setSelectedSubCategory('ALL'); }}
                  style={{
                    padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                    cursor: 'pointer', fontFamily: 'inherit', border: 'none',
                    backgroundColor: selectedSubject === sub ? 'white' : 'rgba(255,255,255,0.2)',
                    color: selectedSubject === sub ? '#e61a8d' : 'white',
                  }}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          {/* Sub-Category Filter Dropdown */}
          {subCategoriesInSubject.length > 1 && (
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#5a5a5a', textTransform: 'uppercase' }}>Filter Topic:</span>
              <select
                value={selectedSubCategory}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
                style={{ padding: '6px 12px', border: '1px solid #ede9e4', borderRadius: '6px', fontSize: '12px', fontWeight: '600', color: '#2d2d2d', outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="ALL">All Categories ({questionsInSubject.length} Qs)</option>
                {subCategoriesInSubject.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {/* Question List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredQuestions.length === 0 ? (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', color: '#888', fontWeight: '600' }}>
                No questions found for this subject or filter.
              </div>
            ) : (
              filteredQuestions.map((q, idx) => {
                const isCorrect = q.is_correct === true;
                const optionsList = parseOptions(q.options, q.question_text || q.text, q.category);
                const studentAns = q.student_answer;
                const correctAns = q.correct_option || q.answer;

                return (
                  <div
                    key={q.id || idx}
                    style={{
                      backgroundColor: 'white', borderRadius: '12px', border: '1px solid #ede9e4',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '20px',
                      borderLeft: `4px solid ${isCorrect ? '#10b981' : '#e11d48'}`,
                    }}
                  >
                    {/* Header bar */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #f5f5f5' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: '#2d2d2d' }}>
                          Question {idx + 1}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                          {q.subject || getRootSubject(q)}
                        </span>
                        <span style={{ padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: '700', backgroundColor: '#f3f4f6', color: '#5a5a5a' }}>
                          {q.category || 'General'}
                        </span>
                      </div>

                      <span style={{
                        padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                        backgroundColor: isCorrect ? '#d1fae5' : '#fee2e2',
                        color: isCorrect ? '#065f46' : '#991b1b',
                      }}>
                        {isCorrect ? '✓ Correct' : '✕ Incorrect'}
                      </span>
                    </div>

                    {/* Question text */}
                    <p style={{ fontSize: '13px', lineHeight: '1.6', fontWeight: '600', color: '#2d2d2d', margin: '0 0 16px 0', whiteSpace: 'pre-wrap' }}>
                      {q.question_text || q.text}
                    </p>

                    {/* Question image */}
                    {(q.question_image_url || q.image_url) && (
                      <div style={{ marginBottom: '16px' }}>
                        <img
                          src={q.question_image_url || q.image_url}
                          alt={`Question ${idx + 1}`}
                          style={{ maxHeight: '240px', borderRadius: '8px', border: '1px solid #ede9e4', objectFit: 'contain' }}
                        />
                      </div>
                    )}

                    {/* Options list */}
                    {optionsList.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                        {optionsList.map((optText, optIdx) => {
                          const optionLabel = getOptionLabel(optIdx);
                          const isStudentSelected = String(studentAns) === String(optionLabel) || String(studentAns) === String(optText) || String(studentAns) === String(optIdx);
                          const isCorrectOption = String(correctAns) === String(optionLabel) || String(correctAns) === String(optText) || String(correctAns) === String(optIdx);

                          let bg = '#fafafa';
                          let border = '#ede9e4';
                          let textCol = '#2d2d2d';

                          if (isCorrectOption) {
                            bg = '#d1fae5';
                            border = '#a7f3d0';
                            textCol = '#065f46';
                          } else if (isStudentSelected && !isCorrectOption) {
                            bg = '#fee2e2';
                            border = '#fecaca';
                            textCol = '#991b1b';
                          }

                          return (
                            <div
                              key={optIdx}
                              style={{
                                padding: '10px 14px', borderRadius: '8px', border: `1px solid ${border}`,
                                backgroundColor: bg, color: textCol, fontSize: '12px', fontWeight: '600',
                                display: 'flex', alignItems: 'center', gap: '10px',
                              }}
                            >
                              <span style={{ fontWeight: '800', width: '24px' }}>({optionLabel})</span>
                              <span style={{ flex: 1 }}>{optText}</span>
                              {isCorrectOption && <span style={{ fontWeight: '800', fontSize: '11px' }}>✓ Correct Answer</span>}
                              {isStudentSelected && !isCorrectOption && <span style={{ fontWeight: '800', fontSize: '11px' }}>✕ Your Choice</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Detailed Explanation Callout (Pearl & Pink Theme) */}
                    {(q.explanation || true) && (
                      <div style={{
                        backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '8px',
                        padding: '12px 16px', color: '#374151', fontSize: '12px', lineHeight: '1.55',
                      }}>
                        <strong style={{ display: 'block', color: '#e61a8d', marginBottom: '4px', fontWeight: '800' }}>💡 Solution &amp; Explanation:</strong>
                        {q.explanation ? q.explanation : `Correct Answer: (${correctAns || '0%'}). Review this category (${q.category || 'General'}) for accuracy improvement.`}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>
    </StudentLayout>
  );
}

export default function GREResultPage() {
  return (
    <Suspense fallback={
      <StudentLayout>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div style={{ width: '40px', height: '40px', border: '4px solid #e5e7eb', borderTop: '4px solid #e61a8d', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </StudentLayout>
    }>
      <GREResultContent />
    </Suspense>
  );
}
