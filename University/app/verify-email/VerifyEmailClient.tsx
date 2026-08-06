'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { API_URL } from '@/lib/config';

export default function VerifyEmailClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Verification token is missing');
            return;
        }

        verifyEmail(token);
    }, [searchParams]);

    const verifyEmail = async (token: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/verify-email?token=${token}`);
            const data = await response.json();

            if (response.ok) {
                setStatus('success');
                setMessage('Email verified successfully! Redirecting to login...');
                setTimeout(() => {
                    router.push('/login');
                }, 2000);
            } else {
                setStatus('error');
                setMessage(data.error || 'Verification failed');
            }
        } catch (error) {
            setStatus('error');
            setMessage('Failed to verify email. Please try again.');
        }
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            backgroundColor: '#f9fafb',
            padding: '20px'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                padding: '40px',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center'
            }}>
                {status === 'loading' && (
                    <>
                        <div className="spinner-border" style={{ color: '#070642', width: '3rem', height: '3rem' }} role="status">
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <h2 style={{ marginTop: '24px', color: '#111827', fontSize: '24px', fontWeight: '600' }}>
                            Verifying your email...
                        </h2>
                        <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>
                            Please wait while we verify your email address.
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#d1fae5',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto'
                        }}>
                            <i className="fas fa-check" style={{ color: '#10b981', fontSize: '32px' }}></i>
                        </div>
                        <h2 style={{ marginTop: '24px', color: '#111827', fontSize: '24px', fontWeight: '600' }}>
                            Email Verified!
                        </h2>
                        <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>
                            {message}
                        </p>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div style={{
                            width: '64px',
                            height: '64px',
                            backgroundColor: '#fee2e2',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto'
                        }}>
                            <i className="fas fa-times" style={{ color: '#ef4444', fontSize: '32px' }}></i>
                        </div>
                        <h2 style={{ marginTop: '24px', color: '#111827', fontSize: '24px', fontWeight: '600' }}>
                            Verification Failed
                        </h2>
                        <p style={{ marginTop: '12px', color: '#6b7280', fontSize: '14px' }}>
                            {message}
                        </p>
                        <button
                            onClick={() => router.push('/signup')}
                            style={{
                                marginTop: '24px',
                                backgroundColor: '#070642',
                                color: 'white',
                                border: 'none',
                                padding: '12px 24px',
                                borderRadius: '6px',
                                fontSize: '14px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            Back to Signup
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
