'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { API_URL } from '@/lib/config';
import { useWebSocket } from '@/hooks/useWebSocket';

const ClockIcon = () => (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const XCircleIcon = () => (
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const BrainIcon = () => (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

export default function MBTITestPage() {
    const router = useRouter();
    const { user, token, isLoading } = useAuth();
    const [registration, setRegistration] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const checkRegistrationStatus = useCallback(async () => {
        try {
            console.log(' Token:', token);
            console.log(' User:', user);
            console.log(' API URL:', API_URL);
            const response = await fetch(`${API_URL}/api/mbti/registration`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            console.log(' Registration Status Response:', response.status);
            if (response.ok) {
                const data = await response.json();
                setRegistration(data.registration);
            } else {
                const errorData = await response.json();
                console.error(' Registration Error:', errorData);
            }
        } catch (error) {
            console.error('Error checking registration:', error);
        } finally {
            setLoading(false);
        }
    }, [token, user]);

    const wsUrl = user?.id ? `${API_URL.replace(/^https?/, 'ws')}/ws/student?user_id=${user.id}` : '';
    useWebSocket(wsUrl, {
        onMessage: (data) => {

            if (data.type === 'mbti_approval' && data.user_id === user?.id) {
                console.log('MBTI registration approved!');

                checkRegistrationStatus();
            }
        },
        onOpen: () => {
            console.log('WebSocket connected for MBTI updates');
        }
    });

    useEffect(() => {
        console.log('useEffect called:', { isLoading, user, token });
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && user.age && user.age < 18) {
            router.push('/user-dashboard');
            return;
        }

        if (user && token) {
            console.log(' User and token available, checking registration...');
            checkRegistrationStatus();
        } else {
            console.log(' Missing user or token:', { user: !!user, token: !!token });
        }
    }, [user, token, isLoading, checkRegistrationStatus]);

    const handleRegister = async () => {
        setError('');
        setSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/api/mbti/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: user?.id,
                    email: user?.email,
                    name: user?.name,
                    age: user?.age,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                await checkRegistrationStatus();
            } else {
                setError(data.error || 'Failed to submit registration');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf4ec' }}>
                <div className="text-center">
                    <div style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid #e5e7eb',
                        borderTop: '4px solid #dc2626',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <div style={{ color: '#dc2626', fontSize: '18px', fontWeight: '600' }}>Loading...</div>
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
        <div className="min-h-screen" style={{ backgroundColor: '#faf4ec', padding: '40px 20px' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                {}
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#dc2626' }}>
                        <BrainIcon />
                    </div>
                    <h1 style={{ fontSize: '36px', fontWeight: 'bold', color: '#dc2626', marginBottom: '12px' }}>
                        MBTI Test
                    </h1>
                    <p style={{ fontSize: '16px', color: '#6b7280' }}>
                        Discover your Myers-Briggs Personality Type (For students aged 18 and above)
                    </p>
                </div>

                {}
                {registration ? (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }}>
                        {registration.status === 'pending' && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#f59e0b' }}>
                                    <ClockIcon />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '12px' }}>
                                    Pending Approval
                                </h2>
                                <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                                    Your registration is awaiting admin approval. You'll be notified once it's approved.
                                </p>
                                <div style={{
                                    backgroundColor: '#fef3c7',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    border: '2px solid #f59e0b'
                                }}>
                                    <p style={{ fontSize: '14px', color: '#92400e' }}>
                                        <strong>Name:</strong> {registration.name}<br />
                                        <strong>Age:</strong> {registration.age}<br />
                                        <strong>Type:</strong> {registration.student_type}
                                    </p>
                                </div>
                            </div>
                        )}

                        {registration.status === 'approved' && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#10b981' }}>
                                    <CheckCircleIcon />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '12px' }}>
                                    Test Approved!
                                </h2>
                                <p style={{ color: '#6b7280', marginBottom: '24px' }}>
                                    Your registration has been approved. You can now take the MBTI test.
                                </p>
                                <Link
                                    href="/user-dashboard/take-test"
                                    style={{
                                        display: 'inline-block',
                                        backgroundColor: '#dc2626',
                                        color: 'white',
                                        padding: '16px 48px',
                                        borderRadius: '50px',
                                        textDecoration: 'none',
                                        fontSize: '18px',
                                        fontWeight: '600',
                                        boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    Go to Exam →
                                </Link>
                            </div>
                        )}

                        {registration.status === 'rejected' && (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px', color: '#ef4444' }}>
                                    <XCircleIcon />
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444', marginBottom: '12px' }}>
                                    Registration Rejected
                                </h2>
                                <p style={{ color: '#6b7280', marginBottom: '16px' }}>
                                    Your registration was not approved.
                                </p>
                                {registration.reason && (
                                    <div style={{
                                        backgroundColor: '#fee2e2',
                                        padding: '16px',
                                        borderRadius: '8px',
                                        border: '2px solid #ef4444',
                                        marginBottom: '24px'
                                    }}>
                                        <p style={{ fontSize: '14px', color: '#991b1b' }}>
                                            <strong>Reason:</strong> {registration.reason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                        textAlign: 'center'
                    }}>
                        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                            Register for MBTI Test
                        </h2>
                        <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '24px' }}>
                            Click the button below to register. Your details will be automatically fetched from your profile.
                        </p>

                        {error && (
                            <div style={{
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                padding: '12px',
                                borderRadius: '8px',
                                marginBottom: '20px',
                                fontSize: '14px'
                            }}>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleRegister}
                            disabled={submitting}
                            style={{
                                backgroundColor: submitting ? '#9ca3af' : '#dc2626',
                                color: 'white',
                                padding: '16px 48px',
                                borderRadius: '50px',
                                border: 'none',
                                fontSize: '18px',
                                fontWeight: '600',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)'
                            }}
                            onMouseOver={(e) => {
                                if (!submitting) e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseOut={(e) => {
                                if (!submitting) e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            {submitting ? 'Submitting...' : 'Submit Registration'}
                        </button>
                    </div>
                )}

                {}
                <div style={{ marginTop: '24px', textAlign: 'center' }}>
                    <Link
                        href="/user-dashboard"
                        style={{
                            color: '#dc2626',
                            textDecoration: 'none',
                            fontSize: '16px',
                            fontWeight: '600'
                        }}
                    >
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}
