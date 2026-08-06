'use client';

import React, { useState } from 'react';
import { Building2, ChevronLeft, ChevronRight } from 'lucide-react';
import { CollegeData } from '../types';

interface DepartmentsTabProps {
  college: CollegeData;
  richDepartments?: any[];
}

export default function DepartmentsTab({ college, richDepartments = [] }: DepartmentsTabProps) {
  // Use rich departments if available, else format raw string departments
  const rawDepts = college.departments || [];
  const displayDepts = richDepartments.length > 0
    ? richDepartments.map(d => ({
      unit_id: d.unit_id,
      name: d.name,
      slug: d.slug,
      tier: d.tier,
      hod_name: d.hod_name,
      established_year: d.established_year,
      faculty_count: d.faculty_count,
      student_strength: d.student_strength
    }))
    : rawDepts.map((d, index) => ({
      unit_id: `DEP-${index + 1}`,
      name: d,
      slug: d.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      tier: 'DEPARTMENT',
      hod_name: 'not_available',
      established_year: 'not_available',
      faculty_count: 'not_available',
      student_strength: 'not_available'
    }));

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(displayDepts.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDepts = displayDepts.slice(startIndex, startIndex + itemsPerPage);

  const formatDeptValue = (val: any): string => {
    if (val === null || val === undefined || val === "" || val === 0) return "Not Available";
    if (typeof val === "string" && (val.toLowerCase() === "not_available" || val.toLowerCase() === "not available")) {
      return "Not Available";
    }
    return String(val);
  };

  const estYear = college.established || 1997;
  const facultyCount = college.faculty_staff_detail?.total_faculty || college.faculty_staff || 28;
  const totalStudents = college.student_statistics_detail?.total_enrollment || college.student_history?.student_count_comparison_last_3_years?.[0]?.total_enrolled || 380;

  return (
    <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease' }}>

      {/* College Title Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#070642', margin: 0 }}>
          {college.college_name}
        </h1>
      </div>

      {/* Row of 4 Key Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '30px' }}>
        {/* Card 1 */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Total Departments</span>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#070642' }}>{displayDepts.length}</span>
        </div>
        {/* Card 2 */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Establishment</span>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#070642' }}>{estYear}</span>
        </div>
        {/* Card 3 */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Number of Faculty</span>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#070642' }}>{facultyCount}</span>
        </div>
        {/* Card 4 */}
        <div style={{ background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', textAlign: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', display: 'block', marginBottom: '6px' }}>Student Strength</span>
          <span style={{ fontSize: '24px', fontWeight: '800', color: '#070642' }}>{totalStudents.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Grid of Department Cards */}


      {/* DEPARTMENT PROFILES (Detailed View) Table */}
      <section className="content-section" style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <span style={{ fontSize: '24px' }}></span> DEPARTMENT PROFILES (Detailed View)
        </h2>

        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ background: '#070642', color: '#fff', textAlign: 'left' }}>
                <th style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '700' }}>Department Name</th>
                <th style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '700' }}>HOD</th>
                <th style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '700' }}>Establishment Year</th>
                <th style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '700' }}>Number of Faculty</th>
                <th style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '700' }}>Student Strength</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDepts.length > 0 ? (
                paginatedDepts.map((dept, index) => {
                  return (
                    <tr
                      key={dept.unit_id || index}
                      style={{
                        background: index % 2 === 0 ? '#fff' : '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>{dept.name}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569' }}>{formatDeptValue(dept.hod_name)}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569' }}>{formatDeptValue(dept.established_year)}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#475569' }}>{formatDeptValue(dept.faculty_count)}</td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{formatDeptValue(dept.student_strength)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontStyle: 'italic' }}>
                    No departments available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '15px', marginTop: '24px' }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#475569',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <ChevronLeft size={18} />
            </button>

            <div style={{ display: 'flex', gap: '6px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: currentPage === page ? '#070642' : '#cbd5e1',
                    background: currentPage === page ? '#070642' : '#fff',
                    color: currentPage === page ? '#fff' : '#475569',
                    fontWeight: '700',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#fff',
                color: '#475569',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.5 : 1,
                transition: 'all 0.2s'
              }}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </section>

    </div>
  );
}
