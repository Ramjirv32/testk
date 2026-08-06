'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
    Chart,
    BarController,
    BarElement,
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';

Chart.register(
    BarController,
    BarElement,
    LineController,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
    Filler
);

interface StudentStatisticsProps {
    studentHistory?: any;
    collegeName?: string;
}

export default function StudentStatistics({
    studentHistory,
    collegeName,
}: StudentStatisticsProps) {
    console.log("StudentStatistics component rendered. studentHistory prop:", studentHistory);
    const enrollmentChartRef = useRef<Chart | null>(null);
    const categoryChartRef = useRef<Chart | null>(null);
    const chartIdPrefix = collegeName?.replace(/\s+/g, '-') || 'college';

    // Extract years dynamically from data
    const historyData = Array.isArray(studentHistory?.student_count_comparison_last_3_years)
        ? studentHistory.student_count_comparison_last_3_years
        : [];
    const availableYears = historyData.map((d: any) => d.year) || [];
    const latestYear = availableYears.length > 0 ? Math.max(...availableYears).toString() : '2026';
    const [selectedYear, setSelectedYear] = useState<string>('all'); // Default to 'all' for all years
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Animated values for table
    const [animatedValues, setAnimatedValues] = useState<{ [key: string]: number }>({});

    // Animate table values when year or category changes
    useEffect(() => {
        const selectedData = historyData.find((d: any) => String(d.year) === String(selectedYear));
        if (selectedData) {
            const targetValues = {
                ug: selectedData.ug || 0,
                pg: selectedData.pg || 0,
                phd: selectedData.phd || 0,
                total: selectedData.total_enrolled || 0,
            };

            // Reset to 0 first
            setAnimatedValues({ ug: 0, pg: 0, phd: 0, total: 0 });

            // Animate from 0 to target over 2.5 seconds
            const duration = 2500;
            const startTime = Date.now();
            const startValues = { ug: 0, pg: 0, phd: 0, total: 0 };

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);

                // Ease out quart function
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);

                setAnimatedValues({
                    ug: Math.floor(startValues.ug + (targetValues.ug - startValues.ug) * easeOutQuart),
                    pg: Math.floor(startValues.pg + (targetValues.pg - startValues.pg) * easeOutQuart),
                    phd: Math.floor(startValues.phd + (targetValues.phd - startValues.phd) * easeOutQuart),
                    total: Math.floor(startValues.total + (targetValues.total - startValues.total) * easeOutQuart),
                });

                if (progress < 1) {
                    requestAnimationFrame(animate);
                }
            };

            animate();
        }
    }, [selectedYear, selectedCategory, historyData]);

    // Update selected year when data changes
    useEffect(() => {
        if (availableYears.length > 0) {
            const maxYear = Math.max(...availableYears).toString();
            setSelectedYear(maxYear);
        }
    }, [availableYears]);

    // Create Area Chart for Student History
    useEffect(() => {
        const canvas = document.getElementById(`areaChart-${chartIdPrefix}`) as HTMLCanvasElement;
        if (!canvas) return;
        if (enrollmentChartRef.current) enrollmentChartRef.current.destroy();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const historyData = Array.isArray(studentHistory?.student_count_comparison_last_3_years)
            ? studentHistory.student_count_comparison_last_3_years
            : [];

        // Use dynamic years from the data, sorted
        const sortedYears = [...historyData].sort((a: any, b: any) => a.year - b.year);
        const years = sortedYears.map((d: any) => d.year.toString());
        const data = sortedYears.map((d: any) => d.total_enrolled || 0);

        // Check if there's any data to display
        const hasData = data.some(val => val > 0);
        if (!hasData) return;

        enrollmentChartRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Total Students',
                        data: data,
                        borderColor: '#070642',
                        backgroundColor: 'rgba(7, 6, 66, 0.2)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 8,
                        pointHoverRadius: 12,
                        pointBackgroundColor: '#070642',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 3,
                        pointHoverBackgroundColor: '#9a3197',
                        pointHoverBorderColor: '#fff',
                        pointHoverBorderWidth: 4,
                    },
                ],
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
                        displayColors: false,
                        callbacks: {
                            title: function (context) {
                                return `Year: ${context[0].label}`;
                            },
                            label: function (context) {
                                const val = typeof context.raw === 'number' ? context.raw : Number(context.raw || 0);
                                return `Total Students: ${val.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: { grid: { display: false } },
                },
                onClick: (event: any, elements: any[]) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const selectedYear = years[index];
                        setSelectedYear(selectedYear);
                        // Scroll to categorywise section with slow smooth scroll
                        const categorySection = document.getElementById(`categorywise-section-${chartIdPrefix}`);
                        if (categorySection) {
                            categorySection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                },
                onHover: (event: any, elements: any[]) => {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                },
                animation: {
                    duration: 2500,
                    easing: 'easeInOutQuart',
                },
            },
        });

        return () => {
            if (enrollmentChartRef.current) enrollmentChartRef.current.destroy();
        };
    }, [studentHistory, chartIdPrefix]);

    // Create Categorywise Bar Chart
    useEffect(() => {
        const canvas = document.getElementById(`categoryChart-${chartIdPrefix}`) as HTMLCanvasElement;
        if (!canvas) return;
        if (categoryChartRef.current) categoryChartRef.current.destroy();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const historyData = Array.isArray(studentHistory?.student_count_comparison_last_3_years)
            ? studentHistory.student_count_comparison_last_3_years
            : [];

        if (historyData.length === 0) return;

        let datasets: any[] = [];
        let labels: string[] = [];

        // If "All Year" is selected, show all years for the selected category
        if (selectedYear === 'all') {
            const sortedYears = [...historyData].sort((a: any, b: any) => a.year - b.year);
            labels = sortedYears.map((d: any) => d.year.toString());

            if (selectedCategory === 'all') {
                // Show UG, PG, PhD for all years
                datasets = [
                    {
                        label: 'UG',
                        data: sortedYears.map((d: any) => d.ug || 0),
                        backgroundColor: '#070642',
                        borderRadius: 8,
                    },
                    {
                        label: 'PG',
                        data: sortedYears.map((d: any) => d.pg || 0),
                        backgroundColor: '#9a3197',
                        borderRadius: 8,
                    },
                    {
                        label: 'PhD',
                        data: sortedYears.map((d: any) => d.phd || 0),
                        backgroundColor: '#e084cd',
                        borderRadius: 8,
                    },
                ];
            } else if (selectedCategory === 'ug') {
                datasets = [
                    {
                        label: 'UG Students',
                        data: sortedYears.map((d: any) => d.ug || 0),
                        backgroundColor: '#070642',
                        borderRadius: 8,
                    },
                ];
            } else if (selectedCategory === 'pg') {
                datasets = [
                    {
                        label: 'PG Students',
                        data: sortedYears.map((d: any) => d.pg || 0),
                        backgroundColor: '#9a3197',
                        borderRadius: 8,
                    },
                ];
            } else if (selectedCategory === 'phd') {
                datasets = [
                    {
                        label: 'PhD Students',
                        data: sortedYears.map((d: any) => d.phd || 0),
                        backgroundColor: '#e084cd',
                        borderRadius: 8,
                    },
                ];
            }
        } else {
            // Single year selected
            const selectedData = historyData.find((d: any) => String(d.year) === String(selectedYear));

            if (!selectedData) return;

            if (selectedCategory === 'all') {
                labels = ['UG', 'PG', 'PhD'];
                datasets = [
                    {
                        label: 'Students',
                        data: [
                            selectedData.ug || 0,
                            selectedData.pg || 0,
                            selectedData.phd || 0,
                        ],
                        backgroundColor: ['#070642', '#9a3197', '#e084cd'],
                        borderRadius: 8,
                    },
                ];
            } else if (selectedCategory === 'ug') {
                labels = ['UG Students'];
                datasets = [
                    {
                        label: 'UG Students',
                        data: [selectedData.ug || 0],
                        backgroundColor: ['#070642'],
                        borderRadius: 8,
                    },
                ];
            } else if (selectedCategory === 'pg') {
                labels = ['PG Students'];
                datasets = [
                    {
                        label: 'PG Students',
                        data: [selectedData.pg || 0],
                        backgroundColor: ['#9a3197'],
                        borderRadius: 8,
                    },
                ];
            } else if (selectedCategory === 'phd') {
                labels = ['PhD Students'];
                datasets = [
                    {
                        label: 'PhD Students',
                        data: [selectedData.phd || 0],
                        backgroundColor: ['#e084cd'],
                        borderRadius: 8,
                    },
                ];
            } else if (selectedCategory === 'intern') {
                labels = ['International Students'];
                datasets = [
                    {
                        label: 'International Students',
                        data: [studentHistory?.international_students?.total_count || 0],
                        backgroundColor: ['#4ade80'],
                        borderRadius: 8,
                    },
                ];
            } else if (selectedCategory === 'male') {
                labels = ['Male Students'];
                datasets = [
                    {
                        label: 'Male Students',
                        data: [studentHistory?.student_gender_ratio?.male_students || 0],
                        backgroundColor: ['#fbbf24'],
                        borderRadius: 8,
                    },
                ];
            } else if (selectedCategory === 'female') {
                labels = ['Female Students'];
                datasets = [
                    {
                        label: 'Female Students',
                        data: [studentHistory?.student_gender_ratio?.female_students || 0],
                        backgroundColor: ['#f472b6'],
                        borderRadius: 8,
                    },
                ];
            }
        }

        categoryChartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: datasets.map((ds: any) => ({
                    ...ds,
                    data: ds.data.map(() => 0),
                })),
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: true, position: 'top' },
                    tooltip: {
                        backgroundColor: 'rgba(154, 49, 151, 0.9)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        padding: 12,
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw as number;
                                return `${label}: ${value.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                    x: { grid: { display: false } },
                },
                onHover: (event: any, elements: any[]) => {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                },
                animation: {
                    duration: 2500,
                    easing: 'easeInOutQuart',
                },
            },
        });

        // Update to actual values after creation to animate from 0
        setTimeout(() => {
            if (categoryChartRef.current) {
                categoryChartRef.current.data.datasets = datasets;
                categoryChartRef.current.update();
            }
        }, 100);

        return () => {
            if (categoryChartRef.current) categoryChartRef.current.destroy();
        };
    }, [studentHistory, selectedYear, selectedCategory, chartIdPrefix]);

    const formatValue = (val: any, currency?: string): string => {
        if (val === null || val === undefined || val === '' || val === 0) return '-';
        if (typeof val === 'object') return JSON.stringify(val);
        if (typeof val === 'number') {
            if (currency) {
                const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : '₹';
                return `${symbol}${val.toLocaleString()}`;
            }
            return val.toLocaleString();
        }
        return String(val);
    };

    return (
        <>
            {/* Student History - Area Chart */}
            <section className="content-section">
                <h2 className="section-title"> Student History (Past 3 Years)</h2>
                <p className="section-subtitle">Click on any year point to filter the categorywise chart below and view detailed breakdown</p>
                <div className="chart-card-full">
                    <div className="chart-wrapper-bar-full">
                        <canvas id={`areaChart-${chartIdPrefix}`}></canvas>
                    </div>
                </div>
            </section>

            {/* Categorywise Comparison - Bar Chart with Filters */}
            <section id={`categorywise-section-${chartIdPrefix}`} className="content-section">
                <h2 className="section-title"> Categorywise Comparison - {selectedYear === 'all' ? 'All Years' : selectedYear}</h2>

                {/* Year Filter Buttons - Dynamic */}
                <div className="filter-buttons">
                    <button
                        key="all"
                        className={`filter-btn ${selectedYear === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedYear('all')}
                    >
                        All Years
                    </button>
                    {availableYears.map((year: number) => (
                        <button
                            key={year}
                            className={`filter-btn ${selectedYear === year.toString() ? 'active' : ''}`}
                            onClick={() => setSelectedYear(year.toString())}
                        >
                            {year}
                        </button>
                    ))}
                </div>

                {/* Category Filter Buttons */}
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('all')}
                    >
                        All Categories
                    </button>
                    <button
                        className={`filter-btn ${selectedCategory === 'ug' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('ug')}
                    >
                        UG
                    </button>
                    <button
                        className={`filter-btn ${selectedCategory === 'pg' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('pg')}
                    >
                        PG
                    </button>
                    <button
                        className={`filter-btn ${selectedCategory === 'phd' ? 'active' : ''}`}
                        onClick={() => setSelectedCategory('phd')}
                    >
                        PhD
                    </button>
                </div>

                {(() => {
                    const historyData = Array.isArray(studentHistory?.student_count_comparison_last_3_years)
                        ? studentHistory.student_count_comparison_last_3_years
                        : [];

                    const selectedData = historyData.find((d: any) => String(d.year) === String(selectedYear));

                    if (historyData.length === 0 || (selectedYear !== 'all' && !selectedData)) {
                        return (
                            <div className="no-data">
                                <p>No categorywise data available</p>
                            </div>
                        );
                    }

                    return (
                        <div className="categorywise-layout">
                            {/* Bar Chart - Increased Size */}
                            <div className="category-chart-container" style={{ flex: '0 0 55%' }}>
                                <div className="chart-card-full" style={{ height: '400px' }}>
                                    <div className="chart-wrapper-bar-full">
                                        <canvas id={`categoryChart-${chartIdPrefix}`}></canvas>
                                    </div>
                                </div>
                            </div>

                            {/* Data Table - Top Right */}
                            <div className="category-data-table" style={{ flex: '1' }}>
                                <h3>Detailed Statistics - {selectedYear === 'all' ? 'All Years' : selectedYear}</h3>
                                {selectedYear === 'all' ? (
                                    <table className="interactive-stats-table">
                                        <thead>
                                            <tr>
                                                <th>Year</th>
                                                <th>UG</th>
                                                <th>PG</th>
                                                <th>PhD</th>
                                                <th>Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {[...historyData].sort((a: any, b: any) => a.year - b.year).map((d: any) => (
                                                <tr key={d.year}>
                                                    <td>{d.year}</td>
                                                    <td>{(d.ug || 0).toLocaleString()}</td>
                                                    <td>{(d.pg || 0).toLocaleString()}</td>
                                                    <td>{(d.phd || 0).toLocaleString()}</td>
                                                    <td>{(d.total_enrolled || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <table className="interactive-stats-table">
                                        <thead>
                                            <tr>
                                                <th>Metric</th>
                                                <th>Count</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr>
                                                <td>UG Students</td>
                                                <td>{animatedValues.ug !== undefined ? animatedValues.ug.toLocaleString() : '-'}</td>
                                            </tr>
                                            <tr>
                                                <td>PG Students</td>
                                                <td>{animatedValues.pg !== undefined ? animatedValues.pg.toLocaleString() : '-'}</td>
                                            </tr>
                                            <tr>
                                                <td>PhD Students</td>
                                                <td>{animatedValues.phd !== undefined ? animatedValues.phd.toLocaleString() : '-'}</td>
                                            </tr>
                                            <tr>
                                                <td>Total Enrolled</td>
                                                <td>{animatedValues.total !== undefined ? animatedValues.total.toLocaleString() : '-'}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    );
                })()}
            </section>
        </>
    );
}
