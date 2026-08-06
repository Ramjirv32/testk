import { Suspense } from 'react';
import TestResultsClient from './TestResultsClient';

export default function TestResultsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#faf4ec' }}>
                <div className="text-center">
                    <div className="spinner" style={{
                        width: '60px',
                        height: '60px',
                        border: '4px solid #e5e7eb',
                        borderTop: '4px solid #9a3197',
                        borderRadius: '50%',
                        margin: '0 auto 16px'
                    }}></div>
                    <div style={{ color: '#9a3197', fontSize: '18px', fontWeight: '600' }}>Loading Results...</div>
                </div>
            </div>
        }>
            <TestResultsClient />
        </Suspense>
    );
}
