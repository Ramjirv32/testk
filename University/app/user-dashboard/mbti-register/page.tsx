'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/config';
import { useTestRegistrationWebSocket } from '@/hooks/useTestRegistrationWebSocket';

interface RegistrationStatus {
    status: 'pending' | 'approved' | 'rejected';
    reason?: string;
    created_at?: string;
}

export default function MBTIRegisterPage() {
    const router = useRouter();
    const { user, token, isLoading } = useAuth();
    const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useTestRegistrationWebSocket({
        userId: user?.id,
        testType: 'mbti',
        onRegistrationApproved: (data) => {
            console.log(' MBTI Registration approved:', data);
            setRegistrationStatus({
                status: 'approved',
                created_at: registrationStatus?.created_at || new Date().toISOString(),
            });

            alert(' Your MBTI test registration has been approved! You can now take the test.');
        },
        onRegistrationRejected: (data) => {
            console.log(' MBTI Registration rejected:', data);
            setRegistrationStatus({
                status: 'rejected',
                reason: data.reason,
                created_at: registrationStatus?.created_at || new Date().toISOString(),
            });

            alert(` Your MBTI test registration has been rejected. Reason: ${data.reason}`);
        },
    });

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && token) {
            checkRegistrationStatus();
        }
    }, [user, token, isLoading]);

    const checkRegistrationStatus = async () => {
        try {
            const response = await fetch(`${API_URL}/api/mbti/registration`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.registration) {
                    setRegistrationStatus({
                        status: data.registration.status,
                        reason: data.registration.reason,
                        created_at: data.registration.created_at,
                    });
                }
            }
        } catch (error) {
            console.error('Error checking registration status:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
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

            if (response.ok) {
                setRegistrationStatus({
                    status: 'pending',
                    created_at: new Date().toISOString(),
                });
                alert('Registration submitted! Waiting for admin approval...');
            } else {
                const error = await response.json();
                alert(`Registration failed: ${error.error}`);
            }
        } catch (error) {
            console.error('Error registering:', error);
            alert('Error registering for test');
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf4ec' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#faf4ec', padding: '40px 20px' }}>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div
                    style={{
                        backgroundColor: 'white',
                        borderRadius: '16px',
                        padding: '40px',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    {}
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div
                            style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                backgroundColor: '#f3e8ff',
                                margin: '0 auto 16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <svg style={{ width: '48px', height: '48px', color: '#9a3197' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                    </div>

                    {}
                    <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937', marginBottom: '12px', textAlign: 'center' }}>
                        MBTI Test Registration
                    </h1>

                    <p style={{ fontSize: '16px', color: '#6b7280', marginBottom: '32px', textAlign: 'center' }}>
                        Register for the MBTI personality test. Your registration will be reviewed by an admin before you can proceed.
                    </p>

                    {}
                    {registrationStatus ? (
                        <div
                            style={{
                                backgroundColor: registrationStatus.status === 'pending' ? '#fef3c7' :
                                    registrationStatus.status === 'approved' ? '#d1fae5' : '#fee2e2',
                                border: `2px solid ${registrationStatus.status === 'pending' ? '#f59e0b' :
                                    registrationStatus.status === 'approved' ? '#10b981' : '#ef4444'}`,
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '24px',
                                textAlign: 'center',
                            }}
                        >
                            <div style={{
                                fontSize: '14px',
                                fontWeight: '600',
                                color: registrationStatus.status === 'pending' ? '#92400e' :
                                    registrationStatus.status === 'approved' ? '#065f46' : '#7f1d1d',
                                marginBottom: '8px',
                                textTransform: 'uppercase',
                            }}>
                                Registration Status
                            </div>

                            <div style={{
                                fontSize: '20px',
                                fontWeight: 'bold',
                                color: registrationStatus.status === 'pending' ? '#d97706' :
                                    registrationStatus.status === 'approved' ? '#059669' : '#dc2626',
                                marginBottom: '12px',
                                textTransform: 'capitalize',
                            }}>
                                {registrationStatus.status}
                            </div>

                            {registrationStatus.status === 'approved' && (
                                <button
                                    onClick={() => router.push('/user-dashboard/take-test')}
                                    style={{
                                        backgroundColor: '#059669',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 24px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        marginTop: '12px',
                                    }}
                                >
                                    Take Test Now →
                                </button>
                            )}

                            {registrationStatus.status === 'pending' && (
                                <p style={{ fontSize: '13px', color: '#92400e', marginTop: '8px' }}>
                                    Please wait for admin approval. You can check back later.
                                </p>
                            )}

                            {registrationStatus.status === 'rejected' && (
                                <div style={{ marginTop: '12px' }}>
                                    <p style={{ fontSize: '13px', color: '#7f1d1d', marginBottom: '8px' }}>
                                        Reason: {registrationStatus.reason || 'Not specified'}
                                    </p>
                                    <button
                                        onClick={handleRegister}
                                        style={{
                                            backgroundColor: '#dc2626',
                                            color: 'white',
                                            border: 'none',
                                            padding: '10px 24px',
                                            borderRadius: '8px',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            marginTop: '8px',
                                        }}
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            <div style={{
                                backgroundColor: '#f0f9ff',
                                border: '2px solid #0284c7',
                                borderRadius: '12px',
                                padding: '20px',
                                marginBottom: '24px',
                            }}>
                                <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '8px', fontWeight: '600' }}>
                                    ℹ️ About this test
                                </div>
                                <ul style={{ fontSize: '13px', color: '#1e40af', margin: '0', paddingLeft: '20px' }}>
                                    <li>70 multiple-choice questions</li>
                                    <li>Identifies your Myers-Briggs personality type</li>
                                    <li>Takes approximately 20-30 minutes</li>
                                    <li>For students age 18 and above</li>
                                </ul>
                            </div>

                            <button
                                onClick={handleRegister}
                                disabled={submitting}
                                style={{
                                    width: '100%',
                                    backgroundColor: '#9a3197',
                                    color: 'white',
                                    border: 'none',
                                    padding: '14px',
                                    borderRadius: '8px',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: submitting ? 'not-allowed' : 'pointer',
                                    opacity: submitting ? 0.7 : 1,
                                    transition: 'all 0.3s ease',
                                }}
                                onMouseOver={(e) => {
                                    if (!submitting) e.currentTarget.style.backgroundColor = '#7c2f79';
                                }}
                                onMouseOut={(e) => {
                                    if (!submitting) e.currentTarget.style.backgroundColor = '#9a3197';
                                }}
                            >
                                {submitting ? 'Registering...' : 'Register for Test'}
                            </button>

                            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '16px', textAlign: 'center' }}>
                                Your registration will be reviewed within 24 hours
                            </p>
                        </>
                    )}

                    {}
                    <button
                        onClick={() => router.back()}
                        style={{
                            width: '100%',
                            backgroundColor: 'transparent',
                            color: '#6b7280',
                            border: '2px solid #e5e7eb',
                            padding: '12px',
                            borderRadius: '8px',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            marginTop: '16px',
                            transition: 'all 0.3s ease',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.backgroundColor = '#f3f4f6';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                    >
                        ← Go Back
                    </button>
                </div>
            </div>
        </div>
    );
}
