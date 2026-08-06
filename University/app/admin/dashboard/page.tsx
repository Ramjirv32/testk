'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { API_URL, GRE_API_URL } from '@/lib/config';
import { Users, FileText, CheckCircle2, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface DashboardStats {
  total_students: number;
  pending_tickets: number;
  total_allocations: number;
  total_questions: number;
  approved_colleges?: number;
}

export default function AdminDashboardPage() {
  const { token, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total_students: 0,
    pending_tickets: 0,
    total_allocations: 0,
    total_questions: 0,
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token && isAdmin()) {
      fetchStats();
    }
  }, [token, isAdmin]);

  const fetchStats = async () => {
    try {
      let res = await fetch(`${GRE_API_URL}/api/admin/dashboard-stats`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!res.ok) {
        try {
          res = await fetch(`${API_URL}/api/admin/dashboard-stats`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
        } catch {}
      }

      if (res && res.ok) {
        const data = await res.json();
        setStats(data.data || data);
      }
    } catch (err) {
      console.error('Failed to fetch admin stats', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header Card */}
        <div className="bg-gradient-to-r from-[#070642] to-[#1a0f5c] rounded-lg p-6 text-white shadow-lg">
          <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
          <p className="text-slate-300 text-sm">Welcome to the University Admin Dashboard - Manage tests, allocations, and student progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Students</p>
                <h3 className="text-2xl font-bold text-slate-900 mt-1">{loading ? '...' : stats.total_students}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Tickets</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-1">{loading ? '...' : stats.pending_tickets}</h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Total Allocations</p>
                <h3 className="text-2xl font-bold text-emerald-600 mt-1">{loading ? '...' : stats.total_allocations}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Question Bank</p>
                <h3 className="text-2xl font-bold text-indigo-600 mt-1">{loading ? '...' : stats.total_questions}</h3>
              </div>
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/gre-tickets" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all group">
            <h4 className="font-bold text-slate-900 text-base mb-2 group-hover:text-blue-600 transition-colors flex items-center justify-between">
              GRE Test Request Tickets
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Review student test request tickets, approve via Manual or Auto allocation modes, or reject requests with notes.
            </p>
          </Link>

          <Link href="/admin/gre-question-bank" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all group">
            <h4 className="font-bold text-slate-900 text-base mb-2 group-hover:text-blue-600 transition-colors flex items-center justify-between">
              Question Bank Management
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Browse all questions, filter across categories and levels, edit options, answers, explanations, and diagram image URLs.
            </p>
          </Link>

          <Link href="/admin/gre-allocations" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all group">
            <h4 className="font-bold text-slate-900 text-base mb-2 group-hover:text-blue-600 transition-colors flex items-center justify-between">
              Allocations & Anti-Cheat Audit
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              Inspect test allocations, review completion scores, detailed student responses, and security logs.
            </p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
