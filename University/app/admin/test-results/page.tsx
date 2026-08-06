'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { API_URL } from '@/lib/config';

interface UserAnswer {
    question_id: number;
    question: string;
    selected_option: number;
    correct_option: number;
    is_correct: boolean;
}

interface TestResult {
    id: string;
    user_id: string;
    email: string;
    test_type: string;
    mbti_type?: string;
    top_category?: string;
    interpretation?: string;
    age: number;
    student_type: string;
    answers?: UserAnswer[];
    total_score?: number;
    max_score?: number;
    percentage: number;
    completed_at: string;

    practical_score?: number;
    enterprising_score?: number;
    social_score?: number;
    creative_score?: number;
    investigative_score?: number;
    organisational_score?: number;
}

export default function AdminTestResults() {
    const router = useRouter();
    const { user, token, isLoading, isAdmin } = useAuth();
    const [testType, setTestType] = useState<'mvti' | 'cognitive' | 'pescio' | 'psychometric'>('mvti');
    const [results, setResults] = useState<TestResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);

    useEffect(() => {
        if (!isLoading && (!user || !isAdmin())) {
            router.push('/admin/login');
            return;
        }

        if (user && token && isAdmin()) {
            fetchResults();
        }
    }, [user, token, isLoading, testType]);

    const fetchResults = async () => {
        setLoading(true);
        try {
            let endpoint = `${API_URL}/api/admin/test-results?test_type=${testType}`;

            if (testType === 'pescio') {
                endpoint = `${API_URL}/api/admin/pescio/results`;
            } else if (testType === 'psychometric') {
                endpoint = `${API_URL}/api/admin/psychometric/results`;
            }

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();

                let normalizedResults = data.results || [];

                setResults(normalizedResults);
            }
        } catch (error) {
            console.error('Error fetching test results:', error);
        } finally {
            setLoading(false);
        }
    };

    if (isLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="text-2xl">Loading...</div>
            </div>
        );
    }

    const getOptionLabel = (index: number, options: string[] = ['A', 'B', 'C', 'D', 'E']) => {
        return options[index] || String.fromCharCode(65 + index);
    };

    const getMBTIDistribution = () => {
        if (testType !== 'mvti') return {};
        const distribution: { [key: string]: number } = {};
        results.forEach(result => {
            if (result.mbti_type) {
                distribution[result.mbti_type] = (distribution[result.mbti_type] || 0) + 1;
            }
        });
        return distribution;
    };

    const getPESCIODistribution = () => {
        if (testType !== 'pescio') return {};
        const distribution: { [key: string]: number } = {};
        results.forEach(result => {
            if (result.top_category) {
                distribution[result.top_category] = (distribution[result.top_category] || 0) + 1;
            }
        });
        return distribution;
    };

    const mbtiDistribution = getMBTIDistribution();
    const topMBTITypes = Object.entries(mbtiDistribution)
        .sort((a, b) => b[1] - a[1]);

    const pescioDistribution = getPESCIODistribution();
    const topPESCIOCategories = Object.entries(pescioDistribution)
        .sort((a, b) => b[1] - a[1]);

    const exportToCSV = () => {
        const headers = testType === 'mvti'
            ? ['Email', 'Age', 'Student Type', 'MBTI Type', 'Questions Answered', 'Completed At']
            : ['Email', 'Age', 'Student Type', 'Score', 'Percentage', 'Status', 'Completed At'];

        const rows = results.map(result => {
            if (testType === 'mvti') {
                return [
                    result.email,
                    result.age,
                    result.student_type,
                    result.mbti_type || 'N/A',
                    `${result.total_score}/${result.max_score}`,
                    new Date(result.completed_at).toLocaleString()
                ];
            } else {
                return [
                    result.email,
                    result.age,
                    result.student_type,
                    `${result.total_score}/${result.max_score}`,
                    `${result.percentage.toFixed(1)}%`,
                    result.percentage >= 50 ? 'Passed' : 'Failed',
                    new Date(result.completed_at).toLocaleString()
                ];
            }
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${testType}_test_results_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 px-4">
            <div className="max-w-7xl mx-auto">
                {}
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">Test Results Management</h1>
                            <p className="text-gray-600 mt-1">View and analyze student test submissions</p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={exportToCSV}
                                disabled={results.length === 0}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Export CSV
                            </button>
                            <Link
                                href="/admin"
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                            >
                                ← Back to Admin
                            </Link>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {[
                            { id: 'mvti', label: 'MVTI (Age ≥ 18)', color: 'purple' },
                            { id: 'cognitive', label: 'Cognitive (Age 16-17)', color: 'blue' },
                            { id: 'pescio', label: 'PESCIO (All Ages)', color: 'orange' },
                            { id: 'psychometric', label: 'Psychometric (Age ≤ 15)', color: 'pink' }
                        ].map((test) => (
                            <button
                                key={test.id}
                                onClick={() => setTestType(test.id as any)}
                                className={`px-4 py-2 rounded-lg font-semibold transition text-sm ${testType === test.id
                                    ? `bg-${test.color}-600 text-white`
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                    }`}
                                style={{
                                    backgroundColor: testType === test.id ? undefined : '#e5e7eb',
                                    color: testType === test.id ? 'white' : '#374151'
                                }}
                            >
                                {test.label}
                            </button>
                        ))}
                    </div>
                </div>

                {}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-sm text-gray-600 mb-1">Total Submissions</div>
                        <div className="text-3xl font-bold text-gray-800">{results.length}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-sm text-gray-600 mb-1">Average Score</div>
                        <div className="text-3xl font-bold text-blue-600">
                            {results.length > 0
                                ? (results.reduce((sum, r) => sum + r.percentage, 0) / results.length).toFixed(1)
                                : 0}%
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-sm text-gray-600 mb-1">Pass Rate</div>
                        <div className="text-3xl font-bold text-green-600">
                            {results.length > 0
                                ? ((results.filter(r => r.percentage >= 50).length / results.length) * 100).toFixed(1)
                                : 0}%
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="text-sm text-gray-600 mb-1">Highest Score</div>
                        <div className="text-3xl font-bold text-purple-600">
                            {results.length > 0
                                ? Math.max(...results.map(r => r.percentage)).toFixed(1)
                                : 0}%
                        </div>
                    </div>
                </div>

                {}
                {testType === 'mvti' && topMBTITypes.length > 0 && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">MBTI Type Distribution</h2>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            {topMBTITypes.map(([type, count]) => (
                                <div key={type} className="bg-purple-50 rounded-lg p-4 border-2 border-purple-200">
                                    <div className="text-3xl font-bold text-purple-600 mb-2">{type}</div>
                                    <div className="text-sm text-gray-600">
                                        {count} student{count !== 1 ? 's' : ''}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {((count / results.length) * 100).toFixed(1)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                        {Object.keys(mbtiDistribution).length > 5 && (
                            <div className="mt-4 text-sm text-gray-600">
                                Showing top 5 of {Object.keys(mbtiDistribution).length} personality types
                            </div>
                        )}
                    </div>
                )}

                {}
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Student Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Age
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Score
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Percentage
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {testType === 'mvti' ? 'Personality' : testType === 'pescio' ? 'Top Interest' : 'Result'}
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Completed At
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {results.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                            No test results found for {testType.toUpperCase()} test
                                        </td>
                                    </tr>
                                ) : (
                                    results.map((result) => (
                                        <tr key={result.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{result.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{result.age}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${result.student_type === 'minor'
                                                    ? 'bg-purple-100 text-purple-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {result.student_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-semibold">
                                                    {result.total_score}/{result.max_score}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {result.test_type === 'mvti' && result.mbti_type ? (
                                                    <div className="text-sm font-bold text-purple-600">
                                                        {result.mbti_type}
                                                    </div>
                                                ) : (
                                                    <div className="text-sm font-bold text-gray-900">
                                                        {result.percentage.toFixed(1)}%
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {testType === 'mvti' ? (
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                                        {result.mbti_type || 'N/A'}
                                                    </span>
                                                ) : testType === 'pescio' ? (
                                                    <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">
                                                        {result.top_category || 'N/A'}
                                                    </span>
                                                ) : (
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${result.percentage >= 50
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {result.percentage >= 50 ? 'Passed' : 'Failed'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(result.completed_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => setSelectedResult(result)}
                                                    className="text-blue-600 hover:text-blue-900 font-medium"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {}
            {selectedResult && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Test Details</h2>
                                <p className="text-gray-600">{selectedResult.email}</p>
                            </div>
                            <button
                                onClick={() => setSelectedResult(null)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Total Score</div>
                                    <div className="text-2xl font-bold">
                                        {selectedResult.total_score !== undefined ? `${selectedResult.total_score}/${selectedResult.max_score}` : 'N/A'}
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Percentage</div>
                                    <div className="text-2xl font-bold text-blue-600">{selectedResult.percentage.toFixed(1)}%</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Age</div>
                                    <div className="text-2xl font-bold">{selectedResult.age}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600">Type</div>
                                    <div className="text-2xl font-bold capitalize">{selectedResult.student_type}</div>
                                </div>
                            </div>

                            {}
                            {selectedResult.test_type === 'pescio' && (
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-4 text-orange-700">Category Score Breakdown</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {[
                                            { label: 'Practical (P)', score: selectedResult.practical_score, color: 'orange' },
                                            { label: 'Investigative (I)', score: selectedResult.investigative_score, color: 'blue' },
                                            { label: 'Creative (C)', score: selectedResult.creative_score, color: 'pink' },
                                            { label: 'Social (S)', score: selectedResult.social_score, color: 'green' },
                                            { label: 'Enterprising (E)', score: selectedResult.enterprising_score, color: 'purple' },
                                            { label: 'Organisational (O)', score: selectedResult.organisational_score, color: 'gray' }
                                        ].map((cat) => (
                                            <div key={cat.label} className={`bg-${cat.color}-50 p-4 rounded-lg border border-${cat.color}-200`}>
                                                <div className="text-xs text-gray-500 uppercase font-bold">{cat.label}</div>
                                                <div className="text-3xl font-bold">{cat.score || 0}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-4 bg-orange-100 rounded-lg border border-orange-200">
                                        <h4 className="font-bold text-orange-800">Top Interest: {selectedResult.top_category}</h4>
                                        <p className="text-sm mt-2 text-gray-700 whitespace-pre-line">{selectedResult.interpretation}</p>
                                    </div>
                                </div>
                            )}

                            {}
                            {selectedResult.test_type === 'psychometric' && (
                                <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
                                    <h3 className="text-xl font-bold mb-2 text-green-800">Assessment Interpretation</h3>
                                    <p className="text-gray-800 italic whitespace-pre-line">{selectedResult.interpretation}</p>
                                </div>
                            )}

                            {}
                            {selectedResult.test_type === 'mvti' && (
                                <div className="mb-6">
                                    <h3 className="text-xl font-bold mb-4">MBTI Scoring Table</h3>
                                    <div className="overflow-x-auto border-2 border-gray-300 rounded-lg">
                                        <table className="min-w-full bg-white text-sm">
                                            <thead>
                                                <tr className="bg-gray-200">
                                                    <th className="border border-gray-300 px-2 py-2"></th>
                                                    <th className="border border-gray-300 px-2 py-2" colSpan={2}>Col 1</th>
                                                    <th className="border border-gray-300 px-2 py-2" colSpan={2}>Col 2</th>
                                                    <th className="border border-gray-300 px-2 py-2" colSpan={2}>Col 3</th>
                                                    <th className="border border-gray-300 px-2 py-2" colSpan={2}>Col 4</th>
                                                    <th className="border border-gray-300 px-2 py-2" colSpan={2}>Col 5</th>
                                                    <th className="border border-gray-300 px-2 py-2" colSpan={2}>Col 6</th>
                                                    <th className="border border-gray-300 px-2 py-2" colSpan={2}>Col 7</th>
                                                </tr>
                                                <tr className="bg-gray-100">
                                                    <th className="border border-gray-300 px-2 py-1"></th>
                                                    {[1, 2, 3, 4, 5, 6, 7].map(col => (
                                                        <React.Fragment key={col}>
                                                            <th className="border border-gray-300 px-2 py-1 text-xs">A</th>
                                                            <th className="border border-gray-300 px-2 py-1 text-xs">B</th>
                                                        </React.Fragment>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: 10 }, (_, rowIndex) => (
                                                    <tr key={rowIndex}>
                                                        <td className="border border-gray-300 px-2 py-1 bg-gray-100 font-semibold text-center">
                                                            {rowIndex + 1}
                                                        </td>
                                                        {[0, 1, 2, 3, 4, 5, 6].map(colIndex => {
                                                            const questionNum = rowIndex * 7 + colIndex + 1;
                                                            const answer = selectedResult.answers?.find(a => a.question_id === questionNum);
                                                            const selectedOption = answer?.selected_option;

                                                            return (
                                                                <React.Fragment key={colIndex}>
                                                                    <td className={`border border-gray-300 px-2 py-1 text-center ${selectedOption === 0 ? 'bg-blue-200 font-bold' : ''}`}>
                                                                        {questionNum}
                                                                    </td>
                                                                    <td className={`border border-gray-300 px-2 py-1 text-center ${selectedOption === 1 ? 'bg-blue-200 font-bold' : ''}`}>
                                                                        {}
                                                                    </td>
                                                                </React.Fragment>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                                {}
                                                <tr className="bg-gray-100 font-semibold">
                                                    <td className="border border-gray-300 px-2 py-2 text-center">Total</td>
                                                    {[0, 1, 2, 3, 4, 5, 6].map(colIndex => {
                                                        const colAnswers = selectedResult.answers?.filter((a) =>
                                                            Math.floor((a.question_id - 1) / 7) < 10 && (a.question_id - 1) % 7 === colIndex
                                                        ) || [];
                                                        const aCount = colAnswers.filter(a => a.selected_option === 0).length;
                                                        const bCount = colAnswers.filter(a => a.selected_option === 1).length;

                                                        return (
                                                            <React.Fragment key={colIndex}>
                                                                <td className="border border-gray-300 px-2 py-2 text-center bg-yellow-100">
                                                                    {aCount}
                                                                </td>
                                                                <td className="border border-gray-300 px-2 py-2 text-center bg-yellow-100">
                                                                    {bCount}
                                                                </td>
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tr>
                                                {}
                                                <tr className="bg-purple-100 font-bold">
                                                    <td className="border border-gray-300 px-2 py-2 text-center">Type</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center" colSpan={2}>E / I</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center" colSpan={2}>S / N</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center" colSpan={2}>T / F</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center" colSpan={2}>T / F</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center" colSpan={2}>J / P</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center" colSpan={2}>J / P</td>
                                                    <td className="border border-gray-300 px-2 py-2 text-center" colSpan={2}>E / I</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                                        <h4 className="font-bold mb-2">How to Read:</h4>
                                        <ul className="text-sm space-y-1 list-disc list-inside">
                                            <li><strong>Highlighted cells</strong> show the student's selected answers</li>
                                            <li><strong>Column A</strong> represents the first option, <strong>Column B</strong> represents the second option</li>
                                            <li><strong>Totals</strong> show count of A and B selections per column</li>
                                            <li><strong>Type row</strong> shows which personality dimension each column measures</li>
                                            <li><strong>Final Type:</strong> <span className="text-2xl font-bold text-purple-600 ml-2">{selectedResult.mbti_type}</span></li>
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {/* Answers - Commented out for PESCIO and Psychometric */}
                            {selectedResult.answers && selectedResult.answers.length > 0 &&
                                testType !== 'pescio' && testType !== 'psychometric' && (
                                    <>
                                        <h3 className="text-xl font-bold mb-4">Question-wise Answers</h3>
                                        <div className="space-y-4">
                                            {selectedResult.answers.map((answer) => (
                                                <div
                                                    key={answer.question_id}
                                                    className={`border-2 rounded-lg p-4 ${answer.is_correct ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                                        }`}
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-gray-700 mb-1">
                                                                Q{answer.question_id}: {answer.question}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            {answer.is_correct ? (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                                                    ✓ Correct
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-800">
                                                                    ✗ Wrong
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                                        <div>
                                                            <span className="text-gray-600">Student's Answer:</span>
                                                            <span className={`ml-2 font-semibold ${answer.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                                                                Option {getOptionLabel(answer.selected_option)}
                                                            </span>
                                                        </div>
                                                        {answer.correct_option !== undefined && !answer.is_correct && (
                                                            <div>
                                                                <span className="text-gray-600">Correct Answer:</span>
                                                                <span className="ml-2 font-semibold text-green-700">
                                                                    Option {getOptionLabel(answer.correct_option)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
