'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    GraduationCap,
    BookOpen,
    Users,
    Accessibility,
    Award,
    Lightbulb,
    Medal,
    Search,
    ChevronDown,
    GitCompare,
    MapPin,
    ExternalLink,
    Filter
} from 'lucide-react';
import {
    Chart,
    DoughnutController,
    ArcElement,
    Tooltip as ChartTooltip,
    Legend as ChartLegend,
} from 'chart.js';

Chart.register(DoughnutController, ArcElement, ChartTooltip, ChartLegend);

interface ScholarshipEntry {
    scholarship_id: string;
    college_id?: string;
    collection_name?: string;
    name: string;
    amount: string | number | null;
    currency: string;
    type: string;
    coverage: string;
    eligibility: string;
    keywords?: string[];
}

interface ScholarshipsProps {
    scholarshipItems: ScholarshipEntry[];
    collegeName: string;
    website?: string;
}

const mockDefaultScholarships = (collegeName: string): ScholarshipEntry[] => [
    {
        scholarship_id: 'SCH-001',
        name: 'Jadavpur University Free Studentship',
        amount: 'not_available',
        currency: 'INR',
        type: 'Ends-based',
        coverage: 'Tuition Support',
        eligibility: 'Needy and meritorious to needy and meolitisnumais and domicilals.'
    },
    {
        scholarship_id: 'SCH-002',
        name: 'Swami Vivekananda Merit-cum-Means Scholarship',
        amount: 600000,
        currency: 'INR',
        type: 'Ends-based',
        coverage: 'Tuition Support',
        eligibility: 'West Bengal domicile, west Bengal not conneceeable to pemmiment in country, ceats, and nsnot Bengal domicile, etc...'
    },
    {
        scholarship_id: 'SCH-003',
        name: 'SC/ST Stipends',
        amount: 'not_available',
        currency: 'INR',
        type: 'Merit',
        coverage: 'Tuition Support',
        eligibility: 'Needy and meritorious for Scholarship'
    },
    {
        scholarship_id: 'SCH-004',
        name: 'Physically Handicapped Scholarship',
        amount: 'not_available',
        currency: 'INR',
        type: 'Merit',
        coverage: 'Tuition Support',
        eligibility: 'West Bengal domicile for Scholarship'
    },
    {
        scholarship_id: 'SCH-005',
        name: 'AICTE PG (GATE/GPAT)',
        amount: 600000,
        currency: 'INR',
        type: 'Merit',
        coverage: 'Tuition Support',
        eligibility: 'West Bengal domicile to conectionament Scholarship'
    },
    {
        scholarship_id: 'SCH-006',
        name: 'Reliance Foundation Postgraduate Scholarships',
        amount: 500000,
        currency: 'INR',
        type: 'Ends-based',
        coverage: 'Tuition Support',
        eligibility: 'Needy and meritorious to postgraduate endoizans in Postgraduate Postgraduate Scholarships.'
    },
    {
        scholarship_id: 'SCH-007',
        name: 'J. K. Mitra Scholarship',
        amount: 50000,
        currency: 'INR',
        type: 'Ends-based',
        coverage: 'Tuition Support',
        eligibility: 'Needy and meritorious most needy and domicile.'
    },
    {
        scholarship_id: 'SCH-008',
        name: 'Dhirendre Narayan Guha Thakurta',
        amount: 9205,
        currency: 'INR',
        type: 'Endowment',
        coverage: 'Endowment support',
        eligibility: 'Academic merit selected.'
    },
    {
        scholarship_id: 'SCH-009',
        name: 'Gopal Chandra Talukder',
        amount: 8205,
        currency: 'INR',
        type: 'Endowment',
        coverage: 'Endowment',
        eligibility: 'Academic merit selected.'
    },
    {
        scholarship_id: 'SCH-010',
        name: 'Sailabala Biswas',
        amount: '2,500 INR one-time',
        currency: 'INR',
        type: 'Endowment',
        coverage: 'Endowment',
        eligibility: 'Academic merit selected.'
    },
    {
        scholarship_id: 'SCH-011',
        name: 'Sailabala Biswas',
        amount: 2500,
        currency: 'INR',
        type: 'Endowment',
        coverage: 'Endowment',
        eligibility: 'Academic merit selected.'
    },
    {
        scholarship_id: 'SCH-012',
        name: 'Dhirendra Narayan Talukder',
        amount: 9205,
        currency: 'INR',
        type: 'Endowment',
        coverage: 'Endowment',
        eligibility: 'Academic merit selected.'
    },
    {
        scholarship_id: 'SCH-013',
        name: 'Betola daswam',
        amount: 2500,
        currency: 'INR',
        type: 'Endowment',
        coverage: 'Endowment',
        eligibility: 'Academic merit selected.'
    },
    {
        scholarship_id: 'SCH-014',
        name: 'Barama Narayan Scholarship',
        amount: 2500,
        currency: 'INR',
        type: 'Endowment',
        coverage: 'Endowment',
        eligibility: 'Academic merit selected.'
    },
    {
        scholarship_id: 'SCH-015',
        name: 'Ghanal Chandra Talukder',
        amount: 2500,
        currency: 'INR',
        type: 'Endowment',
        coverage: 'Endowment',
        eligibility: 'Academic merit selected.'
    }
];

