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

interface ProgramDistributionProps {
    ugPrograms: string[];
    pgPrograms: string[];
    phdPrograms: string[];
    selectedStatCategory: string | null;
    setSelectedStatCategory: (category: string | null) => void;
    collegeName?: string;
}

export default function ProgramDistribution({
    ugPrograms,
    pgPrograms,
    phdPrograms,
    selectedStatCategory,
    setSelectedStatCategory,
    collegeName,
}: ProgramDistributionProps) {
    const programsChartRef = useRef<Chart | null>(null);
    const chartIdPrefix = collegeName?.replace(/\s+/g, '-') || 'college';

    // Create Programs Doughnut Chart
    useEffect(() => {
        const canvas = document.getElementById(`programsChart-${chartIdPrefix}`) as HTMLCanvasElement;
        if (!canvas) return;
        if (programsChartRef.current) programsChartRef.current.destroy();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const ugCount = ugPrograms?.length || 0;
        const pgCount = pgPrograms?.length || 0;
        const phdCount = phdPrograms?.length || 0;
        
        let rotation = 0;
        if (selectedStatCategory === 'ug') rotation = -90;
        else if (selectedStatCategory === 'pg') rotation = -90 - (ugCount / (ugCount + pgCount + phdCount)) * 360;
        else if (selectedStatCategory === 'phd') rotation = -90 - ((ugCount + pgCount) / (ugCount + pgCount + phdCount)) * 360;

        programsChartRef.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Undergraduate (UG)', 'Postgraduate (PG)', 'Doctoral (PhD)'],
                datasets: [
                    {
                        data: [ugCount, pgCount, phdCount],
                        backgroundColor: ['#070642', '#9a3197', '#e084cd'],
                        borderWidth: 0,
                        hoverOffset: selectedStatCategory ? 0 : 15,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                rotation: rotation,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true },
                },
                animation: {
                    animateRotate: true,
                    animateScale: true,
                    duration: selectedStatCategory ? 500 : 1000,
                },
            },
        });

        return () => {
            if (programsChartRef.current) programsChartRef.current.destroy();
        };
    }, [ugPrograms, pgPrograms, phdPrograms, selectedStatCategory]);

    const formatValue = (val: any): string => {
        if (val === null || val === undefined || val === '' || val === 0) return '-';
        if (typeof val === 'object') return JSON.stringify(val);
        if (typeof val === 'number') return val.toLocaleString();
        return String(val);
    };

    return (
        <section className="content-section">
            <h2 className="section-title"> Student Statistics</h2>
            <div className="stats-layout">
                {/* Left: Pie Chart */}
                <div className="stats-chart-left">
                    <h3>Program Distribution</h3>
                    <div className="chart-wrapper-pie">
                        <canvas id={`programsChart-${chartIdPrefix}`}></canvas>
                    </div>
                </div>
                
                {/* Right: Interactive Table */}
                <div className="stats-table-right">
                    <h3>Program Details</h3>
                    <table className="interactive-stats-table">
                        <thead>
                            <tr>
                                <th>Program Type</th>
                                <th>Count</th>
                                <th>Percentage</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const ugCount = ugPrograms?.length || 0;
                                const pgCount = pgPrograms?.length || 0;
                                const phdCount = phdPrograms?.length || 0;
                                const total = ugCount + pgCount + phdCount;
                                
                                const stats = [
                                    { name: 'Undergraduate (UG)', count: ugCount, color: '#070642', key: 'ug' },
                                    { name: 'Postgraduate (PG)', count: pgCount, color: '#9a3197', key: 'pg' },
                                    { name: 'Doctoral (PhD)', count: phdCount, color: '#e084cd', key: 'phd' },
                                ];
                                
                                return stats.map(stat => {
                                    const percent = total > 0 ? ((stat.count / total) * 100).toFixed(1) : 0;
                                    const isSelected = selectedStatCategory === stat.key;
                                    
                                    return (
                                        <tr 
                                            key={stat.key}
                                            onClick={() => setSelectedStatCategory(isSelected ? null : stat.key)}
                                            style={{ 
                                                backgroundColor: isSelected ? stat.color + '20' : 'transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.3s ease'
                                            }}
                                        >
                                            <td>
                                                <span 
                                                    style={{ 
                                                        display: 'inline-block', 
                                                        width: '12px', 
                                                        height: '12px', 
                                                        backgroundColor: stat.color, 
                                                        borderRadius: '50%',
                                                        marginRight: '8px'
                                                    }}
                                                ></span>
                                                {stat.name}
                                            </td>
                                            <td>{formatValue(stat.count)}</td>
                                            <td>{percent}%</td>
                                        </tr>
                                    );
                                });
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    );
}
