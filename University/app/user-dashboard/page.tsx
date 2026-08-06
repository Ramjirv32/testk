'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

interface TestResult {
    id: string;
    test_type: string;
    total_score: number;
    max_score: number;
    percentage: number;
    completed_at: string;
    bookmarked_count: number;
    reviewed_count: number;
    hints_used_count: number;
    is_completed: boolean;
}

const AcademicCapIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
);

const ChartBarIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

const StarIcon = ({ filled }: { filled?: boolean }) => (
    <svg className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
);

const BookOpenIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const UserIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const CheckCircleIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const DocumentTextIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const BookmarkIcon = ({ filled }: { filled?: boolean }) => (
    <svg className="w-6 h-6" fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
    </svg>
);

const LightBulbIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const ClipboardCheckIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
);

const CalendarIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

const MailIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

const PencilIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const ClipboardListIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
);

export default function StudentDashboard() {
    const router = useRouter();
    const { user, token, isLoading, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<'overview' | 'favorites' | 'history' | 'profile'>('overview');
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [userAge, setUserAge] = useState<number | null>(null);
    const [hasMBTITest, setHasMBTITest] = useState(false);
    const [mbtiTestId, setMbtiTestId] = useState<string | null>(null);
    const [hasCognitiveTest, setHasCognitiveTest] = useState(false);
    const [cognitiveTestId, setCognitiveTestId] = useState<string | null>(null);
    const [hasPsychometricTest, setHasPsychometricTest] = useState(false);
    const [hasPESCIOTest, setHasPESCIOTest] = useState(false);
    const [hasGRETest, setHasGRETest] = useState(false);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        } else if (user) {

            if (user.age) {
                console.log(' User Age from Auth Context:', user.age);
                setUserAge(user.age);
            } else {
                console.log(' User age not found in auth context');
            }
            fetchDashboardData();
        }
    }, [user, token, isLoading]);

    const fetchDashboardData = async () => {
        try {

            const response = await fetch(`${API_URL}/api/test/user-results`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();

                let filteredResults = data.results || data.data || (Array.isArray(data) ? data : []);
                const currentAge = user?.age || userAge;

                console.log(' Filtering test results:', {
                    totalResults: data.results?.length,
                    currentAge,
                    userAge: user?.age,
                    results: data.results?.map((r: TestResult) => ({ type: r.test_type, completed: r.is_completed }))
                });

                if (currentAge !== null && currentAge !== undefined) {
                    filteredResults = filteredResults.filter((r: TestResult) => {

                        if (currentAge >= 18) {
                            const shouldShow = r.test_type !== 'cognitive';
                            console.log(`  ${r.test_type}: ${shouldShow ? ' SHOW' : ' HIDE'} (age ${currentAge} >= 18)`);
                            return shouldShow;
                        }

                        else {
                            const shouldShow = r.test_type !== 'mvti';
                            console.log(`  ${r.test_type}: ${shouldShow ? ' SHOW' : ' HIDE'} (age ${currentAge} < 18)`);
                            return shouldShow;
                        }
                    });
                }

                console.log(' Filtered results:', filteredResults.length, filteredResults.map((r: TestResult) => r.test_type));

                setTestResults(filteredResults);

                const mbtiTest = filteredResults?.find((r: TestResult) => r.test_type === 'mvti');
                setHasMBTITest(!!mbtiTest);
                if (mbtiTest) setMbtiTestId(mbtiTest.id);

                const cognitiveTest = filteredResults?.find((r: TestResult) => r.test_type === 'cognitive');
                setHasCognitiveTest(!!cognitiveTest);
                if (cognitiveTest) setCognitiveTestId(cognitiveTest.id);

                const psychometricTest = filteredResults?.find((r: TestResult) => r.test_type === 'psychometric');
                setHasPsychometricTest(!!psychometricTest);

                const pescioTest = filteredResults?.find((r: TestResult) => r.test_type === 'pescio');
                setHasPESCIOTest(!!pescioTest);

                const greTest = filteredResults?.find((r: TestResult) => r.test_type === 'gre');
                setHasGRETest(!!greTest);

                if (data.results && data.results.length > 0 && !userAge) {
                    setUserAge(data.results[0].age || null);
                }
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
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
                        borderTop: '4px solid #9a3197',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }}></div>
                    <div style={{ color: '#9a3197', fontSize: '18px', fontWeight: '600' }}>Loading Dashboard...</div>
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

    const tabs = [
        { id: 'overview' as const, label: 'Overview', icon: <ChartBarIcon /> },
        { id: 'favorites' as const, label: 'Favorites', icon: <StarIcon /> },
        { id: 'history' as const, label: 'Test History', icon: <BookOpenIcon /> },
        { id: 'profile' as const, label: 'Profile', icon: <UserIcon /> }
    ];

    return (
        <div className="min-h-screen" style={{ backgroundColor: '#faf4ec' }}>
            {}
            <div style={{
                backgroundColor: '#9a3197',
                padding: '24px 20px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                position: 'sticky',
                top: 0,
                zIndex: 20,
                animation: 'slideDown 0.5s ease-out'
            }}>
                <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            {}
                            <Link
                                href="/"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.color = '#9a3197';
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                    e.currentTarget.style.color = 'white';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <div style={{ color: 'white' }}>
                                <AcademicCapIcon />
                            </div>
                            <div>
                                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px', animation: 'fadeIn 0.6s ease-out' }}>
                                    Student Dashboard
                                </h1>
                                <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px' }}>
                                    Welcome back, {user?.email} {userAge !== null && `• Age: ${userAge}`}
                                </p>
                            </div>
                        </div>

                        {}
                        <div style={{ position: 'relative', minWidth: '300px' }}>
                            <input
                                type="text"
                                placeholder="Search tests, notes, bookmarks..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '10px 40px 10px 16px',
                                    borderRadius: '50px',
                                    border: 'none',
                                    fontSize: '14px',
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    transition: 'all 0.3s ease'
                                }}
                                onFocus={(e) => {
                                    e.currentTarget.style.backgroundColor = 'white';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                                }}
                                onBlur={(e) => {
                                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            />
                            <svg style={{
                                position: 'absolute',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '20px',
                                height: '20px',
                                color: '#9a3197'
                            }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {}
                        <button
                            onClick={() => {
                                if (confirm('Are you sure you want to logout?')) {
                                    logout();
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '10px 20px',
                                borderRadius: '50px',
                                border: 'none',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                whiteSpace: 'nowrap'
                            }}
                            onMouseOver={(e) => {
                                e.currentTarget.style.backgroundColor = 'white';
                                e.currentTarget.style.color = '#9a3197';
                                e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseOut={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                e.currentTarget.style.color = 'white';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            <svg style={{ width: '20px', height: '20px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Logout
                        </button>
                    </div>

                    {}
                    <div style={{
                        marginTop: '20px',
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        scrollbarWidth: 'none', 
                        msOverflowStyle: 'none' 
                    }} className="hide-scrollbar">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '10px 20px',
                                    borderRadius: '50px',
                                    border: 'none',
                                    backgroundColor: activeTab === tab.id ? 'white' : 'rgba(255, 255, 255, 0.2)',
                                    color: activeTab === tab.id ? '#9a3197' : 'white',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    whiteSpace: 'nowrap',
                                    transform: activeTab === tab.id ? 'scale(1.05)' : 'scale(1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                                onMouseOver={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (activeTab !== tab.id) {
                                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                                    }
                                }}
                            >
                                <span style={{ width: '20px', height: '20px' }}>{tab.icon}</span>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {}
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '24px' }}>
                    {}
                    <div style={{ animation: 'slideInLeft 0.5s ease-out' }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '20px',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                            position: 'sticky',
                            top: '180px'
                        }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937', marginBottom: '16px' }}>
                                Quick Access
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {[
                                    {
                                        icon: <StarIcon filled />,
                                        label: 'Favorites',
                                        count: testResults.reduce((sum, r) => sum + (r.reviewed_count || 0), 0),
                                        color: '#f59e0b'
                                    },
                                    {
                                        icon: <DocumentTextIcon />,
                                        label: 'Saved Notes',
                                        count: 0,
                                        color: '#9a3197'
                                    },
                                    {
                                        icon: <BookmarkIcon filled />,
                                        label: 'Bookmarks',
                                        count: testResults.reduce((sum, r) => sum + (r.bookmarked_count || 0), 0),
                                        color: '#dd6236'
                                    },
                                    { icon: <CheckCircleIcon />, label: 'Completed', count: testResults.length, color: '#10b981' }
                                ].map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => {
                                            if (item.label === 'Favorites') setActiveTab('favorites');
                                            else if (item.label === 'Completed') setActiveTab('history');
                                        }}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            backgroundColor: '#f9fafb',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = `${item.color}15`;
                                            e.currentTarget.style.transform = 'translateX(4px)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f9fafb';
                                            e.currentTarget.style.transform = 'translateX(0)';
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ width: '20px', height: '20px', color: item.color }}>{item.icon}</span>
                                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                                                {item.label}
                                            </span>
                                        </div>
                                        <span style={{
                                            backgroundColor: item.color,
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 'bold',
                                            padding: '2px 8px',
                                            borderRadius: '12px'
                                        }}>
                                            {item.count}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            {}
                            {userAge !== null && userAge >= 18 && (
                                <Link
                                    href={hasMBTITest && mbtiTestId ? `/user-dashboard/test-results?id=${mbtiTestId}&type=mvti` : "/user-dashboard/mbti"}
                                    style={{
                                        display: 'block',
                                        marginTop: '20px',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        background: hasMBTITest
                                            ? 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)'
                                            : 'linear-gradient(135deg, #9a3197 0%, #E084CD 100%)',
                                        color: 'white',
                                        textDecoration: 'none',
                                        boxShadow: hasMBTITest
                                            ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                                            : '0 4px 12px rgba(154, 49, 151, 0.4)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.3s ease'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                            {hasMBTITest ? (
                                                <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                                            MBTI Test
                                        </div>
                                        <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '12px' }}>
                                            {hasMBTITest ? 'View your results' : 'Discover your personality type!'}
                                        </div>
                                        <div style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {hasMBTITest ? 'Completed ' : 'Register Now →'}
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {}
                            {userAge !== null && userAge < 18 && (
                                <Link
                                    href={hasCognitiveTest && cognitiveTestId ? `/user-dashboard/test-results?id=${cognitiveTestId}&type=cognitive` : "/user-dashboard/cognitive"}
                                    style={{
                                        display: 'block',
                                        marginTop: '20px',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        background: hasCognitiveTest
                                            ? 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)'
                                            : 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                                        color: 'white',
                                        textDecoration: 'none',
                                        boxShadow: hasCognitiveTest
                                            ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                                            : '0 4px 12px rgba(245, 158, 11, 0.4)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.3s ease'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                            {hasCognitiveTest ? (
                                                <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                </svg>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                                            Cognitive Test
                                        </div>
                                        <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '12px' }}>
                                            {hasCognitiveTest ? 'View your results' : 'Test your cognitive abilities!'}
                                        </div>
                                        <div style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {hasCognitiveTest ? 'Completed ' : 'Register Now →'}
                                        </div>
                                    </div>
                                </Link>
                            )}

                            {}
                            {userAge !== null && userAge <= 15 && (
                                <Link
                                    href={hasPsychometricTest ? "/user-dashboard/psychometric-result" : "/user-dashboard/psychometric"}
                                    style={{
                                        display: 'block',
                                        marginTop: '20px',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        background: hasPsychometricTest
                                            ? 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)'
                                            : 'linear-gradient(135deg, #9a3197 0%, #E084CD 100%)',
                                        color: 'white',
                                        textDecoration: 'none',
                                        boxShadow: hasPsychometricTest
                                            ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                                            : '0 4px 12px rgba(154, 49, 151, 0.4)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.3s ease'
                                    }}
                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <div style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                            {hasPsychometricTest ? (
                                                <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            ) : (
                                                <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                                            Psychometric Test
                                        </div>
                                        <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '12px' }}>
                                            {hasPsychometricTest ? 'View your results' : '15-Question Assessment'}
                                        </div>
                                        <div style={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {hasPsychometricTest ? 'Completed ' : 'Register Now →'}
                                        </div>
                                    </div>
                                </Link>
                            )}
                            {}
                            <Link
                                href={hasPESCIOTest ? "/user-dashboard/pescio-result" : "/user-dashboard/pescio"}
                                style={{
                                    display: 'block',
                                    marginTop: '20px',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    background: hasPESCIOTest
                                        ? 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)'
                                        : 'linear-gradient(135deg, #dd6236 0%, #f59e0b 100%)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    boxShadow: hasPESCIOTest
                                        ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                                        : '0 4px 12px rgba(221, 98, 54, 0.4)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.3s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                        {hasPESCIOTest ? (
                                            <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : (
                                            <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                                        PESCIO Test
                                    </div>
                                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '12px' }}>
                                        {hasPESCIOTest ? 'View your results' : 'Discover your interests'}
                                    </div>
                                    <div style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {hasPESCIOTest ? 'Completed ' : 'Register Now →'}
                                    </div>
                                </div>
                            </Link>

                            {/* GRE Test Link */}
                            <Link
                                href="/user-dashboard/gre-dashboard"
                                style={{
                                    display: 'block',
                                    marginTop: '20px',
                                    padding: '20px',
                                    borderRadius: '12px',
                                    background: hasGRETest
                                        ? 'linear-gradient(135deg, #10b981 0%, #22c55e 100%)'
                                        : 'linear-gradient(135deg, #e61a8d 0%, #E084CD 100%)',
                                    color: 'white',
                                    textDecoration: 'none',
                                    boxShadow: hasGRETest
                                        ? '0 4px 12px rgba(16, 185, 129, 0.4)'
                                        : '0 4px 12px rgba(230, 26, 141, 0.4)',
                                    cursor: 'pointer',
                                    transition: 'transform 0.3s ease'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
                                        {hasGRETest ? (
                                            <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        ) : (
                                            <svg style={{ width: '32px', height: '32px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' }}>
                                        GRE Test
                                    </div>
                                    <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '12px' }}>
                                        {hasGRETest ? 'View your results' : 'Graduate Readiness Exam'}
                                    </div>
                                    <div style={{
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        padding: '8px 16px',
                                        borderRadius: '20px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {hasGRETest ? 'Completed ' : 'Schedule Test →'}
                                    </div>
                                </div>
                            </Link>

                            {}
                            <div style={{
                                marginTop: '20px',
                                padding: '16px',
                                borderRadius: '8px',
                                backgroundColor: '#ede4d3',
                                border: '2px solid #dd6236'
                            }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', color: '#dd6236', marginBottom: '8px' }}>
                                    Overall Progress
                                </div>
                                <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                                    {testResults.length > 0
                                        ? Math.round(testResults.reduce((sum, r) => sum + r.percentage, 0) / testResults.length)
                                        : 0}%
                                </div>
                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                    Average Score
                                </div>
                            </div>
                        </div>
                    </div>

                    {}
                    <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
                        {activeTab === 'overview' && (
                            <div>
                                {}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '16px',
                                    marginBottom: '24px'
                                }}>
                                    {[
                                        { label: 'Tests Completed', value: testResults.length, icon: <ClipboardCheckIcon />, color: '#10b981', bg: '#d1fae5' },
                                        { label: 'Average Score', value: `${testResults.length > 0 ? Math.round(testResults.reduce((sum, r) => sum + r.percentage, 0) / testResults.length) : 0}%`, icon: <ChartBarIcon />, color: '#9a3197', bg: '#f3e8ff' },
                                        { label: 'Bookmarks', value: testResults.reduce((sum, r) => sum + (r.bookmarked_count || 0), 0), icon: <BookmarkIcon />, color: '#dd6236', bg: '#ede4d3' },
                                        { label: 'Hints Used', value: testResults.reduce((sum, r) => sum + (r.hints_used_count || 0), 0), icon: <LightBulbIcon />, color: '#f59e0b', bg: '#fef3c7' }
                                    ].map((stat, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                backgroundColor: stat.bg,
                                                borderRadius: '12px',
                                                padding: '20px',
                                                border: `2px solid ${stat.color}`,
                                                animation: `scaleIn 0.5s ease-out ${index * 0.1}s both`,
                                                transition: 'transform 0.3s ease',
                                                cursor: 'pointer'
                                            }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <div style={{ fontSize: '12px', fontWeight: '600', color: stat.color, marginBottom: '8px' }}>
                                                        {stat.label}
                                                    </div>
                                                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
                                                        {stat.value}
                                                    </div>
                                                </div>
                                                <div style={{ width: '32px', height: '32px', color: stat.color }}>{stat.icon}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {}
                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                        <div style={{ color: '#9a3197' }}>
                                            <ClipboardListIcon />
                                        </div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                                            Recent Tests
                                        </h2>
                                    </div>

                                    {testResults.length === 0 && !hasPsychometricTest ? (
                                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                            <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#9ca3af' }}>
                                                <ClipboardListIcon />
                                            </div>
                                            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '20px' }}>
                                                No tests completed yet
                                            </p>

                                            {}
                                            {userAge !== null && userAge >= 18 && (
                                                <Link
                                                    href="/user-dashboard/mbti"
                                                    style={{
                                                        display: 'inline-block',
                                                        marginTop: '10px',
                                                        padding: '24px 32px',
                                                        borderRadius: '16px',
                                                        background: 'linear-gradient(135deg, #9a3197 0%, #E084CD 100%)',
                                                        color: 'white',
                                                        textDecoration: 'none',
                                                        boxShadow: '0 4px 12px rgba(154, 49, 151, 0.4)',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.3s ease',
                                                        minWidth: '320px'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <div style={{ textAlign: 'center' }}>
                                                        <svg style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                        </svg>
                                                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                                                            MBTI Personality Test
                                                        </div>
                                                        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px' }}>
                                                            70-Question Assessment • Ages 18+
                                                        </div>
                                                        <div style={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                                            padding: '10px 24px',
                                                            borderRadius: '24px',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            display: 'inline-block'
                                                        }}>
                                                            Register Now →
                                                        </div>
                                                    </div>
                                                </Link>
                                            )}

                                            {userAge !== null && userAge >= 16 && userAge <= 17 && (
                                                <Link
                                                    href="/user-dashboard/cognitive"
                                                    style={{
                                                        display: 'inline-block',
                                                        marginTop: '10px',
                                                        padding: '24px 32px',
                                                        borderRadius: '16px',
                                                        background: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                                                        color: 'white',
                                                        textDecoration: 'none',
                                                        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.3s ease',
                                                        minWidth: '320px'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <div style={{ textAlign: 'center' }}>
                                                        <svg style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                        </svg>
                                                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                                                            Cognitive Ability Test
                                                        </div>
                                                        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px' }}>
                                                            60-Question Assessment • Ages 16-17
                                                        </div>
                                                        <div style={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                                            padding: '10px 24px',
                                                            borderRadius: '24px',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            display: 'inline-block'
                                                        }}>
                                                            Register Now →
                                                        </div>
                                                    </div>
                                                </Link>
                                            )}

                                            {userAge !== null && userAge <= 15 && (
                                                <Link
                                                    href="/user-dashboard/psychometric"
                                                    style={{
                                                        display: 'inline-block',
                                                        marginTop: '10px',
                                                        padding: '24px 32px',
                                                        borderRadius: '16px',
                                                        background: 'linear-gradient(135deg, #9a3197 0%, #E084CD 100%)',
                                                        color: 'white',
                                                        textDecoration: 'none',
                                                        boxShadow: '0 4px 12px rgba(154, 49, 151, 0.4)',
                                                        cursor: 'pointer',
                                                        transition: 'transform 0.3s ease',
                                                        minWidth: '320px'
                                                    }}
                                                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <div style={{ textAlign: 'center' }}>
                                                        <svg style={{ width: '48px', height: '48px', margin: '0 auto 12px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                                        </svg>
                                                        <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>
                                                            Psychometric Test
                                                        </div>
                                                        <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '16px' }}>
                                                            15-Question Assessment • Ages ≤15
                                                        </div>
                                                        <div style={{
                                                            backgroundColor: 'rgba(255, 255, 255, 0.25)',
                                                            padding: '10px 24px',
                                                            borderRadius: '24px',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            display: 'inline-block'
                                                        }}>
                                                            Register Now →
                                                        </div>
                                                    </div>
                                                </Link>
                                            )}
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            {testResults.slice(0, 5).map((result, index) => {

                                                const currentAge = user?.age || userAge;
                                                if (currentAge != null && currentAge >= 18 && result.test_type === 'cognitive') return null;

                                                if (result.test_type === 'pescio' || result.test_type === 'psychometric') return null;

                                                return (
                                                    <Link
                                                        key={result.id}
                                                        href={`/user-dashboard/test-results?id=${result.id}&type=${result.test_type}`}
                                                        style={{ textDecoration: 'none' }}
                                                    >
                                                        <div
                                                            style={{
                                                                padding: '16px',
                                                                borderRadius: '8px',
                                                                border: '2px solid #e5e7eb',
                                                                transition: 'all 0.3s ease',
                                                                animation: `slideInRight 0.5s ease-out ${index * 0.1}s both`,
                                                                cursor: 'pointer',
                                                                backgroundColor: 'white'
                                                            }}
                                                            onMouseOver={(e) => {
                                                                e.currentTarget.style.borderColor = '#9a3197';
                                                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                                                e.currentTarget.style.transform = 'translateX(4px)';
                                                            }}
                                                            onMouseOut={(e) => {
                                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                                e.currentTarget.style.backgroundColor = 'white';
                                                                e.currentTarget.style.transform = 'translateX(0)';
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    <div style={{ width: '24px', height: '24px', color: '#9a3197' }}>
                                                                        {result.test_type === 'mvti' ? <AcademicCapIcon /> : <ChartBarIcon />}
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                                                            {result.test_type === 'mvti' ? 'MBTI Test' :
                                                                                result.test_type === 'cognitive' ? 'Cognitive Test' :
                                                                                    result.test_type === 'pescio' ? 'PESCIO Test' :
                                                                                        result.test_type === 'psychometric' ? 'Psychometric Test' : 'Test'}
                                                                        </div>
                                                                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                                            Completed on {new Date(result.completed_at).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div style={{ textAlign: 'right' }}>
                                                                    <div style={{
                                                                        fontSize: '24px',
                                                                        fontWeight: 'bold',
                                                                        color: result.percentage >= 50 ? '#10b981' : '#ef4444'
                                                                    }}>
                                                                        {result.percentage.toFixed(0)}%
                                                                    </div>
                                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                        {result.total_score}/{result.max_score}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                );
                                            })}

                                            {}
                                            {hasPsychometricTest && (
                                                <Link
                                                    href="/user-dashboard/psychometric-result"
                                                    style={{ textDecoration: 'none' }}
                                                >
                                                    <div
                                                        style={{
                                                            padding: '16px',
                                                            borderRadius: '8px',
                                                            border: '2px solid #e5e7eb',
                                                            transition: 'all 0.3s ease',
                                                            cursor: 'pointer',
                                                            backgroundColor: 'white'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.borderColor = '#9a3197';
                                                            e.currentTarget.style.backgroundColor = '#f9fafb';
                                                            e.currentTarget.style.transform = 'translateX(4px)';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                                            e.currentTarget.style.backgroundColor = 'white';
                                                            e.currentTarget.style.transform = 'translateX(0)';
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{ width: '24px', height: '24px', color: '#9a3197' }}>
                                                                    <ClipboardCheckIcon />
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                                                        Psychometric Test
                                                                    </div>
                                                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                                        View your results
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{
                                                                    fontSize: '18px',
                                                                    fontWeight: 'bold',
                                                                    color: '#10b981'
                                                                }}>
                                                                    
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                    Completed
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            )}

                                            {}
                                            {hasPESCIOTest && (
                                                <Link
                                                    href="/user-dashboard/pescio-result"
                                                    style={{ textDecoration: 'none' }}
                                                >
                                                    <div
                                                        style={{
                                                            padding: '16px',
                                                            borderRadius: '8px',
                                                            border: '2px solid #e5e7eb',
                                                            transition: 'all 0.3s ease',
                                                            cursor: 'pointer',
                                                            backgroundColor: 'white'
                                                        }}
                                                        onMouseOver={(e) => {
                                                            e.currentTarget.style.borderColor = '#9a3197';
                                                            e.currentTarget.style.backgroundColor = '#f9fafb';
                                                            e.currentTarget.style.transform = 'translateX(4px)';
                                                        }}
                                                        onMouseOut={(e) => {
                                                            e.currentTarget.style.borderColor = '#e5e7eb';
                                                            e.currentTarget.style.backgroundColor = 'white';
                                                            e.currentTarget.style.transform = 'translateX(0)';
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                <div style={{ width: '24px', height: '24px', color: '#9a3197' }}>
                                                                    <ClipboardCheckIcon />
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                                                        PESCIO Test
                                                                    </div>
                                                                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                                        View your results
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div style={{ textAlign: 'right' }}>
                                                                <div style={{
                                                                    fontSize: '18px',
                                                                    fontWeight: 'bold',
                                                                    color: '#10b981'
                                                                }}>
                                                                    
                                                                </div>
                                                                <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                                    Completed
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'favorites' && (
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '24px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                animation: 'fadeIn 0.5s ease-out'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ color: '#f59e0b' }}>
                                        <StarIcon filled />
                                    </div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                                        Your Favorites
                                    </h2>
                                </div>
                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', color: '#f59e0b' }}>
                                        <StarIcon />
                                    </div>
                                    <p style={{ color: '#6b7280', fontSize: '16px' }}>
                                        Your bookmarked questions will appear here
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'history' && (
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '24px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                animation: 'fadeIn 0.5s ease-out'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ color: '#9a3197' }}>
                                        <BookOpenIcon />
                                    </div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                                        Complete Test History
                                    </h2>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {testResults.map((result) => (
                                        <div
                                            key={result.id}
                                            style={{
                                                padding: '16px',
                                                borderRadius: '8px',
                                                border: '2px solid #e5e7eb',
                                                transition: 'all 0.3s ease',
                                                cursor: 'pointer'
                                            }}
                                            onMouseOver={(e) => {
                                                e.currentTarget.style.borderColor = '#9a3197';
                                                e.currentTarget.style.backgroundColor = '#f9fafb';
                                            }}
                                            onMouseOut={(e) => {
                                                e.currentTarget.style.borderColor = '#e5e7eb';
                                                e.currentTarget.style.backgroundColor = 'white';
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '24px', height: '24px', color: '#9a3197' }}>
                                                        {result.test_type === 'mvti' ? <AcademicCapIcon /> : <ChartBarIcon />}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                                                            {result.test_type === 'mvti' ? 'MBTI Test' : 'Cognitive Test'}
                                                        </div>
                                                        <div style={{ fontSize: '13px', color: '#6b7280' }}>
                                                            {new Date(result.completed_at).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{
                                                        fontSize: '24px',
                                                        fontWeight: 'bold',
                                                        color: result.percentage >= 50 ? '#10b981' : '#ef4444'
                                                    }}>
                                                        {result.percentage.toFixed(0)}%
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                                                        {result.total_score}/{result.max_score} correct
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'profile' && (
                            <div style={{
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                padding: '24px',
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                animation: 'fadeIn 0.5s ease-out'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ color: '#9a3197' }}>
                                            <UserIcon />
                                        </div>
                                        <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                                            My Profile
                                        </h2>
                                    </div>
                                    <button style={{
                                        padding: '8px 20px',
                                        borderRadius: '50px',
                                        border: 'none',
                                        backgroundColor: '#9a3197',
                                        color: 'white',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                    >
                                        <PencilIcon />
                                        Edit Profile
                                    </button>
                                </div>

                                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                                    <div style={{
                                        width: '100px',
                                        height: '100px',
                                        borderRadius: '50%',
                                        backgroundColor: '#9a3197',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        margin: '0 auto 20px',
                                        animation: 'pulse 2s ease-in-out infinite'
                                    }}>
                                        <div style={{ width: '48px', height: '48px' }}>
                                            <UserIcon />
                                        </div>
                                    </div>
                                    <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                                        {user?.email}
                                    </h3>
                                    <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
                                        Student Profile
                                    </p>

                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                        gap: '16px',
                                        textAlign: 'left',
                                        marginTop: '32px'
                                    }}>
                                        {[
                                            { label: 'Email', value: user?.email, icon: <MailIcon /> },
                                            { label: 'Role', value: 'Student', icon: <AcademicCapIcon /> },
                                            { label: 'Member Since', value: 'December 2024', icon: <CalendarIcon /> },
                                            { label: 'Tests Completed', value: testResults.length, icon: <CheckCircleIcon /> }
                                        ].map((item, index) => (
                                            <div
                                                key={index}
                                                style={{
                                                    padding: '16px',
                                                    borderRadius: '8px',
                                                    backgroundColor: '#f9fafb',
                                                    border: '1px solid #e5e7eb',
                                                    animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`
                                                }}
                                            >
                                                <div style={{ width: '24px', height: '24px', color: '#9a3197', marginBottom: '8px' }}>{item.icon}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                                                    {item.label}
                                                </div>
                                                <div style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937' }}>
                                                    {item.value}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideInLeft {
          from {
            transform: translateX(-50px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideInRight {
          from {
            transform: translateX(50px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes fadeInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .hide-scrollbar::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }
      `}</style>
        </div>
    );
}
