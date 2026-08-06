'use client';

import React, { useState } from 'react';
import { GraduationCap, BookOpen, Microscope, Monitor, FileText, Eye, Info, Search } from 'lucide-react';
import { formatCurrency } from '../types';

interface TuitionFee {
  amount: number;
  currency: string;
  fee_cycle: string;
}

interface Course {
  course_id: string;
  college_id: string;
  collection_name: string;
  level: string;
  level_keywords: string[];
  title: string;
  department: string;
  mode: string;
  duration_months: number;
  intake: string[];
  deadline: string;
  tuition_fee: TuitionFee;
  curriculum_link: string;
}

interface ProgramsTabProps {
  college: any;
  ugCourses: Course[];
  pgCourses: Course[];
  phdCourses: Course[];
  onlineCourses: Course[];
  additionalCourses: Course[];
}

export default function ProgramsTab({
  college,
  ugCourses = [],
  pgCourses = [],
  phdCourses = [],
  onlineCourses = [],
  additionalCourses = [],
}: ProgramsTabProps) {
  const [activeCategory, setActiveCategory] = useState<'ug' | 'pg' | 'phd' | 'online' | 'additional'>('ug');
  const [searchTerm, setSearchTerm] = useState('');

  // NO FALLBACKS - Use only provided course data or empty array
  const getDisplayCourses = () => {
    switch (activeCategory) {
      case 'ug':
        return ugCourses || [];
      case 'pg':
        return pgCourses || [];
      case 'phd':
        return phdCourses || [];
      case 'online':
        return onlineCourses || [];
      case 'additional':
        return additionalCourses || [];
      default:
        return [];
    }
  };

  const currentCourses = getDisplayCourses();

  // Stats calculation - NO FALLBACKS
  const ugCount = ugCourses.length;
  const pgCount = pgCourses.length;
  const phdCount = phdCourses.length;
  const onlineCount = onlineCourses.length;
  const additionalCount = additionalCourses.length;
  const totalPrograms = ugCount + pgCount + phdCount + onlineCount + additionalCount;

  // Pie chart calculation (UG, PG, PhD proportions)
  const chartTotal = ugCount + pgCount + phdCount;
  const ugPercent = chartTotal > 0 ? (ugCount / chartTotal) * 100 : 0;
  const pgPercent = chartTotal > 0 ? (pgCount / chartTotal) * 100 : 0;
  const phdPercent = chartTotal > 0 ? (phdCount / chartTotal) * 100 : 0;

  // SVG calculations for Doughnut segment offsets
  const radius = 50;
  const circ = 2 * Math.PI * radius; // 314.16
  const ugStroke = (ugPercent / 100) * circ;
  const pgStroke = (pgPercent / 100) * circ;
  const phdStroke = (phdPercent / 100) * circ;

  const ugOffset = 0;
  const pgOffset = -ugStroke;
  const phdOffset = -(ugStroke + pgStroke);

  // Formatting helpers
  const formatFeeVal = (amt: number) => {
    if (!amt) return '-';
    return amt.toLocaleString('en-IN');
  };

  return (
    <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease' }}>
      
      {/* 1. Student Statistics Section */}
      <section className="content-section" style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <h2 className="section-title" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}></span> Student Statistics
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginTop: '20px' }}>
          
          {/* Left: Program Statistics Donut */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #f1f5f9', paddingRight: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#070642', marginBottom: '20px', width: '100%', textAlign: 'left' }}>Program Statistics</h3>
            
            <div style={{ position: 'relative', width: '200px', height: '200px' }}>
              <svg width="200" height="200" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                {/* Background Ring */}
                <circle cx="60" cy="60" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth="16" />
                
                {/* UG Segment */}
                {ugCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="#070642"
                    strokeWidth="16"
                    strokeDasharray={`${ugStroke} ${circ}`}
                    strokeDashoffset={ugOffset}
                    style={{ transition: 'stroke-dasharray 0.5s' }}
                  />
                )}
                
                {/* PG Segment */}
                {pgCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="#9a3197"
                    strokeWidth="16"
                    strokeDasharray={`${pgStroke} ${circ}`}
                    strokeDashoffset={pgOffset}
                    style={{ transition: 'stroke-dasharray 0.5s' }}
                  />
                )}
                
                {/* PhD Segment */}
                {phdCount > 0 && (
                  <circle
                    cx="60"
                    cy="60"
                    r={radius}
                    fill="transparent"
                    stroke="#e084cd"
                    strokeWidth="16"
                    strokeDasharray={`${phdStroke} ${circ}`}
                    strokeDashoffset={phdOffset}
                    style={{ transition: 'stroke-dasharray 0.5s' }}
                  />
                )}
              </svg>
              
              {/* Center Details */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#070642', display: 'block' }}>{ugCount + pgCount + phdCount}</span>
                <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Courses</span>
              </div>
            </div>
          </div>
          
          {/* Right: Program Details Table */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#070642', marginBottom: '20px' }}>Program Details</h3>
                       <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                  <th style={{ padding: '8px 12px', fontSize: '13px', color: '#64748b', fontWeight: '600' }}>Program Name</th>
                  <th style={{ padding: '8px 12px', fontSize: '13px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Total #</th>
                  <th style={{ padding: '8px 12px', fontSize: '13px', color: '#64748b', fontWeight: '600', textAlign: 'right' }}>Students Enrolled</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1a202c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#070642', display: 'inline-block' }} />
                    Undergraduate Programs (UG)
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1a202c', textAlign: 'right', fontWeight: '600' }}>{ugCount}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#64748b', textAlign: 'right' }}>
                    {college.student_statistics_detail?.ug_students !== undefined && college.student_statistics_detail?.ug_students !== -1 ? college.student_statistics_detail.ug_students.toLocaleString() : '-'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1a202c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#9a3197', display: 'inline-block' }} />
                    Postgraduate Programs (PG)
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1a202c', textAlign: 'right', fontWeight: '600' }}>{pgCount}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#64748b', textAlign: 'right' }}>
                    {college.student_statistics_detail?.pg_students !== undefined && college.student_statistics_detail?.pg_students !== -1 ? college.student_statistics_detail.pg_students.toLocaleString() : '-'}
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1a202c', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#e084cd', display: 'inline-block' }} />
                    Doctoral Programs (PhD)
                  </td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#1a202c', textAlign: 'right', fontWeight: '600' }}>{phdCount}</td>
                  <td style={{ padding: '12px', fontSize: '14px', color: '#64748b', textAlign: 'right' }}>
                    {college.student_statistics_detail?.phd_students !== undefined && college.student_statistics_detail?.phd_students !== -1 ? college.student_statistics_detail.phd_students.toLocaleString() : '-'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 2. Filter by Program Category Section */}
      <section className="content-section" style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <span style={{ fontSize: '24px' }}></span> Filter by Program Category
        </h2>

        {/* Categories Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '30px' }}>
          {/* UG */}
          <button
            onClick={() => setActiveCategory('ug')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 8px',
              borderRadius: '12px',
              border: activeCategory === 'ug' ? '2px solid #070642' : '1px solid #e2e8f0',
              backgroundColor: activeCategory === 'ug' ? '#070642' : '#fff',
              color: activeCategory === 'ug' ? '#fff' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeCategory === 'ug' ? '0 8px 16px rgba(7,6,66,0.15)' : 'none'
            }}
          >
            <GraduationCap size={24} style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>UG (Undergraduate)</span>
            <span style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>({ugCount})</span>
          </button>

          {/* PG */}
          <button
            onClick={() => setActiveCategory('pg')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 8px',
              borderRadius: '12px',
              border: activeCategory === 'pg' ? '2px solid #9a3197' : '1px solid #e2e8f0',
              backgroundColor: activeCategory === 'pg' ? '#9a3197' : '#fff',
              color: activeCategory === 'pg' ? '#fff' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeCategory === 'pg' ? '0 8px 16px rgba(154,49,151,0.15)' : 'none'
            }}
          >
            <BookOpen size={24} style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>PG (Postgraduate)</span>
            <span style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>({pgCount})</span>
          </button>

          {/* PhD */}
          <button
            onClick={() => setActiveCategory('phd')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 8px',
              borderRadius: '12px',
              border: activeCategory === 'phd' ? '2px solid #e084cd' : '1px solid #e2e8f0',
              backgroundColor: activeCategory === 'phd' ? '#e084cd' : '#fff',
              color: activeCategory === 'phd' ? '#fff' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeCategory === 'phd' ? '0 8px 16px rgba(224,132,205,0.15)' : 'none'
            }}
          >
            <Microscope size={24} style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>PhD (Doctoral)</span>
            <span style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>({phdCount})</span>
          </button>

          {/* Online */}
          <button
            onClick={() => setActiveCategory('online')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 8px',
              borderRadius: '12px',
              border: activeCategory === 'online' ? '2px solid #0284c7' : '1px solid #e2e8f0',
              backgroundColor: activeCategory === 'online' ? '#0284c7' : '#fff',
              color: activeCategory === 'online' ? '#fff' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeCategory === 'online' ? '0 8px 16px rgba(2,132,199,0.15)' : 'none'
            }}
          >
            <Monitor size={24} style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Online Courses</span>
            <span style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>({onlineCount})</span>
          </button>

          {/* Additional */}
          <button
            onClick={() => setActiveCategory('additional')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px 8px',
              borderRadius: '12px',
              border: activeCategory === 'additional' ? '2px solid #0f766e' : '1px solid #e2e8f0',
              backgroundColor: activeCategory === 'additional' ? '#0f766e' : '#fff',
              color: activeCategory === 'additional' ? '#fff' : '#64748b',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: activeCategory === 'additional' ? '0 8px 16px rgba(15,118,110,0.15)' : 'none'
            }}
          >
            <FileText size={24} style={{ marginBottom: '8px' }} />
            <span style={{ fontSize: '13px', fontWeight: '700' }}>Additional</span>
            <span style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>({additionalCount})</span>
          </button>
        </div>

        {/* Search Input for courses */}
        <div style={{ position: 'relative', marginBottom: '24px', maxWidth: '400px' }}>
          <input
            type="text"
            placeholder="Search programs in this category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#1e293b',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
          />
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: '#94a3b8' }} />
        </div>

        {/* Table Title */}
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#070642', marginBottom: '16px', textTransform: 'capitalize' }}>
          {activeCategory === 'ug' ? 'Undergraduate Programs' : activeCategory === 'pg' ? 'Postgraduate Programs' : activeCategory === 'phd' ? 'Doctoral (PhD) Programs' : activeCategory === 'online' ? 'Online Programs' : 'Additional Programs'} ({currentCourses.length})
        </h3>

        {/* Courses Table with Alternating Colors */}
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1', textAlign: 'left' }}>
                <th style={{ padding: '16px 20px', fontSize: '14px', color: '#475569', fontWeight: '700' }}>Course Name</th>
                <th style={{ padding: '16px 20px', fontSize: '14px', color: '#475569', fontWeight: '700' }}>Department</th>
                <th style={{ padding: '16px 20px', fontSize: '14px', color: '#475569', fontWeight: '700' }}>Duration</th>
                <th style={{ padding: '16px 20px', fontSize: '14px', color: '#475569', fontWeight: '700' }}>Annual Fee</th>
                <th style={{ padding: '16px 20px', fontSize: '14px', color: '#475569', fontWeight: '700' }}>Mode</th>
                <th style={{ padding: '16px 20px', fontSize: '14px', color: '#475569', fontWeight: '700', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentCourses.length > 0 ? (
                currentCourses.map((c, idx) => {
                  // Alternating background colors matching the image (light blue, light purple, light yellow/beige, and white)
                  let rowBg = '#fff';
                  if (idx % 4 === 0) rowBg = '#f0f7ff'; // soft blue
                  else if (idx % 4 === 1) rowBg = '#faf5ff'; // soft purple
                  else if (idx % 4 === 2) rowBg = '#fefdf0'; // soft yellow/beige
                  
                  const isCurriculum = c.curriculum_link && c.curriculum_link !== 'not_available' && c.curriculum_link.startsWith('http');
                  
                  const durationYears = c.duration_months > 0 ? `${(c.duration_months / 12).toFixed(0)} Years` : '3 Years';
                  const annualFee = c.tuition_fee?.amount > 0 ? formatCurrency(c.tuition_fee.amount, c.tuition_fee.currency || 'INR') : 'N/A';

                  return (
                    <tr key={c.course_id || idx} style={{ background: rowBg, borderBottom: '1px solid #e2e8f0', transition: 'background-color 0.2s' }}>
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{c.title}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569' }}>{c.department || 'English'}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569' }}>{durationYears}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{annualFee}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569' }}>{c.mode || 'Regular'}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                        {isCurriculum ? (
                          <a
                            href={c.curriculum_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              background: '#0284c7',
                              color: '#fff',
                              fontSize: '13px',
                              fontWeight: '600',
                              textDecoration: 'none',
                              transition: 'all 0.2s'
                            }}
                            className="btn-action-blue"
                          >
                            <Eye size={14} /> View Details
                          </a>
                        ) : (
                          <button
                            onClick={() => alert(`Course Details:\nTitle: ${c.title}\nDepartment: ${c.department || 'General'}\nMode: ${c.mode || 'Regular'}\nDuration: ${durationYears}\nFee: ${annualFee}`)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '8px 16px',
                              borderRadius: '6px',
                              background: '#a21caf',
                              color: '#fff',
                              border: 'none',
                              fontSize: '13px',
                              fontWeight: '600',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            className="btn-action-purple"
                          >
                            <Info size={14} /> Other Info
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                    No courses matching filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
