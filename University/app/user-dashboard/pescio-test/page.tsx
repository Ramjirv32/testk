'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/config';

interface Question {
    question_id: number;
    question: string;
    options: string[];
}

const getCategoryForQuestion = (questionId: number): string => {

    const practicalQs = [2, 4, 12, 27, 29, 34];
    const enterprisingQs = [5, 16, 19, 21, 26, 32];
    const socialQs = [7, 11, 18, 24, 30, 36];
    const creativeQs = [3, 9, 15, 23, 33, 35];
    const investigativeQs = [6, 10, 13, 14, 20, 25, 28];
    const organisationalQs = [1, 8, 17, 22, 31];

    if (practicalQs.includes(questionId)) return 'P';
    if (enterprisingQs.includes(questionId)) return 'E';
    if (socialQs.includes(questionId)) return 'S';
    if (creativeQs.includes(questionId)) return 'C';
    if (investigativeQs.includes(questionId)) return 'I';
    if (organisationalQs.includes(questionId)) return 'O';
    return '';
};

export default function PESCIOTestExam() {
    const router = useRouter();
    const { user, token, isLoading } = useAuth();
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [startTime] = useState(Date.now());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && token) {
            fetchQuestions();
        }
    }, [user, token, isLoading]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const fetchQuestions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/pescio/questions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setQuestions(data.questions);
                enterFullscreen();
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to load questions');
                router.push('/user-dashboard/pescio');
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            alert('Failed to load test. Please try again.');
            router.push('/user-dashboard/pescio');
        } finally {
            setLoading(false);
        }
    };

    const enterFullscreen = () => {
        if (containerRef.current) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error('Error entering fullscreen:', err);
            });
        }
    };

    const exitFullscreen = () => {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    };

    const handleAnswer = (questionId: number, rating: number) => {
        setAnswers({
            ...answers,
            [questionId]: rating
        });
    };

    const calculateCategoryTotals = () => {
        const totals = { P: 0, E: 0, S: 0, C: 0, I: 0, O: 0 };

        Object.entries(answers).forEach(([qId, rating]) => {
            const category = getCategoryForQuestion(parseInt(qId));
            if (category) {
                totals[category as keyof typeof totals] += (rating + 1);
            }
        });

        return totals;
    };

    const handleSubmit = async () => {
        if (Object.keys(answers).length < questions.length) {
            if (!confirm('You haven\'t answered all questions. Are you sure you want to submit?')) {
                return;
            }
        }

        setSubmitting(true);
        const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);

        const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
            question_id: parseInt(questionId),
            selected_option: selectedOption
        }));

        try {
            const response = await fetch(`${API_URL}/api/pescio/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user?.id,
                    total_time_spent: totalTimeSpent,
                    answers: answersArray
                }),
            });

            if (response.ok) {
                exitFullscreen();
                alert('Test submitted successfully!');
                router.push('/user-dashboard/pescio-result');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to submit test');
            }
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('Failed to submit test. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
                <div className="text-center">
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid #e5e7eb',
                        borderTop: '4px solid #9a3197',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <div style={{ color: '#9a3197', fontSize: '18px', fontWeight: '600' }}>Loading PESCIO Test...</div>
                </div>
                <style jsx>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (questions.length === 0) {
        return null;
    }

    const progress = (Object.keys(answers).length / questions.length) * 100;
    const categoryTotals = calculateCategoryTotals();
    const categories = ['P', 'E', 'S', 'C', 'I', 'O'];

    return (
        <div
            ref={containerRef}
            style={{
                minHeight: '100vh',
                backgroundColor: '#f3f4f6',
                padding: '20px',
                overflow: 'auto'
            }}
        >
            {}
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                marginBottom: '24px'
            }}>
                <div style={{
                    backgroundColor: 'white',
                    padding: '24px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    marginBottom: '16px'
                }}>
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#9a3197', marginBottom: '8px' }}>
                        PESCIO Interest Assessment
                    </h1>
                    <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px' }}>
                        Score each statement from 1 to 5. If you <strong>strongly disagree</strong> – score 1, if you <strong>strongly agree</strong> – score 5.
                    </p>

                    {}
                    <div style={{
                        width: '100%',
                        height: '8px',
                        backgroundColor: '#e5e7eb',
                        borderRadius: '4px',
                        overflow: 'hidden',
                        marginBottom: '8px'
                    }}>
                        <div style={{
                            width: `${progress}%`,
                            height: '100%',
                            backgroundColor: '#9a3197',
                            transition: 'width 0.3s ease'
                        }}></div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280', textAlign: 'right' }}>
                        {Object.keys(answers).length} / {questions.length} answered
                    </div>

                    {}
                    <div style={{ marginTop: '16px', textAlign: 'center' }}>
                        <button
                            onClick={() => {
                                const newAnswers: { [key: number]: number } = {};
                                let index = 0;

                                const interval = setInterval(() => {
                                    if (index < questions.length) {
                                        const q = questions[index];

                                        newAnswers[q.question_id] = Math.floor(Math.random() * 5) + 1;
                                        setAnswers({ ...newAnswers });
                                        index++;
                                    } else {
                                        clearInterval(interval);

                                        setTimeout(handleSubmit, 500);
                                    }
                                }, 30);
                            }}
                            disabled={submitting}
                            style={{
                                padding: '12px 32px',
                                borderRadius: '8px',
                                border: 'none',
                                background: submitting ? '#9ca3af' : 'linear-gradient(to right, #10b981, #22c55e)',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => {
                                if (!submitting) e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseOut={(e) => {
                                if (!submitting) e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            {submitting ? ' Submitting...' : ' Auto-Fill & Submit'}
                        </button>
                    </div>
                </div>

                {}
                <div style={{
                    backgroundColor: 'white',
                    padding: '16px',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        {categories.map(cat => (
                            <div key={cat} style={{ textAlign: 'center', minWidth: '80px' }}>
                                <div style={{ fontSize: '14px', fontWeight: '700', color: '#9a3197', marginBottom: '4px' }}>
                                    {cat}
                                </div>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    color: '#9a3197',
                                    backgroundColor: '#f3e8ff',
                                    padding: '8px 16px',
                                    borderRadius: '8px'
                                }}>
                                    {categoryTotals[cat as keyof typeof categoryTotals]}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {}
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                overflow: 'auto',
                maxHeight: 'calc(100vh - 400px)'
            }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#9a3197' }}>
                        <tr>
                            <th style={{ padding: '16px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: 'white', minWidth: '300px', position: 'sticky', left: 0, backgroundColor: '#9a3197', zIndex: 11 }}>
                                I like ...
                            </th>
                            {categories.map(cat => (
                                <th key={cat} style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'white', width: '80px' }}>
                                    {cat}
                                </th>
                            ))}
                            <th style={{ padding: '16px', textAlign: 'center', fontSize: '14px', fontWeight: '600', color: 'white', width: '80px' }}>
                                Cat
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map((q, index) => {
                            const questionCategory = getCategoryForQuestion(q.question_id);
                            return (
                                <tr
                                    key={q.question_id}
                                    style={{
                                        backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb',
                                        borderBottom: '1px solid #e5e7eb'
                                    }}
                                >
                                    <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1f2937', position: 'sticky', left: 0, backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9fafb', zIndex: 1 }}>
                                        {q.question}
                                    </td>
                                    {categories.map(cat => (
                                        <td key={cat} style={{ padding: '12px', textAlign: 'center' }}>
                                            {questionCategory === cat ? (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="5"
                                                    value={answers[q.question_id] !== undefined ? answers[q.question_id] + 1 : ''}
                                                    onChange={(e) => {
                                                        const value = parseInt(e.target.value);
                                                        if (value >= 1 && value <= 5) {
                                                            handleAnswer(q.question_id, value - 1);
                                                        } else if (e.target.value === '') {
                                                            const newAnswers = { ...answers };
                                                            delete newAnswers[q.question_id];
                                                            setAnswers(newAnswers);
                                                        }
                                                    }}
                                                    placeholder=""
                                                    style={{
                                                        width: '50px',
                                                        height: '40px',
                                                        border: answers[q.question_id] !== undefined ? '2px solid #9a3197' : '2px solid #d1d5db',
                                                        borderRadius: '6px',
                                                        textAlign: 'center',
                                                        fontSize: '16px',
                                                        fontWeight: '600',
                                                        color: '#1f2937',
                                                        backgroundColor: answers[q.question_id] !== undefined ? '#f3e8ff' : 'white',
                                                        outline: 'none',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onFocus={(e) => {
                                                        e.target.style.borderColor = '#9a3197';
                                                        e.target.style.boxShadow = '0 0 0 3px rgba(154, 49, 151, 0.1)';
                                                    }}
                                                    onBlur={(e) => {
                                                        e.target.style.boxShadow = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div style={{
                                                    width: '50px',
                                                    height: '40px',
                                                    border: '2px solid #e5e7eb',
                                                    borderRadius: '6px',
                                                    backgroundColor: '#f3f4f6',
                                                    margin: '0 auto',
                                                    cursor: 'not-allowed'
                                                }}></div>
                                            )}
                                        </td>
                                    ))}
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{
                                            display: 'inline-block',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            backgroundColor: '#f3e8ff',
                                            color: '#9a3197',
                                            fontSize: '14px',
                                            fontWeight: 'bold',
                                            lineHeight: '32px'
                                        }}>
                                            {questionCategory}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {}
            <div style={{
                maxWidth: '1400px',
                margin: '24px auto 0',
                textAlign: 'center',
                paddingBottom: '40px'
            }}>
                <button
                    onClick={handleSubmit}
                    disabled={submitting || Object.keys(answers).length < questions.length}
                    style={{
                        padding: '16px 64px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: (submitting || Object.keys(answers).length < questions.length) ? '#9ca3af' : '#10b981',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '600',
                        cursor: (submitting || Object.keys(answers).length < questions.length) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                    }}
                    onMouseOver={(e) => {
                        if (!submitting && Object.keys(answers).length === questions.length) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                        }
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    {submitting ? 'Submitting...' : Object.keys(answers).length < questions.length ? `Answer All Questions (${Object.keys(answers).length}/${questions.length})` : 'Submit Test'}
                </button>
            </div>

            {}
            {!isFullscreen && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#f59e0b',
                    color: '#78350f',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    zIndex: 1000
                }}>
                     Please stay in fullscreen mode during the test
                </div>
            )}
        </div>
    );
}
