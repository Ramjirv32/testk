'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { GRE_API_URL } from '@/lib/config';

interface Student {
  id: string;
  email: string;
  name: string;
  created_at: string;
  total_tests: string;
  completed_tests: string;
}

export default function GreStudentsPage() {
  const { token } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '100');
      if (search) params.append('search', search);
      const res = await fetch(`${GRE_API_URL}/api/admin/students?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const list = data.data?.students || data.students || data.data || [];
        setStudents(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    if (token) fetchStudents();
  }, [token, fetchStudents]);

  const filtered = students.filter(s => {
    const q = search.toLowerCase();
    return !q || (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / limit));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  const formatDate = (d: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <AdminLayout>
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#2d2d2d', margin: 0 }}>GRE Students</h1>
        <p style={{ color: '#6c757d', fontSize: '14px', margin: '4px 0 0' }}>View all registered GRE students and their test statistics</p>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #ede9e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ padding: '8px 16px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '13px', width: '300px', outline: 'none' }}
          />
          <span style={{ fontSize: '13px', color: '#6c757d' }}>{filtered.length} students</span>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>Loading...</div>
        ) : paginated.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>No students found</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#faf4ec' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>S.No.</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tests Allocated</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Tests Completed</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2d2d2d' }}>{(page - 1) * limit + i + 1}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: '#2d2d2d' }}>{s.name || 'N/A'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#5a5a5a' }}>{s.email}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#5a5a5a' }}>{s.total_tests || 0}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#5a5a5a' }}>{s.completed_tests || 0}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#5a5a5a' }}>{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid #ede9e4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#6c757d' }}>Page {page} of {totalPages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '6px 16px', border: '1px solid #ede9e4', borderRadius: '6px', background: 'white', cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#2d2d2d', opacity: page === 1 ? 0.5 : 1 }}>Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '6px 16px', border: '1px solid #ede9e4', borderRadius: '6px', background: 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: '#2d2d2d', opacity: page === totalPages ? 0.5 : 1 }}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
    </AdminLayout>
  );
}