export default function Scholarships({ scholarshipItems = [], collegeName, website }: ScholarshipsProps) {
    const doughnutChartRef = useRef<Chart | null>(null);
    const [doughnutChartAnimated, setDoughnutChartAnimated] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // Retrieve either prop items or show "No Data" - NO MOCKS
    const list = scholarshipItems && scholarshipItems.length > 0 ? scholarshipItems : [];

    // Normalize types for counters
    const needList = list.filter(s => s.type?.toLowerCase().includes('need') || s.type?.toLowerCase().includes('ends-based'));
    const meritList = list.filter(s => s.type?.toLowerCase().includes('merit'));
    const govList = list.filter(s =>
        s.type?.toLowerCase().includes('gov') ||
        s.type?.toLowerCase().includes('spec') ||
        s.type?.toLowerCase().includes('alumni') ||
        s.type?.toLowerCase().includes('state')
    );
    const endowmentList = list.filter(s => s.type?.toLowerCase().includes('endow'));

    // UI Stats Counters
    const totalCount = list.length;
    const needCount = needList.length;
    const meritCount = meritList.length;
    const govCount = govList.length;
    const endowmentCount = endowmentList.length;

    // Filter Items by Search + Category Pill
    const filteredList = list.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            item.eligibility?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        if (selectedCategory === 'all') return true;
        if (selectedCategory === 'need') return item.type?.toLowerCase().includes('need') || item.type?.toLowerCase().includes('ends-based');
        if (selectedCategory === 'merit') return item.type?.toLowerCase().includes('merit');
        if (selectedCategory === 'government') {
            return item.type?.toLowerCase().includes('gov') ||
                item.type?.toLowerCase().includes('spec') ||
                item.type?.toLowerCase().includes('alumni') ||
                item.type?.toLowerCase().includes('state');
        }
        if (selectedCategory === 'endowment') return item.type?.toLowerCase().includes('endow');
        return true;
    });

    // Main non-endowment cards vs smaller endowment cards
    const mainCards = filteredList.filter(s => !s.type?.toLowerCase().includes('endow'));
    const endowmentCards = filteredList.filter(s => s.type?.toLowerCase().includes('endow'));

    // Intersection Observer for scroll chart animation
    useEffect(() => {
        const observerOptions = { threshold: 0.1, rootMargin: '0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !doughnutChartAnimated) {
                    setDoughnutChartAnimated(true);
                }
            });
        }, observerOptions);

        const canvas = document.getElementById('scholarshipDoughnutChart');
        if (canvas) observer.observe(canvas);

        return () => {
            if (canvas) observer.unobserve(canvas);
        };
    }, [doughnutChartAnimated]);

    // Draw Doughnut Chart
    useEffect(() => {
        if (!doughnutChartAnimated) return;

        const canvas = document.getElementById('scholarshipDoughnutChart') as HTMLCanvasElement;
        if (!canvas) return;
        if (doughnutChartRef.current) doughnutChartRef.current.destroy();

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dataVals = [
            needCount || 4,
            meritCount || 4,
            govCount || 4,
            endowmentCount || 8
        ];

        doughnutChartRef.current = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: [
                    'Need-based',
                    'Merit-based',
                    'Government/Specific',
                    'Endowment'
                ],
                datasets: [{
                    data: dataVals,
                    backgroundColor: [
                        '#10b981', // green
                        '#8b5cf6', // purple
                        '#3b82f6', // blue
                        '#ec4899'  // pink
                    ],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            font: { family: 'Outfit, sans-serif', size: 12 },
                            color: '#374151',
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const val = context.raw as number;
                                const total = dataVals.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((val / total) * 100);
                                return ` ${context.label}: ${val} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '70%'
            }
        });

        return () => {
            if (doughnutChartRef.current) doughnutChartRef.current.destroy();
        };
    }, [doughnutChartAnimated, needCount, meritCount, govCount, endowmentCount]);

    const formatValue = (val: any, currency: string = 'INR'): string => {
        if (val === 'not_available' || val === null || val === undefined || val === '') {
            return 'not_available';
        }
        const upper = (currency || 'INR').toUpperCase().trim();
        if (typeof val === 'string' && (val.includes('INR') || val.includes('EUR') || val.includes('USD') || val.includes('TRY') || val.includes('AED'))) return val;
        const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
        if (isNaN(num)) return String(val);
        return `${num.toLocaleString()} ${upper}`;
    };

    // Return the specific Lucide icon based on name
    const renderLucideIcon = (name: string) => {
        const lower = name.toLowerCase();
        const iconStyle = { width: '40px', height: '40px', color: '#1e293b' };

        if (lower.includes('free') || lower.includes('studentship') || lower.includes('concession')) {
            return <GraduationCap style={iconStyle} />;
        }
        if (lower.includes('swami') || lower.includes('vivekananda') || lower.includes('means')) {
            return <BookOpen style={iconStyle} />;
        }
        if (lower.includes('stipends') || lower.includes('sc/') || lower.includes('st/')) {
            return <Users style={iconStyle} />;
        }
        if (lower.includes('handicap') || lower.includes('disabled') || lower.includes('physical')) {
            return <Accessibility style={iconStyle} />;
        }
        if (lower.includes('aicte') || lower.includes('gate') || lower.includes('gpat')) {
            return <Award style={iconStyle} />;
        }
        if (lower.includes('reliance')) {
            return <Lightbulb style={iconStyle} />;
        }
        if (lower.includes('mitra') || lower.includes('trust')) {
            return <Medal style={iconStyle} />;
        }
        return <GraduationCap style={iconStyle} />;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', fontFamily: 'Outfit, Inter, sans-serif', width: '100%', color: '#1e293b' }}>

            {/* Show "No Data" message if no scholarships available */}
            {list.length === 0 ? (
                <div style={{
                    background: '#fff',
                    borderRadius: '16px',
                    padding: '60px 40px',
                    textAlign: 'center',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
                    <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', marginBottom: '8px' }}>
                        Scholarship Data Not Available
                    </h3>
                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '0' }}>
                        Scholarship information for {collegeName} is being compiled. Please check back soon.
                    </p>
                </div>
            ) : (
                <>
                <div style={{
                    background: 'linear-gradient(135deg, #0f1c5c 0%, #15227d 100%)',
                    color: 'white',
                    borderRadius: '16px',
                    padding: '40px 30px',
                    boxShadow: '0 8px 32px rgba(15, 28, 92, 0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '25px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                {/* Dynamic Watermark Emblems on Right */}
                <svg
                    style={{
                        position: 'absolute',
                        right: '-30px',
                        top: '-30px',
                        opacity: 0.08,
                        width: '240px',
                        height: '240px',
                        pointerEvents: 'none'
                    }}
                    viewBox="0 0 100 100"
                    fill="currentColor"
                >
                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" />
                    <circle cx="50" cy="50" r="38" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" fill="none" />
                    <path d="M50 20 L60 45 L85 45 L65 60 L75 85 L50 70 L25 85 L35 60 L15 45 L40 45 Z" />
                </svg>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1 }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.12)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        alignSelf: 'flex-start',
                        color: '#fbcfe8'
                    }}>
                        Scholarships
                    </div>
                    <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'white' }}>
                        Scholarships @ {collegeName}
                    </h1>
                    <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={14} /> Hindusthan, Bu, Eiddae, Leg
                    </span>
                </div>

                {/* Counters Row */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                    gap: '15px',
                    marginTop: '10px',
                    zIndex: 1
                }}>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', padding: '15px 20px', borderRadius: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Scholarships</span>
                        <strong style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>{totalCount}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', padding: '15px 20px', borderRadius: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Need-based</span>
                        <strong style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>{needCount}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', padding: '15px 20px', borderRadius: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Merit-based</span>
                        <strong style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>{meritCount}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', padding: '15px 20px', borderRadius: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Governmen/Specific</span>
                        <strong style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>{govCount}</strong>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', padding: '15px 20px', borderRadius: '12px', textAlign: 'center' }}>
                        <span style={{ fontSize: '11px', display: 'block', color: 'rgba(255,255,255,0.6)', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Endowment</span>
                        <strong style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>{endowmentCount}</strong>
                    </div>
                </div>
            </div>

            {/* 2. Filter Tabs and Search Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '15px',
                background: '#f8fafc',
                padding: '10px 15px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
            }}>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    {['all', 'need', 'merit', 'government', 'endowment'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                background: selectedCategory === cat ? '#0f172a' : 'white',
                                color: selectedCategory === cat ? 'white' : '#475569',
                                border: '1px solid #cbd5e1',
                                borderRadius: '20px',
                                padding: '6px 16px',
                                fontWeight: '600',
                                fontSize: '12px',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                                transition: 'all 0.15s'
                            }}
                        >
                            {cat === 'all' ? 'All' : cat}
                        </button>
                    ))}
                    <button style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        marginLeft: '5px'
                    }}>
                        <Filter size={16} />
                        <ChevronDown size={14} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                padding: '8px 12px 8px 32px',
                                borderRadius: '6px',
                                border: '1px solid #cbd5e1',
                                width: '220px',
                                fontSize: '13px',
                                outline: 'none',
                                background: 'white'
                            }}
                        />
                    </div>

                    <button style={{
                        background: '#0f1c5c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        fontWeight: '600',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                        <GitCompare size={14} /> Compare
                    </button>
                </div>
            </div>

            {/* 3. Main Scholarship Cards Grid */}
            {mainCards.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))',
                    gap: '24px'
                }}>
                    {mainCards.map((s, idx) => (
                        <div
                            key={s.scholarship_id && s.scholarship_id !== 'N/A' ? s.scholarship_id : `main-${idx}`}
                            style={{
                                background: '#fff9f5', // Warm Cream background exactly as in image
                                border: '1px solid #f2e2d9',
                                borderRadius: '16px',
                                padding: '24px',
                                boxShadow: '0 4px 20px rgba(15, 28, 92, 0.02)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}
                        >
                            {/* Card Header Title & Icon */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid #eedad0', paddingBottom: '16px' }}>
                                <div style={{
                                    background: 'white',
                                    borderRadius: '12px',
                                    padding: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid #eedad0',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                                }}>
                                    {renderLucideIcon(s.name)}
                                </div>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#0f1c5c', margin: 0, lineHeight: 1.4 }}>
                                    {s.name}
                                </h3>
                            </div>

                            {/* Info Table Layout exactly like screenshot */}
                            <div style={{
                                border: '1px solid #eedad0',
                                borderRadius: '10px',
                                overflow: 'hidden',
                                background: 'white'
                            }}>
                                <div style={{ display: 'flex', borderBottom: '1px solid #f3e6e0' }}>
                                    <div style={{ width: '100px', padding: '10px 14px', fontWeight: '800', fontSize: '12px', color: '#0f1c5c', background: '#fffbfa', borderRight: '1px solid #f3e6e0' }}>Name</div>
                                    <div style={{ flex: 1, padding: '10px 14px', fontSize: '12px', color: '#334155' }}>{s.name}</div>
                                </div>
                                <div style={{ display: 'flex', borderBottom: '1px solid #f3e6e0' }}>
                                    <div style={{ width: '100px', padding: '10px 14px', fontWeight: '800', fontSize: '12px', color: '#0f1c5c', background: '#fffbfa', borderRight: '1px solid #f3e6e0' }}>Amount</div>
                                    <div style={{ flex: 1, padding: '10px 14px', fontSize: '12px', color: '#334155', fontWeight: '700' }}>
                                        {formatValue(s.amount, s.currency)}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', borderBottom: '1px solid #f3e6e0' }}>
                                    <div style={{ width: '100px', padding: '10px 14px', fontWeight: '800', fontSize: '12px', color: '#0f1c5c', background: '#fffbfa', borderRight: '1px solid #f3e6e0' }}>Type</div>
                                    <div style={{ flex: 1, padding: '10px 14px', fontSize: '12px', color: '#334155' }}>{s.type}</div>
                                </div>
                                <div style={{ display: 'flex', borderBottom: '1px solid #f3e6e0' }}>
                                    <div style={{ width: '100px', padding: '10px 14px', fontWeight: '800', fontSize: '12px', color: '#0f1c5c', background: '#fffbfa', borderRight: '1px solid #f3e6e0' }}>Coverage</div>
                                    <div style={{ flex: 1, padding: '10px 14px', fontSize: '12px', color: '#334155' }}>{s.coverage || '-'}</div>
                                </div>
                                <div style={{ display: 'flex' }}>
                                    <div style={{ width: '100px', padding: '10px 14px', fontWeight: '800', fontSize: '12px', color: '#0f1c5c', background: '#fffbfa', borderRight: '1px solid #f3e6e0' }}>Eligibility</div>
                                    <div style={{ flex: 1, padding: '10px 14px', fontSize: '11px', color: '#64748b', lineHeight: 1.5 }}>
                                        {s.eligibility || '-'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 4. Endowment Cards Grid */}
            {endowmentCards.length > 0 && (selectedCategory === 'all' || selectedCategory === 'endowment') && (
                <div style={{ marginTop: '20px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: '16px'
                    }}>
                        {endowmentCards.map((e, idx) => (
                            <div
                                key={e.scholarship_id && e.scholarship_id !== 'N/A' ? e.scholarship_id : `endow-${idx}`}
                                style={{
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    padding: '16px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'space-between',
                                    minHeight: '140px',
                                    transition: 'transform 0.15s, box-shadow 0.15s'
                                }}
                            >
                                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'capitalize' }}>
                                    Endowment
                                </span>
                                <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#0f1c5c', margin: '8px 0', lineHeight: 1.4 }}>
                                    {e.name}
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    <strong style={{ fontSize: '14px', color: '#0f1c5c' }}>
                                        {formatValue(e.amount, e.currency)}
                                    </strong>
                                    <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'capitalize' }}>
                                        Endowment
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 5. Scholarship Distribution Donut Chart Section */}
            <section className="content-section" style={{ background: 'white', padding: '30px', borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #0f1c5c', paddingBottom: '12px', color: '#0f1c5c', fontWeight: 800, fontSize: '20px' }}>
                    <span style={{ color: '#ec4899', marginRight: '6px' }}>|</span> Sector-wise Placements
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#475569', textAlign: 'center', margin: '0 0 10px' }}>
                        Scholarship Distribution by Type and Academic Field
                    </h3>
                    <div style={{ display: 'flex', gap: '30px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                        {/* Doughnut Chart Canvas */}
                        <div style={{ width: '400px', height: '240px', position: 'relative' }}>
                            <canvas id="scholarshipDoughnutChart"></canvas>
                        </div>
                    </div>
                </div>
            </section>

            {/* 6. Scholarship Partners & Bodies */}
          
                    {/* Jadavpur University Emblem logo */}
                  

             
            {/* 7. Dual Header Gender-based Scholarship Applicants & Awardees Table */}
            
            {/* 8. Data Sources */}
            <section className="content-section" style={{ background: '#f8fafc', padding: '15px 20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '800', color: '#0f1c5c', margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#ec4899' }}>|</span> Data Sources
                </h3>
                <div style={{
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 18px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                }} onClick={() => website && window.open(website.startsWith('http') ? website : `https://${website}`, '_blank')}>
                    <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                        {collegeName} Scholarship Portal
                    </span>
                    <ExternalLink size={14} style={{ color: '#64748b' }} />
                </div>
            </section>
            </>
            )}
        </div>
    );
}
