'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { API_URL, GRE_API_URL } from '@/lib/config';
import { ChevronDown, Edit2, Trash2, Search } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  subject: string;
  category: string;
  level: string;
  options: string[];
  correct_option: string | number;
  explanation?: string;
  image_url?: string;
  question_image_url?: string;
  answer_image_url?: string;
  created_at: string;
}

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

interface QuestionStats {
  total_questions: number;
  by_subject: Record<string, number>;
  by_category: Record<string, number>;
  by_level: Record<string, number>;
}

export default function QuestionBankPage() {
  const { token, isAdmin } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterSubject, setFilterSubject] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  useEffect(() => {
    if (token && isAdmin()) {
      fetchQuestions();
      fetchStats();
    }
  }, [token, isAdmin, filterSubject, filterCategory, filterLevel]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterSubject !== 'ALL') params.append('subject', filterSubject);
      if (filterCategory !== 'ALL') params.append('category', filterCategory);
      if (filterLevel !== 'ALL') params.append('level', filterLevel);

      const res = await fetch(
        `${API_URL}/api/admin/questions?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setQuestions(data.data?.questions || data.questions || []);
      }
    } catch (err) {
      console.error('Failed to fetch questions', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/questions/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.data || data);
      }
    } catch (err) {
      console.error('Failed to fetch question stats', err);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (confirm('Are you sure you want to delete this question?')) {
      try {
        const res = await fetch(`${API_URL}/api/admin/questions/${questionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.ok) {
          setQuestions(questions.filter((q) => q.id !== questionId));
          setEditingId(null);
        }
      } catch (err) {
        console.error('Failed to delete question', err);
      }
    }
  };

  const filteredQuestions = questions.filter((q) =>
    !searchTerm || q.question_text.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div style={{ padding: '24px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#2d2d2d', margin: 0 }}>Question Bank Management</h1>
          <p style={{ color: '#6c757d', fontSize: '14px', margin: '4px 0 0' }}>Manage, edit, and organize all test questions</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#fde8f5', padding: '16px', borderRadius: '12px', border: '1px solid #f0c4dd' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#e61a8d', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Total Questions</p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#9d174d', margin: '4px 0 0' }}>{stats.total_questions}</h3>
            </div>
            <div style={{ backgroundColor: '#f3e8ff', padding: '16px', borderRadius: '12px', border: '1px solid #e9d5ff' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Subjects</p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#5b21b6', margin: '4px 0 0' }}>{Object.keys(stats.by_subject).length}</h3>
            </div>
            <div style={{ backgroundColor: '#d1fae5', padding: '16px', borderRadius: '12px', border: '1px solid #a7f3d0' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Categories</p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#065f46', margin: '4px 0 0' }}>{Object.keys(stats.by_category).length}</h3>
            </div>
            <div style={{ backgroundColor: '#fef3c7', padding: '16px', borderRadius: '12px', border: '1px solid #fde68a' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>Difficulty Levels</p>
              <h3 style={{ fontSize: '28px', fontWeight: 800, color: '#92400e', margin: '4px 0 0' }}>{Object.keys(stats.by_level).length}</h3>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6c757d', marginBottom: '6px', textTransform: 'uppercase' }}>Search</label>
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '13px', outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6c757d', marginBottom: '6px', textTransform: 'uppercase' }}>Subject</label>
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white', outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="ALL">All Subjects</option>
                {stats && Object.keys(stats.by_subject).map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6c757d', marginBottom: '6px', textTransform: 'uppercase' }}>Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white', outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="ALL">All Categories</option>
                {stats && Object.keys(stats.by_category).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#6c757d', marginBottom: '6px', textTransform: 'uppercase' }}>Level</label>
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '13px', backgroundColor: 'white', outline: 'none', fontFamily: 'inherit' }}
              >
                <option value="ALL">All Levels</option>
                {stats && Object.keys(stats.by_level).map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '48px', color: '#999' }}>Loading questions...</div>
          ) : filteredQuestions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#faf4ec', borderRadius: '12px', color: '#6c757d' }}>No questions found</div>
          ) : (
            filteredQuestions.map((question) => (
              <div
                key={question.id}
                style={{ backgroundColor: 'white', border: '1px solid #ede9e4', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                <div
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
                  onClick={() => setExpandedId(expandedId === question.id ? null : question.id)}
                >
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: '#2d2d2d', marginBottom: '8px', fontSize: '13px' }}>
                      {question.question_text.substring(0, 100)}...
                    </p>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <span style={{ padding: '3px 10px', backgroundColor: '#fde8f5', color: '#e61a8d', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{question.subject}</span>
                      <span style={{ padding: '3px 10px', backgroundColor: '#f3e8ff', color: '#7c3aed', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{question.category}</span>
                      <span style={{ padding: '3px 10px', backgroundColor: '#fef3c7', color: '#d97706', borderRadius: '6px', fontSize: '11px', fontWeight: 700 }}>{question.level}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '16px', alignItems: 'center' }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingId(question.id); }}
                      style={{ padding: '6px', color: '#6c757d', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(question.id); }}
                      style={{ padding: '6px', color: '#6c757d', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px' }}
                    >
                      <Trash2 size={16} />
                    </button>
                    <ChevronDown
                      size={18}
                      style={{ color: '#999', transition: 'transform 0.2s', transform: expandedId === question.id ? 'rotate(180deg)' : 'none' }}
                    />
                  </div>
                </div>

                {expandedId === question.id && (
                  <div style={{ borderTop: '1px solid #ede9e4', padding: '20px', backgroundColor: '#faf4ec' }}>
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontWeight: 700, color: '#2d2d2d', marginBottom: '8px', fontSize: '13px' }}>Full Question</h4>
                      <p style={{ fontSize: '13px', color: '#5a5a5a', whiteSpace: 'pre-wrap' }}>{question.question_text}</p>
                    </div>

                    {(question.question_image_url || question.image_url) && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontWeight: 700, color: '#2d2d2d', marginBottom: '8px', fontSize: '13px' }}>Question Image</h4>
                        <img
                          src={getFormattedImgUrl(question.question_image_url || question.image_url)}
                          alt="Question Image"
                          style={{ maxWidth: '450px', maxHeight: '320px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ede9e4', backgroundColor: 'white', display: 'block' }}
                        />
                      </div>
                    )}

                    {question.answer_image_url && (
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ fontWeight: 700, color: '#2d2d2d', marginBottom: '8px', fontSize: '13px' }}>Answer Image</h4>
                        <img
                          src={getFormattedImgUrl(question.answer_image_url)}
                          alt="Answer Image"
                          style={{ maxWidth: '450px', maxHeight: '320px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #ede9e4', backgroundColor: 'white', display: 'block' }}
                        />
                      </div>
                    )}

                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ fontWeight: 700, color: '#2d2d2d', marginBottom: '8px', fontSize: '13px' }}>Options</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {question.options?.map((option, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
                              backgroundColor: idx === question.correct_option || String(idx) === String(question.correct_option) ? '#d1fae5' : '#f5f5f5',
                              color: idx === question.correct_option || String(idx) === String(question.correct_option) ? '#065f46' : '#2d2d2d',
                              border: idx === question.correct_option || String(idx) === String(question.correct_option) ? '1px solid #a7f3d0' : '1px solid #ede9e4',
                            }}
                          >
                            {String.fromCharCode(65 + idx)}) {option}
                          </div>
                        ))}
                      </div>
                    </div>

                    {question.explanation && (
                      <div style={{ padding: '12px 16px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ede9e4' }}>
                        <h4 style={{ fontWeight: 700, color: '#2d2d2d', marginBottom: '6px', fontSize: '13px' }}>Explanation</h4>
                        <p style={{ fontSize: '13px', color: '#5a5a5a' }}>{question.explanation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
