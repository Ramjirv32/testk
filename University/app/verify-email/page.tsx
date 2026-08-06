'use client';

import { Suspense } from 'react';
import VerifyEmailClient from './VerifyEmailClient';

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                backgroundColor: '#f9fafb'
            }}>
                <div style={{
                    textAlign: 'center',
                    padding: '40px'
                }}>
                    <div className="spinner-border" style={{ color: '#070642' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p style={{ marginTop: '20px', color: '#6b7280' }}>Loading verification...</p>
                </div>
            </div>
        }>
            <VerifyEmailClient />
        </Suspense>
    );
}
