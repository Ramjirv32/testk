'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { API_URL } from '@/lib/config';
import Link from 'next/link';

interface Answer {
    question_id: number;
    question: string;
    selected_option: number;
}

interface ResultDetail {
    id: string;
    user_id: string;
    email: string;
    name: string;
    age: number;
    student_type: string;
    mbti_type?: string;
    total_score: number;
    max_score: number;
    completed_at: string;
    answers: Answer[];
}

export default function MBTIResultDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user, token, isLoading } = useAuth();
    const [result, setResult] = useState<ResultDetail | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (user && token && params.id) {
            fetchResultDetail();
        }
    }, [user, token, isLoading, params.id]);

    const fetchResultDetail = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/api/admin/test-result/${params.id}?test_type=mvti`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setResult(data.result);
            } else {
                alert('Failed to fetch result details');
                router.push('/admin/mbti');
            }
        } catch (error) {
            console.error('Error fetching result:', error);
            alert('An error occurred');
            router.push('/admin/mbti');
        } finally {
            setLoading(false);
        }
    };

    if (loading || !result) {
        return (
            <AdminLayout>
                <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    const calculateColumnTotals = (colQuestions: number[]) => {
        let aCount = 0;
        let bCount = 0;
        colQuestions.forEach(qId => {
            const answer = result.answers?.find(a => a.question_id === qId);
            if (answer?.selected_option === 0) aCount++;
            if (answer?.selected_option === 1) bCount++;
        });
        return { aCount, bCount };
    };

    const columns = [
        [1, 8, 15, 22, 29, 36, 43, 50, 57, 64],
        [2, 9, 16, 23, 30, 37, 44, 51, 58, 65],
        [3, 10, 17, 24, 31, 38, 45, 52, 59, 66],
        [4, 11, 18, 25, 32, 39, 46, 53, 60, 67],
        [5, 12, 19, 26, 33, 40, 47, 54, 61, 68],
        [6, 13, 20, 27, 34, 41, 48, 55, 62, 69],
        [7, 14, 21, 28, 35, 42, 49, 56, 63, 70]
    ];

    const columnTotals = columns.map(col => calculateColumnTotals(col));

    return (
        <AdminLayout>
            {}
            <div className="card border-0 shadow-sm mb-4" style={{
                background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
                color: 'white',
                borderRadius: '8px'
            }}>
                <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h4 className="mb-1" style={{ fontSize: '20px', fontWeight: '600' }}>MBTI Test Result Details</h4>
                            <p className="mb-0 opacity-75" style={{ fontSize: '13px' }}>{result.email}</p>
                        </div>
                        <Link
                            href="/admin/mbti"
                            className="btn btn-light btn-sm"
                        >
                            ← Back to MBTI Approvals
                        </Link>
                    </div>
                </div>
            </div>

            {}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-3" style={{ backgroundColor: '#fff', borderRadius: '8px' }}>
                    <div className="row">
                        <div className="col-md-3">
                            <strong>Name:</strong> {result.name || 'N/A'}
                        </div>
                        <div className="col-md-3">
                            <strong>Email:</strong> {result.email}
                        </div>
                        <div className="col-md-2">
                            <strong>Age:</strong> {result.age}
                        </div>
                        <div className="col-md-2">
                            <strong>MBTI Type:</strong> <span className="badge" style={{ backgroundColor: '#be185d', fontSize: '14px' }}>{result.mbti_type}</span>
                        </div>
                        <div className="col-md-2">
                            <strong>Completed:</strong> {new Date(result.completed_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>
            </div>

            {}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-3" style={{ fontWeight: 'bold' }}>MBTI Dimension Scores</h5>
                    <div className="row g-3">
                        {(() => {

                            const col1 = calculateColumnTotals([1, 8, 15, 22, 29, 36, 43, 50, 57, 64]);
                            const col23SN = {
                                aCount: calculateColumnTotals([2, 9, 16, 23, 30, 37, 44, 51, 58, 65]).aCount +
                                    calculateColumnTotals([3, 10, 17, 24, 31, 38, 45, 52, 59, 66]).aCount,
                                bCount: calculateColumnTotals([2, 9, 16, 23, 30, 37, 44, 51, 58, 65]).bCount +
                                    calculateColumnTotals([3, 10, 17, 24, 31, 38, 45, 52, 59, 66]).bCount
                            };
                            const col45TF = {
                                aCount: calculateColumnTotals([4, 11, 18, 25, 32, 39, 46, 53, 60, 67]).aCount +
                                    calculateColumnTotals([5, 12, 19, 26, 33, 40, 47, 54, 61, 68]).aCount,
                                bCount: calculateColumnTotals([4, 11, 18, 25, 32, 39, 46, 53, 60, 67]).bCount +
                                    calculateColumnTotals([5, 12, 19, 26, 33, 40, 47, 54, 61, 68]).bCount
                            };
                            const col67JP = {
                                aCount: calculateColumnTotals([6, 13, 20, 27, 34, 41, 48, 55, 62, 69]).aCount +
                                    calculateColumnTotals([7, 14, 21, 28, 35, 42, 49, 56, 63, 70]).aCount,
                                bCount: calculateColumnTotals([6, 13, 20, 27, 34, 41, 48, 55, 62, 69]).bCount +
                                    calculateColumnTotals([7, 14, 21, 28, 35, 42, 49, 56, 63, 70]).bCount
                            };

                            const dimensions = [
                                { left: 'E', right: 'I', leftScore: col1.aCount, rightScore: col1.bCount, color: '#ef4444', label: 'Extraversion / Introversion' },
                                { left: 'S', right: 'N', leftScore: col23SN.aCount, rightScore: col23SN.bCount, color: '#f59e0b', label: 'Sensing / Intuition' },
                                { left: 'T', right: 'F', leftScore: col45TF.aCount, rightScore: col45TF.bCount, color: '#10b981', label: 'Thinking / Feeling' },
                                { left: 'J', right: 'P', leftScore: col67JP.aCount, rightScore: col67JP.bCount, color: '#8b5cf6', label: 'Judging / Perceiving' }
                            ];

                            return dimensions.map((dim, idx) => (
                                <div key={idx} className="col-md-3">
                                    <div className="card border-0" style={{
                                        backgroundColor: dim.color + '15',
                                        borderLeft: `4px solid ${dim.color}`,
                                        borderRadius: '8px'
                                    }}>
                                        <div className="card-body p-2">
                                            <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px', textAlign: 'center' }}>
                                                {dim.label}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: '20px',
                                                        fontWeight: 'bold',
                                                        color: dim.leftScore >= dim.rightScore ? dim.color : '#9ca3af'
                                                    }}>
                                                        {dim.left}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '15px',
                                                        fontWeight: '600',
                                                        color: dim.leftScore >= dim.rightScore ? dim.color : '#6b7280'
                                                    }}>
                                                        {dim.leftScore}
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '12px', color: '#9ca3af' }}>vs</div>
                                                <div style={{ textAlign: 'center' }}>
                                                    <div style={{
                                                        fontSize: '20px',
                                                        fontWeight: 'bold',
                                                        color: dim.rightScore > dim.leftScore ? dim.color : '#9ca3af'
                                                    }}>
                                                        {dim.right}
                                                    </div>
                                                    <div style={{
                                                        fontSize: '15px',
                                                        fontWeight: '600',
                                                        color: dim.rightScore > dim.leftScore ? dim.color : '#6b7280'
                                                    }}>
                                                        {dim.rightScore}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>

            {}
            <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                    <div className="text-center mb-4">
                        <h4 style={{ fontWeight: 'bold', textDecoration: 'underline', color: '#1f2937' }}>Detailed Scoring Sheet</h4>
                    </div>

                    <div className="table-responsive">
                        <table className="table table-bordered text-center mb-0" style={{ fontSize: '16px', borderColor: '#000', border: '2px solid #000' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#d1d5db' }}>
                                    <th colSpan={2} style={{ borderColor: '#000', padding: '12px' }}>Col 1</th>
                                    <th colSpan={2} style={{ borderColor: '#000', padding: '12px' }}>Col 2</th>
                                    <th colSpan={2} style={{ borderColor: '#000', padding: '12px' }}>Col 3</th>
                                    <th colSpan={2} style={{ borderColor: '#000', padding: '12px' }}>Col 4</th>
                                    <th colSpan={2} style={{ borderColor: '#000', padding: '12px' }}>Col 5</th>
                                    <th colSpan={2} style={{ borderColor: '#000', padding: '12px' }}>Col 6</th>
                                    <th colSpan={2} style={{ borderColor: '#000', padding: '12px' }}>Col 7</th>
                                </tr>
                                <tr style={{ backgroundColor: '#e5e7eb' }}>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>A</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>B</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>A</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>B</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>A</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>B</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>A</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>B</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>A</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>B</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>A</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>B</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>A</th>
                                    <th style={{ borderColor: '#000', width: '3.5%', padding: '10px' }}>B</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    const rows = [];
                                    for (let i = 0; i < 10; i++) {
                                        rows.push(
                                            <tr key={i}>
                                                {columns.map((col, colIndex) => {
                                                    const qNum = col[i];
                                                    const answer = result.answers?.find(a => a.question_id === qNum);
                                                    const selectedA = answer?.selected_option === 0;
                                                    const selectedB = answer?.selected_option === 1;

                                                    return (
                                                        <React.Fragment key={colIndex}>
                                                            <td style={{
                                                                borderColor: '#000',
                                                                padding: '12px 6px',
                                                                backgroundColor: selectedA ? '#fef3c7' : 'white',
                                                                position: 'relative'
                                                            }}>
                                                                <span style={{
                                                                    position: 'absolute',
                                                                    left: '2px',
                                                                    top: '1px',
                                                                    fontSize: '10px',
                                                                    color: '#4b5563',
                                                                    fontWeight: '600'
                                                                }}>
                                                                    {qNum}
                                                                </span>
                                                                {selectedA && <span style={{ color: '#000', fontWeight: 'bold', fontSize: '18px' }}></span>}
                                                            </td>
                                                            <td style={{
                                                                borderColor: '#000',
                                                                padding: '12px 6px',
                                                                backgroundColor: selectedB ? '#fef3c7' : 'white'
                                                            }}>
                                                                {selectedB && <span style={{ color: '#000', fontWeight: 'bold', fontSize: '18px' }}></span>}
                                                            </td>
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    }
                                    return rows;
                                })()}

                                {}
                                <tr style={{ backgroundColor: '#d1d5db', fontWeight: 'bold', fontSize: '18px' }}>
                                    {columnTotals.map((total, idx) => (
                                        <React.Fragment key={idx}>
                                            <td style={{ borderColor: '#000', padding: '10px' }}>
                                                {total.aCount}
                                            </td>
                                            <td style={{ borderColor: '#000', padding: '10px' }}>
                                                {total.bCount}
                                            </td>
                                        </React.Fragment>
                                    ))}
                                </tr>

                                {}
                                <tr>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '4px', fontSize: '11px' }}>
                                        <strong>Copy to →</strong>
                                    </td>
                                    <td colSpan={4} style={{ borderColor: '#000', padding: '4px', fontSize: '11px' }}>
                                        <strong>Copy to →</strong>
                                    </td>
                                    <td colSpan={4} style={{ borderColor: '#000', padding: '4px', fontSize: '11px' }}>
                                        <strong>Copy to →</strong>
                                    </td>
                                    <td colSpan={4} style={{ borderColor: '#000', padding: '4px', fontSize: '11px' }}>
                                        <strong>Copy to →</strong>
                                    </td>
                                </tr>

                                {}
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <td style={{ borderColor: '#000', padding: '8px', fontWeight: 'bold' }}>E</td>
                                    <td style={{ borderColor: '#000', padding: '8px', fontWeight: 'bold' }}>I</td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '8px', fontWeight: 'bold' }}>S</td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '8px', fontWeight: 'bold' }}>N</td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '8px', fontWeight: 'bold' }}>T</td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '8px', fontWeight: 'bold' }}>F</td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '8px', fontWeight: 'bold' }}>J</td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '8px', fontWeight: 'bold' }}>P</td>
                                </tr>

                                {}
                                <tr style={{ backgroundColor: '#fef3c7', fontWeight: 'bold', fontSize: '20px' }}>
                                    <td style={{ borderColor: '#000', padding: '12px', color: '#b45309' }}>
                                        {columnTotals[0].aCount}
                                    </td>
                                    <td style={{ borderColor: '#000', padding: '12px', color: '#b45309' }}>
                                        {columnTotals[0].bCount}
                                    </td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '12px', color: '#b45309' }}>
                                        {columnTotals[1].aCount + columnTotals[2].aCount}
                                    </td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '12px', color: '#b45309' }}>
                                        {columnTotals[1].bCount + columnTotals[2].bCount}
                                    </td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '12px', color: '#b45309' }}>
                                        {columnTotals[3].aCount + columnTotals[4].aCount}
                                    </td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '12px', color: '#b45309' }}>
                                        {columnTotals[3].bCount + columnTotals[4].bCount}
                                    </td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '12px', color: '#b45309' }}>
                                        {columnTotals[5].aCount + columnTotals[6].aCount}
                                    </td>
                                    <td colSpan={2} style={{ borderColor: '#000', padding: '12px', color: '#b45309' }}>
                                        {columnTotals[5].bCount + columnTotals[6].bCount}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {}
                    <div className="mt-4 p-3 bg-light rounded" style={{ fontSize: '13px', color: '#555' }}>
                        <strong>How to read:</strong>
                        <ol className="mb-0 mt-2">
                            <li>Copy your answers to this answer key carefully.</li>
                            <li>Count the number of checks in each of the A and B columns, and total at the bottom.</li>
                            <li>Copy the totals for Column 2 to the spaces below the totals for Column 3. Do the same for Columns 4 and 6.</li>
                            <li>Add totals downwards to calculate your totals.</li>
                            <li>Circle the letter with this highest score. This is your type.</li>
                        </ol>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
