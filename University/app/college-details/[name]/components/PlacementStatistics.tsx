'use client';

import React, { useEffect, useRef, useState } from 'react';
import { getCurrencySymbol, convertToINR } from '../types';
import {
    Chart,
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend,
} from 'chart.js';

Chart.register(
    BarController,
    BarElement,
    CategoryScale,
    LinearScale,
    Tooltip,
    Legend
);

interface PlacementData {
    year?: number;
    highest_package: number;
    average_package: number;
    median_package: number;
    placement_rate_percent: number;
    total_students_placed: number;
    total_companies_visited: number;
    package_currency: string;
    placement_highlights?: string;
    graduate_outcomes_note?: string;
    placement_comparison_last_3_years?: PlacementComparison[];
    top_recruiters?: string[];
    sector_wise_placement_last_3_years?: SectorWisePlacement[];
    gender_based_placement_last_3_years?: GenderBasedPlacement[];
}

interface PlacementComparison {
    year: number;
    average_package: number;
    employment_rate_percent: number;
    package_currency: string;
}

interface SectorWisePlacement {
    year: number;
    sector: string;
    companies: string;
    percent: number;
}

interface GenderBasedPlacement {
    year: number;
    male_placed: number;
    female_placed: number;
    male_percent: number;
    female_percent: number;
}

interface PlacementStatisticsProps {
    placements: PlacementData;
    country?: string;
}

