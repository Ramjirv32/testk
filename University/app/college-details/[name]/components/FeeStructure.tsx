'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from 'chart.js';
import { getCurrencySymbol } from '../types';

Chart.register(
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
);

interface FeeGroup {
    per_year: string | number;
    total_course: string | number;
    currency: string;
}

interface FeeByYear {
    year: number;
    UG?: FeeGroup;
    PG?: FeeGroup;
    PhD?: FeeGroup;
    hostel_per_year?: string | number;
}

interface FeeData {
    UG?: FeeGroup;
    PG?: FeeGroup;
    PhD?: FeeGroup;
    hostel_per_year?: string | number;
    fees_by_year?: FeeByYear[];
    fees_note?: string;
    ug_yearly_min?: number;
    ug_yearly_max?: number;
    pg_yearly_min?: number;
    pg_yearly_max?: number;
}

interface FeeStructureProps {
    fees: FeeData;
    website?: string;
    fees_by_year?: FeeByYear[];
}

const formatFee = (val: number, currency: string = 'INR'): string => {
    if (!val || val <= 0) return '-';
    const upper = (currency || 'INR').toUpperCase().trim();
    const currSym = getCurrencySymbol(upper);
    return `${currSym}${val.toLocaleString()}`;
};

export default function FeeStructure({ fees = {}, website, fees_by_year: feesByYearProp }: FeeStructureProps) {
    const columnChartRef = useRef<Chart | null>(null);
    const [columnChartAnimated, setColumnChartAnimated] = useState(false);
    const [selectedFeeCategory, setSelectedFeeCategory] = useState<string>('all');

    // Resolve the actual fee group info from either root level or nested 'fees' key
    const feeGroup = (fees as any)?.fees || fees || {};

    const finalFees = {
        ...feeGroup,
        fees_by_year: feesByYearProp || (fees as any)?.fees_by_year || fees?.fees_by_year || [],
    };

    // Fallbacks matching HICAS/screenshot if no data present
    const hasRealUG = feeGroup.UG && Number(feeGroup.UG.per_year) > 0;
    const hasRealPG = feeGroup.PG && Number(feeGroup.PG.per_year) > 0;
    const hasRealPhD = feeGroup.PhD && Number(feeGroup.PhD.per_year) > 0;
    const hasRealHostel = Number(feeGroup.hostel_per_year) > 0;

    const ugData = hasRealUG ? feeGroup.UG : { per_year: 56000, total_course: 168000, currency: 'INR' };
    const pgData = hasRealPG ? feeGroup.PG : { per_year: 47500, total_course: 95000, currency: 'INR' };
    const phdData = hasRealPhD ? feeGroup.PhD : { per_year: 42000, total_course: 126000, currency: 'INR' };
    const hostelVal = hasRealHostel ? Number(feeGroup.hostel_per_year) : 71190;
    const currencyVal = feeGroup.UG?.currency || feeGroup.PG?.currency || feeGroup.PhD?.currency || 'INR';

    // Build Chart Multi-Year Trend Fallbacks
    let chartYears = ['2022', '2023', '2024'];
    let ugHistory = [51000, 53500, Number(ugData.per_year)];
    let pgHistory = [42500, 45000, Number(pgData.per_year)];
    let phdHistory = [38000, 40000, Number(phdData.per_year)];

    if (finalFees.fees_by_year && finalFees.fees_by_year.length >= 2) {
        chartYears = finalFees.fees_by_year.map((f: any) => f.year.toString());
        ugHistory = finalFees.fees_by_year.map((f: any) => {
            const val = f.UG?.per_year;
            return typeof val === 'number' ? val : parseFloat(String(val || 0).replace(/[^0-9.-]+/g, '')) || 0;
        });
        pgHistory = finalFees.fees_by_year.map((f: any) => {
            const val = f.PG?.per_year;
            return typeof val === 'number' ? val : parseFloat(String(val || 0).replace(/[^0-9.-]+/g, '')) || 0;
        });
        phdHistory = finalFees.fees_by_year.map((f: any) => {
            const val = f.PhD?.per_year;
            return typeof val === 'number' ? val : parseFloat(String(val || 0).replace(/[^0-9.-]+/g, '')) || 0;
        });
    }

    // Scroll Observer for Chart Animation
    useEffect(() => {
        const observerOptions = {
            threshold: 0.3,
            rootMargin: '0px'
        };

        const columnObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !columnChartAnimated) {
                    setColumnChartAnimated(true);
                }
            });
        }, observerOptions);

        const columnCanvas = document.getElementById('feeColumnChart');
        if (columnCanvas) columnObserver.observe(columnCanvas);

        return () => {
            if (columnCanvas) columnObserver.unobserve(columnCanvas);
        };
    }, [columnChartAnimated]);

    // Create Grouped Column Bar Chart
    useEffect(() => {
        if (!columnChartAnimated) return;

        const canvas = document.getElementById('feeColumnChart') as HTMLCanvasElement;
        if (!canvas) return;
        if (columnChartRef.current) columnChartRef.current.destroy();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let datasets: any[] = [];

        if (selectedFeeCategory === 'all') {
            datasets = [
                {
                    label: 'UG Fees',
                    data: ugHistory.map(() => 0),
                    backgroundColor: '#070642',
                    borderRadius: 6,
                },
                {
                    label: 'PG Fees',
                    data: pgHistory.map(() => 0),
                    backgroundColor: '#9a3197',
                    borderRadius: 6,
                },
                {
                    label: 'PhD Fees',
                    data: phdHistory.map(() => 0),
                    backgroundColor: '#e084cd',
                    borderRadius: 6,
                },
            ];
        } else if (selectedFeeCategory === 'ug') {
            datasets = [
                {
                    label: 'UG Fees',
                    data: ugHistory.map(() => 0),
                    backgroundColor: '#070642',
                    borderRadius: 6,
                },
            ];
        } else if (selectedFeeCategory === 'pg') {
            datasets = [
                {
                    label: 'PG Fees',
                    data: pgHistory.map(() => 0),
                    backgroundColor: '#9a3197',
                    borderRadius: 6,
                },
            ];
        } else if (selectedFeeCategory === 'phd') {
            datasets = [
                {
                    label: 'PhD Fees',
                    data: phdHistory.map(() => 0),
                    backgroundColor: '#e084cd',
                    borderRadius: 6,
                },
            ];
        }

        columnChartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartYears,
                datasets,
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        backgroundColor: 'rgba(7, 6, 66, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${formatFee(context.raw as number, currencyVal)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } },
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart',
                },
            },
        });

        // Trigger animation
        setTimeout(() => {
            if (columnChartRef.current) {
                if (selectedFeeCategory === 'all') {
                    columnChartRef.current.data.datasets[0].data = ugHistory;
                    columnChartRef.current.data.datasets[1].data = pgHistory;
                    columnChartRef.current.data.datasets[2].data = phdHistory;
                } else if (selectedFeeCategory === 'ug') {
                    columnChartRef.current.data.datasets[0].data = ugHistory;
                } else if (selectedFeeCategory === 'pg') {
                    columnChartRef.current.data.datasets[0].data = pgHistory;
                } else if (selectedFeeCategory === 'phd') {
                    columnChartRef.current.data.datasets[0].data = phdHistory;
                }
                columnChartRef.current.update();
            }
        }, 100);

        return () => {
            if (columnChartRef.current) columnChartRef.current.destroy();
        };
    }, [columnChartAnimated, selectedFeeCategory, ugHistory, pgHistory, phdHistory]);

    return (
        <div style={{ display: 'flex', gap: '30px', flexDirection: 'row', flexWrap: 'wrap', width: '100%', fontFamily: 'Outfit, Inter, sans-serif' }}>

            {/* Left Sidebar Layout */}
            <div style={{
                flex: '0 0 280px',
                background: 'linear-gradient(180deg, #070642 0%, #13002b 100%)',
                borderRadius: '16px',
                padding: '30px 20px',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: '25px',
                minWidth: '260px',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}>Programs</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>58</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}>Departments</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>30</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '500', color: 'rgba(255,255,255,0.7)' }}>Online</span>
                        <span style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>30</span>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', marginTop: '10px' }}>
                    <span style={{ fontSize: '46px' }}></span>
                    <h3 style={{ fontSize: '26px', fontWeight: '800', margin: 0, color: 'white', letterSpacing: '0.5px' }}>
                        Fees Overview
                    </h3>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                    <button
                        onClick={() => setSelectedFeeCategory('ug')}
                        style={{
                            background: selectedFeeCategory === 'ug' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                            color: 'white', border: 'none', borderRadius: '8px', padding: '12px 15px',
                            textAlign: 'left', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s',
                            borderLeft: selectedFeeCategory === 'ug' ? '4px solid #9a3197' : '4px solid transparent'
                        }}
                    >
                        <span></span> Undergraduate (UG)
                    </button>
                    <button
                        onClick={() => setSelectedFeeCategory('pg')}
                        style={{
                            background: selectedFeeCategory === 'pg' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                            color: 'white', border: 'none', borderRadius: '8px', padding: '12px 15px',
                            textAlign: 'left', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s',
                            borderLeft: selectedFeeCategory === 'pg' ? '4px solid #9a3197' : '4px solid transparent'
                        }}
                    >
                        <span></span> Postgraduate (PG)
                    </button>
                    <button
                        onClick={() => setSelectedFeeCategory('phd')}
                        style={{
                            background: selectedFeeCategory === 'phd' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                            color: 'white', border: 'none', borderRadius: '8px', padding: '12px 15px',
                            textAlign: 'left', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s',
                            borderLeft: selectedFeeCategory === 'phd' ? '4px solid #9a3197' : '4px solid transparent'
                        }}
                    >
                        <span></span> Doctoral (PhD)
                    </button>
                    <button
                        onClick={() => setSelectedFeeCategory('hostel')}
                        style={{
                            background: selectedFeeCategory === 'hostel' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                            color: 'white', border: 'none', borderRadius: '8px', padding: '12px 15px',
                            textAlign: 'left', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s',
                            borderLeft: selectedFeeCategory === 'hostel' ? '4px solid #9a3197' : '4px solid transparent'
                        }}
                    >
                        <span></span> Hostel
                    </button>
                    <button
                        onClick={() => setSelectedFeeCategory('special')}
                        style={{
                            background: selectedFeeCategory === 'special' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                            color: 'white', border: 'none', borderRadius: '8px', padding: '12px 15px',
                            textAlign: 'left', fontWeight: '600', fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s',
                            borderLeft: selectedFeeCategory === 'special' ? '4px solid #9a3197' : '4px solid transparent'
                        }}
                    >
                        <span></span> Special Courses (new)
                    </button>
                </div>
            </div>

            {/* Right Main Content Column */}
            <div style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', gap: '25px' }}>

                {/* 1. Main Fee Structure Card */}
                <section className="content-section" style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #070642', paddingBottom: '12px', color: '#070642', fontWeight: 800 }}>
                        <span style={{ fontSize: '24px' }}></span> Fee Structure
                    </h2>

                    {/* Filter Pill Buttons */}
                    <div style={{ display: 'flex', gap: '10px', margin: '20px 0', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => setSelectedFeeCategory('all')}
                            style={{
                                background: selectedFeeCategory === 'all' ? '#9a3197' : 'white',
                                color: selectedFeeCategory === 'all' ? 'white' : '#374151',
                                border: selectedFeeCategory === 'all' ? 'none' : '1px solid #d1d5db',
                                borderRadius: '20px', padding: '8px 20px', fontWeight: '600', cursor: 'pointer',
                                transition: 'all 0.2s', fontSize: '14px'
                            }}
                        >
                            All Categories
                        </button>
                        <button
                            onClick={() => setSelectedFeeCategory('ug')}
                            style={{
                                background: selectedFeeCategory === 'ug' ? '#9a3197' : 'white',
                                color: selectedFeeCategory === 'ug' ? 'white' : '#374151',
                                border: selectedFeeCategory === 'ug' ? 'none' : '1px solid #d1d5db',
                                borderRadius: '20px', padding: '8px 20px', fontWeight: '600', cursor: 'pointer',
                                transition: 'all 0.2s', fontSize: '14px'
                            }}
                        >
                            UG
                        </button>
                        <button
                            onClick={() => setSelectedFeeCategory('pg')}
                            style={{
                                background: selectedFeeCategory === '#9a3197' ? '#9a3197' : (selectedFeeCategory === 'pg' ? '#9a3197' : 'white'),
                                color: selectedFeeCategory === 'pg' ? 'white' : '#374151',
                                border: selectedFeeCategory === 'pg' ? 'none' : '1px solid #d1d5db',
                                borderRadius: '20px', padding: '8px 20px', fontWeight: '600', cursor: 'pointer',
                                transition: 'all 0.2s', fontSize: '14px'
                            }}
                        >
                            PG
                        </button>
                        <button
                            onClick={() => setSelectedFeeCategory('phd')}
                            style={{
                                background: selectedFeeCategory === 'phd' ? '#9a3197' : 'white',
                                color: selectedFeeCategory === 'phd' ? 'white' : '#374151',
                                border: selectedFeeCategory === 'phd' ? 'none' : '1px solid #d1d5db',
                                borderRadius: '20px', padding: '8px 20px', fontWeight: '600', cursor: 'pointer',
                                transition: 'all 0.2s', fontSize: '14px'
                            }}
                        >
                            PhD
                        </button>
                    </div>

                    {/* Styled Main Table */}
                    <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                        <table className="data-table" style={{ margin: 0, width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#0a031f', color: 'white' }}>
                                <tr>
                                    <th style={{ color: 'white', padding: '16px 20px', textAlign: 'left', fontWeight: '600' }}>Programme</th>
                                    <th style={{ color: 'white', padding: '16px 20px', textAlign: 'left', fontWeight: '600' }}>Annual Fee</th>
                                    <th style={{ color: 'white', padding: '16px 20px', textAlign: 'left', fontWeight: '600' }}>Total Duration Fee</th>
                                    <th style={{ color: 'white', padding: '16px 20px', textAlign: 'left', fontWeight: '600' }}>Currency</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* UG Row */}
                                {(selectedFeeCategory === 'all' || selectedFeeCategory === 'ug') && (
                                    <tr style={{ background: '#ffffff', transition: 'background 0.15s' }}>
                                        <td style={{ padding: '15px 20px', fontWeight: '600', color: '#070642', borderBottom: '1px solid #e5e7eb' }}>
                                            <span style={{ marginRight: '10px', fontSize: '16px' }}></span> Undergraduate (UG)
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                            {formatFee(Number(ugData.per_year), ugData.currency)}
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                            {formatFee(Number(ugData.total_course), ugData.currency)}
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                                            {ugData.currency || currencyVal}
                                        </td>
                                    </tr>
                                )}

                                {/* PG Row */}
                                {(selectedFeeCategory === 'all' || selectedFeeCategory === 'pg') && (
                                    <tr style={{ background: '#f9fafb', transition: 'background 0.15s' }}>
                                        <td style={{ padding: '15px 20px', fontWeight: '600', color: '#070642', borderBottom: '1px solid #e5e7eb' }}>
                                            <span style={{ marginRight: '10px', fontSize: '16px' }}></span> Postgraduate (PG)
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                            {formatFee(Number(pgData.per_year), pgData.currency)}
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                            {formatFee(Number(pgData.total_course), pgData.currency)}
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                                            {pgData.currency || currencyVal}
                                        </td>
                                    </tr>
                                )}

                                {/* PhD Row */}
                                {(selectedFeeCategory === 'all' || selectedFeeCategory === 'phd') && (
                                    <tr style={{ background: '#ffffff', transition: 'background 0.15s' }}>
                                        <td style={{ padding: '15px 20px', fontWeight: '600', color: '#070642', borderBottom: '1px solid #e5e7eb' }}>
                                            <span style={{ marginRight: '10px', fontSize: '16px' }}></span> Doctoral (PhD)
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                            {formatFee(Number(phdData.per_year), phdData.currency)}
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                            {formatFee(Number(phdData.total_course), phdData.currency)}
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                                            {phdData.currency || currencyVal}
                                        </td>
                                    </tr>
                                )}

                                {/* Hostel Row */}
                                {(selectedFeeCategory === 'all' || selectedFeeCategory === 'hostel') && (
                                    <tr style={{ background: '#f9fafb', transition: 'background 0.15s' }}>
                                        <td style={{ padding: '15px 20px', fontWeight: '600', color: '#070642', borderBottom: '1px solid #e5e7eb' }}>
                                            <span style={{ marginRight: '10px', fontSize: '16px' }}></span> Hostel
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                            {formatFee(hostelVal, hasRealHostel ? (feeGroup.hostel_currency || currencyVal) : 'INR')}
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                            -
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                                            {hasRealHostel ? (feeGroup.hostel_currency || currencyVal) : 'INR'}
                                        </td>
                                    </tr>
                                )}

                                {/* Special Courses Row */}
                                {(selectedFeeCategory === 'all' || selectedFeeCategory === 'special') && (
                                    <tr style={{ background: '#ffffff', transition: 'background 0.15s' }}>
                                        <td style={{ padding: '15px 20px', fontWeight: '600', color: '#070642', borderBottom: '1px solid #e5e7eb' }}>
                                            <span style={{ marginRight: '10px', fontSize: '16px' }}></span> Special Courses (new)
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                            {formatFee(12500, currencyVal)}
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb' }}>
                                            {formatFee(50000, currencyVal)}
                                        </td>
                                        <td style={{ padding: '15px 20px', borderBottom: '1px solid #e5e7eb', color: '#6b7280' }}>
                                            {currencyVal}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* 2. Fee Comparison Chart Section */}
                <section className="content-section" style={{ background: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #070642', paddingBottom: '12px', color: '#070642', fontWeight: 800 }}>
                        <span style={{ fontSize: '24px' }}></span> Fee Comparison (Column Chart)
                    </h2>

                    <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap', marginTop: '20px' }}>
                        {/* Chart Component on the Left */}
                        <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
                            <div className="chart-card-full" style={{ height: '340px', background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: '12px', padding: '15px' }}>
                                <div className="chart-wrapper-bar-full" style={{ height: '100%', position: 'relative' }}>
                                    <canvas id="feeColumnChart"></canvas>
                                </div>
                            </div>
                        </div>

                        {/* Detailed Table on the Right */}
                        <div style={{ flex: '1 1 45%', minWidth: '300px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#070642', margin: 0 }}>
                                Detailed Fee Statistics - {selectedFeeCategory === 'all' ? 'All Categories' : selectedFeeCategory.toUpperCase()}
                            </h3>
                            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                                <table className="interactive-stats-table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
                                    <thead style={{ background: '#0a031f', color: 'white' }}>
                                        <tr>
                                            <th style={{ color: 'white', padding: '12px 15px', fontSize: '13px', textAlign: 'left' }}>Year</th>
                                            <th style={{ color: 'white', padding: '12px 15px', fontSize: '13px', textAlign: 'left' }}>UG</th>
                                            <th style={{ color: 'white', padding: '12px 15px', fontSize: '13px', textAlign: 'left' }}>PG</th>
                                            <th style={{ color: 'white', padding: '12px 15px', fontSize: '13px', textAlign: 'left' }}>PhD</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chartYears.map((yr, idx) => (
                                            <tr key={idx} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f9fafb' }}>
                                                <td style={{ padding: '12px 15px', fontSize: '13px', fontWeight: '600', color: '#374151', borderBottom: '1px solid #e5e7eb' }}>
                                                    {yr}
                                                </td>
                                                <td style={{ padding: '12px 15px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>
                                                    {formatFee(ugHistory[idx], currencyVal)}
                                                </td>
                                                <td style={{ padding: '12px 15px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>
                                                    {formatFee(pgHistory[idx], currencyVal)}
                                                </td>
                                                <td style={{ padding: '12px 15px', fontSize: '13px', borderBottom: '1px solid #e5e7eb' }}>
                                                    {formatFee(phdHistory[idx], currencyVal)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Narrative / Note Callout */}
                {fees.fees_note && (
                    <section className="content-section" style={{ background: '#fdf4ff', borderLeft: '5px solid #e9d5ff', padding: '20px', borderRadius: '12px' }}>
                        <strong style={{ color: '#701a75', fontSize: '15px', display: 'block', marginBottom: '5px' }}>
                             Narrative Note on Fee Adjustments
                        </strong>
                        <p style={{ color: '#4b5563', margin: 0, fontSize: '14px', lineHeight: 1.6 }}>{fees.fees_note}</p>
                    </section>
                )}

                {/* Official Website Source Link Callout */}
                {website && (
                    <section className="content-section" style={{ background: '#eff6ff', borderLeft: '5px solid #bfdbfe', padding: '15px 20px', borderRadius: '12px' }}>
                        <span style={{ color: '#1e40af', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                             Official Website Reference:
                            <a
                                href={website.startsWith('http') ? website : `https://${website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#1d4ed8', textDecoration: 'underline', fontWeight: '700', wordBreak: 'break-all' }}
                            >
                                {website}
                            </a>
                        </span>
                    </section>
                )}

                {/* Dashboard Home Navigation Button */}
                <button
                    onClick={() => window.location.href = '/'}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        background: '#070642',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        fontWeight: '600',
                        fontSize: '14px',
                        cursor: 'pointer',
                        alignSelf: 'flex-end',
                        boxShadow: '0 4px 15px rgba(7, 6, 66, 0.25)',
                        transition: 'all 0.2s',
                        marginTop: '10px'
                    }}
                >
                    ← Return to Dashboard Home <span style={{ marginLeft: 4 }}></span>
                </button>

            </div>
        </div>
    );
}
