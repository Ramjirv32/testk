'use client';

import React, { useRef, useEffect } from 'react';
import {
    Chart,
    ArcElement,
    DoughnutController,
    Tooltip,
    Legend,
} from 'chart.js';

Chart.register(
    ArcElement,
    DoughnutController,
    Tooltip,
    Legend
);

interface StatisticsOfCollegeProps {
    studentStatistics?: {
        total_enrollment?: number;
        ug_students?: number;
        pg_students?: number;
        phd_students?: number;
        annual_intake?: number;
        male_percent?: number;
        female_percent?: number;
        total_ug_courses?: number;
        total_pg_courses?: number;
        total_phd_courses?: number;
    };
    facultyStaff?: {
        total_faculty?: number;
        phd_faculty_percent?: number;
    };
    collegeName?: string;
}

export default function StatisticsOfCollege({
    studentStatistics,
    facultyStaff,
    collegeName,
}: StatisticsOfCollegeProps) {
    const statsChartRef = useRef<Chart | null>(null);
    const coursesChartRef = useRef<Chart | null>(null);
    const chartIdPrefix = collegeName?.replace(/\s+/g, '-') || 'college';

    // Create Student & Faculty Doughnut Chart
    useEffect(() => {
        const canvas = document.getElementById(`statsChart-${chartIdPrefix}`) as HTMLCanvasElement;
        if (!canvas) return;
        if (statsChartRef.current) statsChartRef.current.destroy();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const totalEnrollment = studentStatistics?.total_enrollment || 0;
        const ugStudents = studentStatistics?.ug_students || 0;
        const pgStudents = studentStatistics?.pg_students || 0;
        const phdStudents = studentStatistics?.phd_students || 0;
        const totalFaculty = facultyStaff?.total_faculty || 0;
        const phdFacultyPercent = facultyStaff?.phd_faculty_percent || 0;
        
        // Check if there's any data to display
        const hasData = totalEnrollment > 0 || ugStudents > 0 || pgStudents > 0 || phdStudents > 0 || totalFaculty > 0;
        if (!hasData) return;
        
        statsChartRef.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Total Enrollment', 'UG Students', 'PG Students', 'PhD Students', 'Total Faculty'],
                datasets: [
                    {
                        data: [totalEnrollment, ugStudents, pgStudents, phdStudents, totalFaculty],
                        backgroundColor: ['#070642', '#9a3197', '#e084cd', '#4ade80', '#fbbf24'],
                        borderWidth: 0,
                        hoverOffset: 15,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: { 
                        display: true, 
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 11
                            }
                        }
                    },
                    tooltip: { 
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw as number;
                                return `${label}: ${value.toLocaleString()}`;
                            }
                        }
                    },
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                },
            },
        });

        return () => {
            if (statsChartRef.current) statsChartRef.current.destroy();
        };
    }, [studentStatistics, facultyStaff, chartIdPrefix]);

    // Create Courses Semi-Circle Doughnut Chart
    useEffect(() => {
        const canvas = document.getElementById(`coursesChart-${chartIdPrefix}`) as HTMLCanvasElement;
        if (!canvas) return;
        if (coursesChartRef.current) coursesChartRef.current.destroy();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const ugCourses = studentStatistics?.total_ug_courses || 0;
        const pgCourses = studentStatistics?.total_pg_courses || 0;
        const phdCourses = studentStatistics?.total_phd_courses || 0;
        
        // Check if there's any data to display
        const hasData = ugCourses > 0 || pgCourses > 0 || phdCourses > 0;
        if (!hasData) return;
        
        coursesChartRef.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['UG Courses', 'PG Courses', 'PhD Courses'],
                datasets: [
                    {
                        data: [ugCourses, pgCourses, phdCourses],
                        backgroundColor: ['#070642', '#9a3197', '#e084cd'],
                        borderWidth: 0,
                        hoverOffset: 15,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                circumference: 180,
                rotation: -90,
                plugins: {
                    legend: { 
                        display: true, 
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                        }
                    },
                    tooltip: { 
                        enabled: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw as number;
                                const data = context.dataset.data as number[];
                                const total = data.reduce((a: number, b: number) => a + (b || 0), 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    },
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: 1000,
                },
            },
        });

        return () => {
            if (coursesChartRef.current) coursesChartRef.current.destroy();
        };
    }, [studentStatistics, chartIdPrefix]);

    const formatValue = (val: any): string => {
        if (val === null || val === undefined || val === '' || val === 0) return '-';
        if (typeof val === 'object') return JSON.stringify(val);
        if (typeof val === 'number') return val.toLocaleString();
        return String(val);
    };

    return (
        <section className="content-section">
            <h2 className="section-title"> Statistics of College</h2>
            
            {/* First Chart: Student & Faculty Metrics */}
            <div className="stats-layout">
                <div className="stats-chart-left">
                    <h3>Student & Faculty Distribution</h3>
                    <div className="chart-wrapper-pie">
                        <canvas id={`statsChart-${chartIdPrefix}`}></canvas>
                    </div>
                </div>
                
                <div className="stats-table-right">
                    <h3>Key Metrics</h3>
                    <table className="interactive-stats-table">
                        <thead>
                            <tr>
                                <th>Metric</th>
                                <th>Value</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Total Enrollment</td>
                                <td>{formatValue(studentStatistics?.total_enrollment)}</td>
                            </tr>
                            <tr>
                                <td>UG Students</td>
                                <td>{formatValue(studentStatistics?.ug_students)}</td>
                            </tr>
                            <tr>
                                <td>PG Students</td>
                                <td>{formatValue(studentStatistics?.pg_students)}</td>
                            </tr>
                            <tr>
                                <td>PhD Students</td>
                                <td>{formatValue(studentStatistics?.phd_students)}</td>
                            </tr>
                            <tr>
                                <td>Total Faculty</td>
                                <td>{formatValue(facultyStaff?.total_faculty)}</td>
                            </tr>
                            <tr>
                                <td>PhD Faculty Percentage</td>
                                <td>{facultyStaff?.phd_faculty_percent ? `${facultyStaff.phd_faculty_percent}%` : '-'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Second Chart: Courses Distribution (Semi-Circle) */}
            <div className="stats-layout">
                <div className="stats-chart-left" style={{ flex: '0 0 40%' }}>
                    <h3>Course/Program Distribution</h3>
                    <div className="chart-wrapper-pie" style={{ height: '200px' }}>
                        <canvas id={`coursesChart-${chartIdPrefix}`}></canvas>
                    </div>
                </div>
                
                <div className="stats-table-right mt-[30px]" style={{ flex: '1', maxWidth: '50%' }}>
                    <h3>Course Details</h3>
                    <table className="interactive-stats-table" style={{ fontSize: '14px', width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ padding: '8px 12px' }}>Program Type</th>
                                <th style={{ padding: '8px 12px' }}>Courses</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '8px 12px' }}>UG Courses</td>
                                <td style={{ padding: '8px 12px' }}>{formatValue(studentStatistics?.total_ug_courses)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 12px' }}>PG Courses</td>
                                <td style={{ padding: '8px 12px' }}>{formatValue(studentStatistics?.total_pg_courses)}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '8px 12px' }}>PhD Courses</td>
                                <td style={{ padding: '8px 12px' }}>{formatValue(studentStatistics?.total_phd_courses)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
