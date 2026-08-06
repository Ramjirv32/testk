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

export default function PsychometricTestExam() {
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
            const response = await fetch(`${API_URL}/api/psychometric/questions`, {
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
                router.push('/user-dashboard/psychometric');
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            alert('Failed to load test. Please try again.');
            router.push('/user-dashboard/psychometric');
        } finally {
            setLoading(false);
        }
    };

    const enterFullscreen = () => {
        if (containerRef.current) {
            containerRef.current.requestFullscreen().catch(err => {
                console.log('Could not enter fullscreen:', err);
            });
        }
    };

    const handleAnswerChange = (questionId: number, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        const answeredCount = Object.keys(answers).length;
        if (answeredCount < questions.length) {
            alert(`Please answer all questions. You have answered ${answeredCount}/${questions.length} questions.`);
            return;
        }

        if (!confirm('Are you sure you want to submit your test? You cannot change your answers after submission.')) {
            return;
        }

        setSubmitting(true);

        try {
            const totalTimeSpent = Math.floor((Date.now() - startTime) / 1000);

            const answersArray = Object.entries(answers).map(([questionId, selectedOption]) => ({
                question_id: parseInt(questionId),
                selected_option: selectedOption
            }));

            const response = await fetch(`${API_URL}/api/psychometric/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user?.id,
                    total_time_spent: totalTimeSpent,
                    answers: answersArray,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                if (document.fullscreenElement) {
                    await document.exitFullscreen();
                }
                alert('Test submitted successfully!');
                router.push('/user-dashboard/psychometric-result');
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to submit test');
            }
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('An error occurred while submitting the test');
        } finally {
            setSubmitting(false);
        }
    };

    const getAnsweredCount = () => Object.keys(answers).length;

    if (isLoading || loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f9fafb'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid #e5e7eb',
                        borderTop: '4px solid #9a3197',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <p style={{ color: '#6b7280' }}>Loading test...</p>
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

    return (
        <div ref={containerRef} style={{
            minHeight: '100vh',
            height: isFullscreen ? '100vh' : 'auto',
            backgroundColor: '#f3f4f6',
            padding: '20px',
            overflow: 'auto',
            position: isFullscreen ? 'fixed' : 'relative',
            top: 0,
            left: 0,
            right: 0,
            width: '100%'
        }}>
            {}
            <div style={{
                maxWidth: '1000px',
                margin: '0 auto 24px',
                backgroundColor: 'white',
                borderRadius: '12px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: '#9a3197',
                            marginBottom: '8px'
                        }}>
                            Psychometric Assessment Test
                        </h1>
                        <p style={{ color: '#6b7280', fontSize: '14px' }}>
                            Answer all {questions.length} questions honestly. There are no right or wrong answers.
                        </p>
                    </div>
                    <div style={{
                        textAlign: 'center',
                        padding: '12px 24px',
                        backgroundColor: '#f3e8ff',
                        borderRadius: '8px'
                    }}>
                        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#9a3197' }}>
                            {getAnsweredCount()}/{questions.length}
                        </div>
                        <div style={{ fontSize: '12px', color: '#7c3aed' }}>answered</div>
                    </div>
                </div>

                {}
                {!isFullscreen && (
                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        backgroundColor: '#fef3c7',
                        borderLeft: '4px solid #f59e0b',
                        borderRadius: '4px'
                    }}>
                        <p style={{ fontSize: '14px', color: '#92400e', margin: 0 }}>
                             Please stay in fullscreen mode during the test
                        </p>
                    </div>
                )}

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
                            }, 50);
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
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '32px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    {questions.map((q, index) => (
                        <div key={q.question_id} style={{
                            marginBottom: index < questions.length - 1 ? '32px' : 0,
                            paddingBottom: index < questions.length - 1 ? '32px' : 0,
                            borderBottom: index < questions.length - 1 ? '1px solid #e5e7eb' : 'none'
                        }}>
                            <div style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: '#1f2937',
                                marginBottom: '16px'
                            }}>
                                {index + 1}. {q.question}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {q.options.map((option, optIndex) => (
                                    <label
                                        key={optIndex}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            border: `2px solid ${answers[q.question_id] === optIndex + 1 ? '#9a3197' : '#e5e7eb'}`,
                                            borderRadius: '8px',
                                            backgroundColor: answers[q.question_id] === optIndex + 1 ? '#f3e8ff' : 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseOver={(e) => {
                                            if (answers[q.question_id] !== optIndex + 1) {
                                                e.currentTarget.style.borderColor = '#d1d5db';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (answers[q.question_id] !== optIndex + 1) {
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                            }
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${q.question_id}`}
                                            checked={answers[q.question_id] === optIndex + 1}
                                            onChange={() => handleAnswerChange(q.question_id, optIndex + 1)}
                                            style={{
                                                marginRight: '12px',
                                                width: '18px',
                                                height: '18px',
                                                accentColor: '#9a3197'
                                            }}
                                        />
                                        <span style={{
                                            fontSize: '15px',
                                            color: answers[q.question_id] === optIndex + 1 ? '#9a3197' : '#4b5563'
                                        }}>
                                            <strong style={{ marginRight: '8px' }}>{String.fromCharCode(65 + optIndex)}.</strong>
                                            {option}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    {}
                    <div style={{
                        marginTop: '32px',
                        paddingTop: '24px',
                        borderTop: '2px solid #e5e7eb',
                        textAlign: 'center'
                    }}>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || getAnsweredCount() < questions.length}
                            style={{
                                backgroundColor: getAnsweredCount() === questions.length ? '#9a3197' : '#9ca3af',
                                color: 'white',
                                padding: '14px 48px',
                                borderRadius: '8px',
                                border: 'none',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: getAnsweredCount() === questions.length ? 'pointer' : 'not-allowed',
                                transition: 'transform 0.2s',
                            }}
                            onMouseOver={(e) => {
                                if (getAnsweredCount() === questions.length) {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            {submitting ? 'Submitting...' : `Submit Test (${getAnsweredCount()}/${questions.length})`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
