'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/config';
import { getMBTIDescription } from '@/lib/mbtiDescriptions';

interface Question {
    question_id: number;
    question: string;
    options: string[];
}

interface TestData {
    test_type: string;
    age: number;
    questions: Question[];
}

interface QuestionInteraction {
    is_bookmarked: boolean;
    marked_for_review: boolean;
    confidence_level: 'confident' | 'unsure' | 'guess' | '';
    note: string;
    time_spent: number;
    answer_changes: number;
    hint_used: boolean;
}

export default function TakeTest() {
    const router = useRouter();
    const { user, token, isLoading } = useAuth();
    const [testData, setTestData] = useState<TestData | null>(null);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [interactions, setInteractions] = useState<{ [key: number]: QuestionInteraction }>({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [testCompleted, setTestCompleted] = useState(false);
    const [testResult, setTestResult] = useState<any>(null);
    const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');
    const [showHint, setShowHint] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [timeSpent, setTimeSpent] = useState(0);
    const [questionStartTime, setQuestionStartTime] = useState(Date.now());
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
        if (testData && !testCompleted) {

            const elem = document.documentElement;
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => {
                    console.log('Fullscreen request failed:', err);
                });
            }
        }

        return () => {
            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.log('Exit fullscreen failed:', err);
                });
            }
        };
    }, [testData, testCompleted]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (testData && !testCompleted && Object.keys(answers).length > 0) {
                e.preventDefault();
                e.returnValue = 'You have unsaved test progress. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [testData, testCompleted, answers]);

    useEffect(() => {
        if (testData && !testCompleted) {
            const progressData = {
                answers,
                interactions,
                currentQuestion,
                timeSpent,
                testType: testData.test_type,
                timestamp: Date.now()
            };
            localStorage.setItem('mbti_test_progress', JSON.stringify(progressData));
        }
    }, [answers, interactions, currentQuestion, timeSpent, testData, testCompleted]);

    useEffect(() => {
        if (testData && !testCompleted) {
            const savedProgress = localStorage.getItem('mbti_test_progress');
            if (savedProgress) {
                try {
                    const progress = JSON.parse(savedProgress);

                    const hoursSinceLastSave = (Date.now() - progress.timestamp) / (1000 * 60 * 60);
                    if (progress.testType === testData.test_type && hoursSinceLastSave < 24) {
                        setAnswers(progress.answers || {});
                        setInteractions(progress.interactions || {});
                        setCurrentQuestion(progress.currentQuestion || 0);
                        setTimeSpent(progress.timeSpent || 0);
                    }
                } catch (error) {
                    console.error('Error restoring progress:', error);
                }
            }
        }
    }, [testData]);

    useEffect(() => {
        if (testCompleted) {
            localStorage.removeItem('mbti_test_progress');
        }
    }, [testCompleted]);

    useEffect(() => {
        if (testCompleted && testResult) {

            if (document.fullscreenElement) {
                document.exitFullscreen().catch(err => {
                    console.log('Exit fullscreen failed:', err);
                });
            }
            

            const redirectTimer = setTimeout(() => {
                router.push('/user-dashboard');
            }, 3000);
            
            return () => clearTimeout(redirectTimer);
        }
    }, [testCompleted, testResult, router]);

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (testCompleted || !testData) return;

            const question = testData.questions[currentQuestion];

            if (e.key === 'ArrowRight' && currentQuestion < testData.questions.length - 1) {
                handleNext();
            } else if (e.key === 'ArrowLeft' && currentQuestion > 0) {
                handlePrevious();
            }

            else if (e.key >= '1' && e.key <= '2') {
                const optionIndex = parseInt(e.key) - 1;
                if (optionIndex < question.options.length) {
                    handleAnswer(question.question_id, optionIndex);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [testData, currentQuestion, testCompleted]);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setTimeSpent(prev => prev + 1);
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        setQuestionStartTime(Date.now());
    }, [currentQuestion]);

    const fetchQuestions = async () => {
        try {
            const response = await fetch(`${API_URL}/api/test/questions`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTestData(data);

                const initialInteractions: { [key: number]: QuestionInteraction } = {};
                data.questions.forEach((q: Question) => {
                    initialInteractions[q.question_id] = {
                        is_bookmarked: false,
                        marked_for_review: false,
                        confidence_level: '',
                        note: '',
                        time_spent: 0,
                        answer_changes: 0,
                        hint_used: false
                    };
                });
                setInteractions(initialInteractions);

                const autoAnswers: { [key: number]: number } = {};
                data.questions.forEach((q: Question) => {
                    autoAnswers[q.question_id] = 0;
                });
                setAnswers(autoAnswers);
                console.log(' Auto-answered all questions for testing');
            } else {
                const errorData = await response.json();
                if (errorData.error === 'Test already completed') {
                    router.push('/user-dashboard');
                } else {
                    router.push('/user-dashboard');
                }
            }
        } catch (error) {
            console.error('Error fetching questions:', error);
            router.push('/user-dashboard');
        } finally {
            setLoading(false);
        }
    };

    const updateQuestionTime = () => {
        const timeOnQuestion = Math.floor((Date.now() - questionStartTime) / 1000);
        const qId = testData?.questions[currentQuestion].question_id;
        if (qId) {
            setInteractions(prev => ({
                ...prev,
                [qId]: {
                    ...prev[qId],
                    time_spent: (prev[qId]?.time_spent || 0) + timeOnQuestion
                }
            }));
        }
    };

    const handleAnswer = (questionId: number, optionIndex: number) => {
        const previousAnswer = answers[questionId];
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));

        if (previousAnswer !== undefined && previousAnswer !== optionIndex) {
            setInteractions(prev => ({
                ...prev,
                [questionId]: {
                    ...prev[questionId],
                    answer_changes: (prev[questionId]?.answer_changes || 0) + 1
                }
            }));
        }
    };

    const toggleBookmark = (questionId: number) => {
        setInteractions(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                is_bookmarked: !prev[questionId]?.is_bookmarked
            }
        }));
    };

    const toggleReview = (questionId: number) => {
        setInteractions(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                marked_for_review: !prev[questionId]?.marked_for_review
            }
        }));
    };

    const setConfidence = (questionId: number, level: 'confident' | 'unsure' | 'guess') => {
        setInteractions(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                confidence_level: prev[questionId]?.confidence_level === level ? '' : level
            }
        }));
    };

    const saveNote = (questionId: number, note: string) => {
        setInteractions(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                note
            }
        }));
        setShowNoteModal(false);
    };

    const useHint = (questionId: number) => {
        setInteractions(prev => ({
            ...prev,
            [questionId]: {
                ...prev[questionId],
                hint_used: true
            }
        }));
        setShowHint(true);
    };

    const handleNext = () => {
        updateQuestionTime();
        if (currentQuestion < (testData?.questions.length || 0) - 1) {
            setCurrentQuestion(prev => prev + 1);
            setShowHint(false);
        }
    };

    const handlePrevious = () => {
        updateQuestionTime();
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
            setShowHint(false);
        }
    };

    const handleSubmit = async () => {
        updateQuestionTime();
        const totalQuestions = testData?.questions.length || 0;
        const answeredQuestions = Object.keys(answers).length;

        if (answeredQuestions < totalQuestions) {
            if (!confirm(`You have answered ${answeredQuestions} out of ${totalQuestions} questions. Submit anyway?`)) {
                return;
            }
        }

        setSubmitting(true);

        try {
            const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
                question_id: parseInt(questionId),
                selected_option: selectedOption
            }));

            const response = await fetch(`${API_URL}/api/test/submit`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user?.id,
                    test_type: testData?.test_type,
                    answers: formattedAnswers,
                    question_interactions: interactions,
                    total_time_spent: timeSpent
                }),
            });

            if (response.ok) {
                const result = await response.json();
                setTestResult(result);
                setTestCompleted(true);

            } else {
                const error = await response.json();
                alert(`Failed to submit test: ${error.error}`);
            }
        } catch (error) {
            console.error('Error submitting test:', error);
            alert('Error submitting test');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf4ec' }}>
                <div style={{ color: '#9a3197', fontSize: '20px', fontWeight: '600' }}>Loading test...</div>
            </div>
        );
    }

    if (testCompleted && testResult) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf4ec' }}>
                <div style={{
                    maxWidth: '600px',
                    width: '100%',
                    textAlign: 'center',
                    animation: 'fadeIn 0.5s ease-out'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '48px 32px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)'
                    }}>
                        {}
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            backgroundColor: testResult.percentage >= 50 ? '#d1fae5' : '#fee2e2',
                            margin: '0 auto 24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'scaleIn 0.5s ease-out 0.2s both'
                        }}>
                            <svg style={{
                                width: '48px',
                                height: '48px',
                                color: testResult.percentage >= 50 ? '#10b981' : '#ef4444'
                            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {testResult.percentage >= 50 ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                )}
                            </svg>
                        </div>

                        <h1 style={{
                            fontSize: '32px',
                            fontWeight: 'bold',
                            color: '#1f2937',
                            marginBottom: '16px',
                            animation: 'fadeIn 0.5s ease-out 0.3s both'
                        }}>
                            Test Completed!
                        </h1>

                        <p style={{
                            fontSize: '16px',
                            color: '#6b7280',
                            marginBottom: '32px',
                            animation: 'fadeIn 0.5s ease-out 0.4s both'
                        }}>
                            {testData?.test_type === 'mvti'
                                ? 'Your personality profile has been generated!'
                                : testResult.percentage >= 50
                                    ? 'Great job! You passed the test.'
                                    : 'Test completed. Keep practicing!'}
                        </p>

                        {}
                        <div style={{
                            backgroundColor: '#f9fafb',
                            borderRadius: '12px',
                            padding: '32px',
                            marginBottom: '24px',
                            animation: 'fadeIn 0.5s ease-out 0.5s both'
                        }}>
                            {testData?.test_type === 'mvti' && testResult.result?.mbti_type ? (
                                <>
                                    <div style={{ fontSize: '80px', marginBottom: '16px' }}>
                                        {getMBTIDescription(testResult.result.mbti_type).icon}
                                    </div>
                                    <div style={{ fontSize: '16px', color: '#6b7280', marginBottom: '12px' }}>
                                        Your MBTI Personality Type
                                    </div>
                                    <div style={{ fontSize: '72px', fontWeight: 'bold', color: '#9a3197', marginBottom: '8px', letterSpacing: '4px' }}>
                                        {testResult.result.mbti_type}
                                    </div>
                                    <div style={{ fontSize: '20px', fontWeight: '600', color: '#581c87', marginBottom: '16px' }}>
                                        {getMBTIDescription(testResult.result.mbti_type).title}
                                    </div>
                                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                                        {testResult.total_score} out of {testResult.max_score} questions answered
                                    </div>
                                    <div style={{ fontSize: '13px', color: '#9ca3af', marginTop: '16px', padding: '12px', backgroundColor: '#ede4d3', borderRadius: '8px' }}>
                                        <strong>What does this mean?</strong><br />
                                        E/I: Extraversion vs Introversion<br />
                                        S/N: Sensing vs Intuition<br />
                                        T/F: Thinking vs Feeling<br />
                                        J/P: Judging vs Perceiving
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#9a3197', marginBottom: '8px' }}>
                                        {testResult.percentage.toFixed(1)}%
                                    </div>
                                    <div style={{ fontSize: '18px', color: '#6b7280', marginBottom: '16px' }}>
                                        {testResult.total_score} out of {testResult.max_score} correct
                                    </div>
                                </>
                            )}
                            <div style={{ fontSize: '14px', color: '#9ca3af', marginTop: '12px' }}>
                                Redirecting to dashboard...
                            </div>
                        </div>

                        {}
                        <div style={{
                            width: '40px',
                            height: '40px',
                            border: '4px solid #e5e7eb',
                            borderTop: '4px solid #9a3197',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto'
                        }}></div>
                    </div>
                </div>
                <style jsx>{`
                    @keyframes fadeIn {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes scaleIn {
                        from { transform: scale(0); }
                        to { transform: scale(1); }
                    }
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    if (!testData) {
        return null;
    }

    const question = testData.questions[currentQuestion];
    const progress = ((currentQuestion + 1) / testData.questions.length) * 100;
    const testTypeName = testData.test_type === 'mvti' ? 'MBTI Test' : 'Cognitive Test';
    const currentInteraction = interactions[question.question_id] || {};

    const fontSizes = {
        small: { question: '16px', option: '14px' },
        medium: { question: '18px', option: '15px' },
        large: { question: '20px', option: '17px' }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#faf4ec', padding: '20px' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {}
                <div style={{
                    background: 'linear-gradient(135deg, #9a3197 0%, #E084CD 100%)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '16px',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    position: 'sticky',
                    top: '20px',
                    zIndex: 10
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                                {testTypeName}
                            </h1>
                            <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '13px', marginTop: '4px' }}>
                                Question {currentQuestion + 1} / {testData.questions.length}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {}
                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '6px',
                                padding: '8px 16px',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                <svg style={{ width: '16px', height: '16px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span style={{ color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                                    {formatTime(timeSpent)}
                                </span>
                            </div>
                            {}
                            <div style={{ display: 'flex', gap: '4px' }}>
                                {(['small', 'medium', 'large'] as const).map(size => (
                                    <button
                                        key={size}
                                        onClick={() => setFontSize(size)}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '4px',
                                            border: 'none',
                                            backgroundColor: fontSize === size ? 'white' : 'rgba(255, 255, 255, 0.2)',
                                            color: fontSize === size ? '#9a3197' : 'white',
                                            fontSize: '11px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            textTransform: 'uppercase'
                                        }}
                                    >
                                        {size[0]}
                                    </button>
                                ))}
                            </div>
                            {}
                            <button
                                onClick={() => {
                                    const newAnswers: { [key: number]: number } = {};
                                    let index = 0;

                                    const interval = setInterval(() => {
                                        if (index < testData.questions.length) {
                                            const q = testData.questions[index];

                                            newAnswers[q.question_id] = Math.random() < 0.5 ? 0 : 1;
                                            setAnswers({ ...newAnswers });
                                            setCurrentQuestion(index);
                                            index++;
                                        } else {
                                            clearInterval(interval);

                                            setTimeout(handleSubmit, 500);
                                        }
                                    }, 40);
                                }}
                                disabled={submitting}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '6px',
                                    border: 'none',
                                    background: submitting ? '#9ca3af' : 'linear-gradient(to right, #10b981, #22c55e)',
                                    color: 'white',
                                    fontSize: '13px',
                                    fontWeight: 'bold',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.4)'
                                }}
                            >
                                {submitting ? ' Submitting...' : ' Auto-Fill & Submit'}
                            </button>
                        </div>
                    </div>

                    {}
                    <div style={{
                        width: '100%',
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: '10px',
                        height: '8px',
                        overflow: 'hidden'
                    }}>
                        <div
                            style={{
                                background: 'linear-gradient(to right, #10b981, #22c55e)',
                                height: '100%',
                                transition: 'width 0.3s ease-out',
                                width: `${progress}%`
                            }}
                        />
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'rgba(255, 255, 255, 0.9)' }}>
                        <span>{Object.keys(answers).length} answered</span>
                        <span>{Object.values(interactions).filter(i => i.marked_for_review).length} for review</span>
                        <span>{Object.values(interactions).filter(i => i.is_bookmarked).length} bookmarked</span>
                    </div>
                    <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        display: 'flex',
                        gap: '16px',
                        flexWrap: 'wrap'
                    }}>
                        <span> Shortcuts:</span>
                        <span>← → Navigate</span>
                        <span>1-2 Select Answer</span>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '16px' }}>
                    {}
                    <div>
                        {}
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            padding: '24px',
                            marginBottom: '16px'
                        }}>
                            {}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', fontWeight: '600', color: '#9a3197', marginBottom: '8px' }}>
                                        Question {question.question_id}
                                    </div>
                                    <h2 style={{
                                        fontSize: fontSizes[fontSize].question,
                                        fontWeight: 'bold',
                                        color: '#1f2937',
                                        lineHeight: '1.6',
                                        margin: 0
                                    }}>
                                        {question.question}
                                    </h2>
                                </div>

                                {}
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    <button
                                        onClick={() => toggleBookmark(question.question_id)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            backgroundColor: currentInteraction.is_bookmarked ? '#fef3c7' : '#f3f4f6',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        title="Bookmark"
                                    >
                                        <svg style={{ width: '18px', height: '18px', color: currentInteraction.is_bookmarked ? '#f59e0b' : '#6b7280' }} fill={currentInteraction.is_bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => toggleReview(question.question_id)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            backgroundColor: currentInteraction.marked_for_review ? '#fef3c7' : '#f3f4f6',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        title="Mark for Review"
                                    >
                                        <svg style={{ width: '18px', height: '18px', color: currentInteraction.marked_for_review ? '#f59e0b' : '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setShowNoteModal(true)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            backgroundColor: currentInteraction.note ? '#e9d5ff' : '#f3f4f6',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        title="Add Note"
                                    >
                                        <svg style={{ width: '18px', height: '18px', color: currentInteraction.note ? '#9a3197' : '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => useHint(question.question_id)}
                                        disabled={currentInteraction.hint_used}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            backgroundColor: currentInteraction.hint_used ? '#d1fae5' : '#f3f4f6',
                                            cursor: currentInteraction.hint_used ? 'not-allowed' : 'pointer',
                                            opacity: currentInteraction.hint_used ? 0.6 : 1,
                                            transition: 'all 0.2s'
                                        }}
                                        title="Show Hint"
                                    >
                                        <svg style={{ width: '18px', height: '18px', color: currentInteraction.hint_used ? '#10b981' : '#6b7280' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setShowFlagModal(true)}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '6px',
                                            border: 'none',
                                            backgroundColor: '#f3f4f6',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        title="Flag Issue"
                                    >
                                        <svg style={{ width: '18px', height: '18px', color: '#ef4444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {}
                            {showHint && currentInteraction.hint_used && (
                                <div style={{
                                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                                    borderLeft: '3px solid #f59e0b',
                                    padding: '12px 16px',
                                    borderRadius: '6px',
                                    marginBottom: '16px',
                                    fontSize: '14px',
                                    color: '#92400e'
                                }}>
                                    <strong> Hint:</strong> Focus on the key terms in the question and eliminate obviously incorrect options first.
                                </div>
                            )}

                            {}
                            {currentInteraction.note && (
                                <div style={{
                                    background: 'linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%)',
                                    borderLeft: '3px solid #9a3197',
                                    padding: '12px 16px',
                                    borderRadius: '6px',
                                    marginBottom: '16px',
                                    fontSize: '13px',
                                    color: '#581c87'
                                }}>
                                    <strong> Your Note:</strong> {currentInteraction.note}
                                </div>
                            )}

                            {}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {question.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswer(question.question_id, index)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '14px 16px',
                                            borderRadius: '8px',
                                            border: answers[question.question_id] === index ? '2px solid #9a3197' : '2px solid #e5e7eb',
                                            backgroundColor: answers[question.question_id] === index ? '#f3e8ff' : 'white',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            transform: answers[question.question_id] === index ? 'scale(1.01)' : 'scale(1)',
                                            boxShadow: answers[question.question_id] === index ? '0 2px 6px rgba(154, 49, 151, 0.2)' : 'none'
                                        }}
                                        onMouseOver={(e) => {
                                            if (answers[question.question_id] !== index) {
                                                e.currentTarget.style.borderColor = '#d1d5db';
                                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                            }
                                        }}
                                        onMouseOut={(e) => {
                                            if (answers[question.question_id] !== index) {
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                e.currentTarget.style.backgroundColor = 'white';
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                border: `2px solid ${answers[question.question_id] === index ? '#9a3197' : '#d1d5db'}`,
                                                backgroundColor: answers[question.question_id] === index ? '#9a3197' : 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginRight: '12px',
                                                flexShrink: 0
                                            }}>
                                                {answers[question.question_id] === index && (
                                                    <svg style={{ width: '12px', height: '12px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span style={{
                                                fontSize: fontSizes[fontSize].option,
                                                color: answers[question.question_id] === index ? '#6d28d9' : '#374151',
                                                fontWeight: answers[question.question_id] === index ? '600' : '400',
                                                lineHeight: '1.5'
                                            }}>
                                                {option}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {}
                            {answers[question.question_id] !== undefined && (
                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '10px' }}>
                                        How confident are you with this answer?
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        {[
                                            { level: 'confident' as const, label: ' Confident', color: '#10b981' },
                                            { level: 'unsure' as const, label: ' Unsure', color: '#f59e0b' },
                                            { level: 'guess' as const, label: ' Guess', color: '#ef4444' }
                                        ].map(({ level, label, color }) => (
                                            <button
                                                key={level}
                                                onClick={() => setConfidence(question.question_id, level)}
                                                style={{
                                                    padding: '8px 16px',
                                                    borderRadius: '6px',
                                                    border: `2px solid ${currentInteraction.confidence_level === level ? color : '#e5e7eb'}`,
                                                    backgroundColor: currentInteraction.confidence_level === level ? `${color}20` : 'white',
                                                    color: currentInteraction.confidence_level === level ? color : '#6b7280',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button
                                onClick={handlePrevious}
                                disabled={currentQuestion === 0}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '50px',
                                    fontWeight: '600',
                                    fontSize: '14px',
                                    border: 'none',
                                    cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
                                    backgroundColor: currentQuestion === 0 ? '#e5e7eb' : 'white',
                                    color: currentQuestion === 0 ? '#9ca3af' : '#9a3197',
                                    boxShadow: currentQuestion === 0 ? 'none' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                ← Previous
                            </button>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                {currentQuestion < testData.questions.length - 1 ? (
                                    <button
                                        onClick={handleNext}
                                        style={{
                                            padding: '10px 24px',
                                            background: 'linear-gradient(to right, #9a3197, #E084CD)',
                                            color: 'white',
                                            borderRadius: '50px',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 4px rgba(154, 49, 151, 0.3)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        Next →
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting}
                                        style={{
                                            padding: '10px 32px',
                                            background: submitting ? '#9ca3af' : 'linear-gradient(to right, #10b981, #22c55e)',
                                            color: 'white',
                                            borderRadius: '50px',
                                            fontWeight: 'bold',
                                            fontSize: '15px',
                                            border: 'none',
                                            cursor: submitting ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
                                            transition: 'all 0.3s ease'
                                        }}
                                        onMouseOver={(e) => !submitting && (e.currentTarget.style.transform = 'scale(1.05)')}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Test'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {}
                    <div>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '16px',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            position: 'sticky',
                            top: '150px'
                        }}>
                            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', marginBottom: '12px' }}>
                                Question Navigator
                            </h3>

                            {}
                            <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '12px', lineHeight: '1.6' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#10b981' }}></div>
                                    <span>Answered</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#f59e0b' }}></div>
                                    <span>For Review</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#9a3197' }}></div>
                                    <span>Current</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '12px', height: '12px', borderRadius: '3px', backgroundColor: '#e5e7eb' }}></div>
                                    <span>Not Visited</span>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                gap: '6px',
                                maxHeight: '400px',
                                overflowY: 'auto'
                            }}>
                                {testData.questions.map((q, index) => {
                                    const interaction = interactions[q.question_id];
                                    const isAnswered = answers[q.question_id] !== undefined;
                                    const isReview = interaction?.marked_for_review;
                                    const isBookmarked = interaction?.is_bookmarked;
                                    const isCurrent = index === currentQuestion;

                                    let bgColor = '#e5e7eb';
                                    if (isCurrent) bgColor = '#9a3197';
                                    else if (isReview) bgColor = '#f59e0b';
                                    else if (isAnswered) bgColor = '#10b981';

                                    return (
                                        <button
                                            key={q.question_id}
                                            onClick={() => {
                                                updateQuestionTime();
                                                setCurrentQuestion(index);
                                                setShowHint(false);
                                            }}
                                            style={{
                                                width: '100%',
                                                aspectRatio: '1',
                                                borderRadius: '6px',
                                                fontWeight: '600',
                                                fontSize: '12px',
                                                border: 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                backgroundColor: bgColor,
                                                color: 'white',
                                                position: 'relative',
                                                boxShadow: isCurrent ? '0 0 0 2px #E084CD' : 'none'
                                            }}
                                            onMouseOver={(e) => {
                                                if (!isCurrent) {
                                                    e.currentTarget.style.transform = 'scale(1.1)';
                                                }
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }}
                                        >
                                            {index + 1}
                                            {isBookmarked && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '2px',
                                                    right: '2px',
                                                    width: '8px',
                                                    height: '8px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#fef3c7',
                                                    border: '1px solid #f59e0b'
                                                }}></div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {}
                {showNoteModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50,
                        padding: '20px'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '500px',
                            width: '100%'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                                Add Note for Question {question.question_id}
                            </h3>
                            <textarea
                                defaultValue={currentInteraction.note}
                                placeholder="Write your note here..."
                                style={{
                                    width: '100%',
                                    minHeight: '120px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '2px solid #e5e7eb',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                        saveNote(question.question_id, e.currentTarget.value);
                                    }
                                }}
                            />
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowNoteModal(false)}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '6px',
                                        border: '1px solid #e5e7eb',
                                        backgroundColor: 'white',
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={(e) => {
                                        const textarea = e.currentTarget.parentElement?.previousElementSibling as HTMLTextAreaElement;
                                        saveNote(question.question_id, textarea?.value || '');
                                    }}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        background: 'linear-gradient(to right, #9a3197, #E084CD)',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Save Note
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {}
                {showFlagModal && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 50,
                        padding: '20px'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            maxWidth: '500px',
                            width: '100%'
                        }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
                                Report Issue with Question {question.question_id}
                            </h3>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ fontSize: '14px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>
                                    Issue Type
                                </label>
                                <select style={{
                                    width: '100%',
                                    padding: '10px',
                                    borderRadius: '6px',
                                    border: '2px solid #e5e7eb',
                                    fontSize: '14px'
                                }}>
                                    <option>Wrong Answer</option>
                                    <option>Typo in Question</option>
                                    <option>Typo in Options</option>
                                    <option>Unclear Question</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <textarea
                                placeholder="Describe the issue (optional)..."
                                style={{
                                    width: '100%',
                                    minHeight: '80px',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '2px solid #e5e7eb',
                                    fontSize: '14px',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                            />
                            <div style={{ display: 'flex', gap: '12px', marginTop: '16px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => setShowFlagModal(false)}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '6px',
                                        border: '1px solid #e5e7eb',
                                        backgroundColor: 'white',
                                        color: '#6b7280',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        alert('Issue reported successfully!');
                                        setShowFlagModal(false);
                                    }}
                                    style={{
                                        padding: '8px 20px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        backgroundColor: '#ef4444',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Report Issue
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