export default function PlacementStatistics({ placements, country }: PlacementStatisticsProps) {
    const placementChartRef = useRef<Chart | null>(null);
    const [placementChartAnimated, setPlacementChartAnimated] = useState(false);

    // Intersection Observer for scroll detection
    useEffect(() => {
        const observerOptions = {
            threshold: 0.05,
            rootMargin: '0px'
        }

        const placementObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !placementChartAnimated) {
                    setPlacementChartAnimated(true);
                }
            });
        }, observerOptions);

        const placementCanvas = document.getElementById('placementChart');
        if (placementCanvas) placementObserver.observe(placementCanvas);

        // Fallback timer to guarantee chart renders
        const timer = setTimeout(() => {
            setPlacementChartAnimated(true);
        }, 1500);

        return () => {
            if (placementCanvas) placementObserver.unobserve(placementCanvas);
            clearTimeout(timer);
        };
    }, []);

    // Create Placement Comparison Chart
    useEffect(() => {
        if (!placementChartAnimated) return;

        const canvas = document.getElementById('placementChart') as HTMLCanvasElement;
        if (!canvas) return;
        if (placementChartRef.current) placementChartRef.current.destroy();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const comparisonData = placements.placement_comparison_last_3_years || [];
        if (comparisonData.length === 0) return;

        const years = comparisonData.map(c => c.year.toString());
        const avgPackages = comparisonData.map(c => {
            const cur = c.package_currency || placements.package_currency || 'INR';
            const inrVal = convertToINR(c.average_package, cur, country || '');
            return +(inrVal / 100000).toFixed(2) || 0;
        });
        const employmentRates = comparisonData.map(c => {
            const val = c.employment_rate_percent;
            return val || 0;
        });

        placementChartRef.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    {
                        label: 'Average Package (LPA INR)',
                        data: avgPackages.map(() => 0),
                        backgroundColor: '#070642',
                        borderRadius: 8,
                        yAxisID: 'y',
                    },
                    {
                        label: 'Employment Rate (%)',
                        data: employmentRates.map(() => 0),
                        backgroundColor: '#9a3197',
                        borderRadius: 8,
                        yAxisID: 'y1',
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
                        callbacks: {
                            label: function (context) {
                                const label = context.dataset.label || '';
                                const value = context.raw as number;
                                if (label.includes('%')) {
                                    return `${label}: ${value}%`;
                                }
                                return `${label}: ₹${value.toFixed(2)} LPA`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        grid: { color: 'rgba(0,0,0,0.05)' },
                        title: {
                            display: true,
                            text: 'Average Package (LPA INR)'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        grid: { drawOnChartArea: false },
                        title: {
                            display: true,
                            text: 'Employment Rate (%)'
                        },
                        max: 100,
                    },
                    x: { grid: { display: false } },
                },
                animation: {
                    duration: 2500,
                    easing: 'easeInOutQuart',
                },
            },
        });

        // Update to actual values after creation to animate from 0
        setTimeout(() => {
            if (placementChartRef.current) {
                placementChartRef.current.data.datasets[0].data = avgPackages;
                placementChartRef.current.data.datasets[1].data = employmentRates;
                placementChartRef.current.update();
            }
        }, 100);

        return () => {
            if (placementChartRef.current) placementChartRef.current.destroy();
        };
    }, [placements, placementChartAnimated]);

    const formatPackage = (pkg: number, currency: string = 'INR'): string => {
        if (pkg === undefined || pkg === null || pkg <= 0 || pkg === -1) return '-';
        const upper = currency ? currency.toUpperCase().trim() : 'INR';
        const sym = getCurrencySymbol(upper);
        
        if (upper === 'INR' || upper === 'LPA') {
            if (pkg >= 100000) {
                const lakhs = (pkg / 100000).toFixed(2);
                return `${sym}${lakhs} LPA`;
            }
            if (pkg > 0 && pkg < 200) {
                return `${sym}${pkg.toFixed(2)} LPA`;
            }
            return `${sym}${pkg.toLocaleString()}`;
        }
        
        let localStr = '';
        if (pkg >= 1000000) {
            localStr = `${sym}${(pkg / 1000000).toFixed(2)}M`;
        } else if (pkg >= 1000) {
            localStr = `${sym}${(pkg / 1000).toFixed(0)}K`;
        } else if (pkg > 0 && pkg < 200) {
            localStr = `${sym}${pkg.toFixed(2)} Lakhs`;
        } else {
            localStr = `${sym}${pkg.toLocaleString()}`;
        }

        const inrVal = convertToINR(pkg, upper, country || '');
        if (inrVal > 0) {
            const lpaVal = (inrVal / 100000).toFixed(2);
            if (upper !== 'INR' && upper !== 'LPA') {
                return `${localStr} (₹${lpaVal} LPA)`;
            }
        }
        return localStr;
    };

    const formatValue = (val: any): string => {
        if (val === null || val === undefined || val === '' || val === 0 || val === -1 || val === '-1') return '-';
        if (typeof val === 'object') return JSON.stringify(val);
        if (typeof val === 'number') {
            if (val <= 0) return '-';
            return val.toLocaleString();
        }
        return String(val);
    };

    return (
        <>
            {/* Placement Overview Cards */}
            <section className="content-section">
                <h2 className="section-title"> Placement Statistics{placements?.year ? ` (${placements.year})` : ''}</h2>
                {placements && (placements.highest_package > 0 || placements.total_students_placed > 0 || placements.average_package > 0) ? (
                    <div className="stat-card-grid">
                        <div className="placement-card highlight">
                            <span className="placement-icon"></span>
                            <span className="placement-value">{formatPackage(placements.highest_package, placements.package_currency)}</span>
                            <span className="placement-label">Highest Package</span>
                        </div>
                        <div className="placement-card">
                            <span className="placement-icon"></span>
                            <span className="placement-value">{formatPackage(placements.average_package, placements.package_currency)}</span>
                            <span className="placement-label">Average Package</span>
                        </div>
                        <div className="placement-card">
                            <span className="placement-icon"></span>
                            <span className="placement-value">{formatPackage(placements.median_package, placements.package_currency)}</span>
                            <span className="placement-label">Median Package</span>
                        </div>
                        <div className="placement-card highlight">
                            <span className="placement-icon"></span>
                            <span className="placement-value">{placements.placement_rate_percent && placements.placement_rate_percent !== -1 && placements.placement_rate_percent > 0 ? `${placements.placement_rate_percent}%` : '-'}</span>
                            <span className="placement-label">Placement Rate</span>
                        </div>
                        <div className="placement-card">
                            <span className="placement-icon">‍</span>
                            <span className="placement-value">{placements.total_students_placed && placements.total_students_placed !== -1 && placements.total_students_placed > 0 ? placements.total_students_placed.toLocaleString() : '-'}</span>
                            <span className="placement-label">Students Placed</span>
                        </div>
                        <div className="placement-card">
                            <span className="placement-icon"></span>
                            <span className="placement-value">{placements.total_companies_visited && placements.total_companies_visited !== -1 && placements.total_companies_visited > 0 ? placements.total_companies_visited.toLocaleString() : '-'}</span>
                            <span className="placement-label">Companies Visited</span>
                        </div>
                    </div>
                ) : (
                    <p className="no-data">No placement statistics available</p>
                )}
            </section>

            {/* Placement Highlights */}
            {placements.placement_highlights && (
                <section className="content-section">
                    <div className="info-callout">
                        <strong> Highlights:</strong> {placements.placement_highlights}
                    </div>
                </section>
            )}

            {/* Graduate Outcomes Note */}
            {placements?.graduate_outcomes_note && (
                <section className="content-section">
                    <div className="info-callout">
                        <strong> Graduate Outcomes:</strong> {placements.graduate_outcomes_note}
                    </div>
                </section>
            )}

            {/* Placement Comparison Chart + Table */}
            {placements.placement_comparison_last_3_years && placements.placement_comparison_last_3_years.length > 0 && (
                <section className="content-section">
                    <h2 className="section-title"> Placement Comparison (Last 3 Years)</h2>
                    <div className="chart-card-full">
                        <div className="chart-wrapper-bar-full">
                            <canvas id="placementChart"></canvas>
                        </div>
                    </div>
                    <table className="data-table" style={{ marginTop: '20px' }}>
                        <thead><tr><th>Year</th><th>Average Package</th><th>Employment Rate</th></tr></thead>
                        <tbody>
                            {placements.placement_comparison_last_3_years.map((comp, idx) => (
                                <tr key={idx}>
                                    <td>{comp.year}</td>
                                    <td>{formatPackage(comp.average_package, comp.package_currency)}</td>
                                    <td>{comp.employment_rate_percent ? `${comp.employment_rate_percent}%` : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Top Recruiters */}
            {placements.top_recruiters && placements.top_recruiters.length > 0 && (
                <section className="content-section">
                    <h2 className="section-title"> Top Recruiters</h2>
                    <div className="recruiter-grid">
                        {placements.top_recruiters.map((recruiter, idx) => (
                            <span className="recruiter-chip" key={idx}>{recruiter}</span>
                        ))}
                    </div>
                </section>
            )}

            {/* Sector-wise Placement */}
            {placements.sector_wise_placement_last_3_years && placements.sector_wise_placement_last_3_years.length > 0 && (
                <section className="content-section">
                    <h2 className="section-title"> Sector-wise Placements</h2>
                    <table className="data-table">
                        <thead><tr><th>Year</th><th>Sector</th><th>Companies</th><th>Share %</th></tr></thead>
                        <tbody>
                            {placements.sector_wise_placement_last_3_years.map((s, idx) => (
                                <tr key={idx}>
                                    <td>{s.year}</td>
                                    <td>{s.sector}</td>
                                    <td>{s.companies || '-'}</td>
                                    <td>{formatValue(s.percent)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}

            {/* Gender-based Placement */}
            {placements.gender_based_placement_last_3_years && placements.gender_based_placement_last_3_years.length > 0 && (
                <section className="content-section">
                    <h2 className="section-title"> Gender-based Placements</h2>
                    <table className="data-table">
                        <thead><tr><th>Year</th><th>Male Placed</th><th>Female Placed</th><th>Male %</th><th>Female %</th></tr></thead>
                        <tbody>
                            {placements.gender_based_placement_last_3_years.map((g, idx) => (
                                <tr key={idx}>
                                    <td>{g.year}</td>
                                    <td>{formatValue(g.male_placed)}</td>
                                    <td>{formatValue(g.female_placed)}</td>
                                    <td>{formatValue(g.male_percent)}</td>
                                    <td>{formatValue(g.female_percent)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>
            )}
        </>
    );
}
