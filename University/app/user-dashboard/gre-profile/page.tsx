'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import StudentLayout from '@/components/student/StudentLayout';
import { GRE_API_URL } from '@/lib/config';

export default function StudentProfilePage() {
  const { user, token, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit profile state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [fullName, setFullName] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('+91 98765 43210');
  const [targetScore, setTargetScore] = useState<number>(330);
  const [targetDate, setTargetDate] = useState<string>('2026-11-15');
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string>('');

  useEffect(() => {
    if (user) {
      setFullName(user.name || user.email?.split('@')[0] || 'Student');
    }
  }, [user]);

  useEffect(() => {
    if (!token) return;
    fetchProfileData();
  }, [token]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${GRE_API_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const pUser = data.data || data.user || {};
        setProfileData(pUser);
        if (pUser.name || pUser.full_name) setFullName(pUser.name || pUser.full_name);
        if (pUser.mobile_number) setMobileNumber(pUser.mobile_number);
        if (pUser.target_score) setTargetScore(pUser.target_score);
        if (pUser.target_date) setTargetDate(pUser.target_date);
      }
    } catch (err) {
      console.error('Failed to fetch profile data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage('');
    try {
      const response = await fetch(`${GRE_API_URL}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName,
          name: fullName,
          mobile_number: mobileNumber,
          target_score: targetScore,
          target_date: targetDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updatedUser = data.user || data.data;
        if (updatedUser) {
          localStorage.setItem('user', JSON.stringify({ ...user, name: fullName }));
        }
        setIsEditing(false);
        setSaveMessage('Profile information saved successfully!');
        setTimeout(() => setSaveMessage(''), 4000);
      } else {
        setSaveMessage('Failed to save profile changes');
      }
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setSaveMessage('Failed to save profile changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StudentLayout>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '28px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {/* Header Profile Banner */}
        <div style={{
          backgroundColor: '#fdf2f8', border: '1px solid #fbcfe8', borderRadius: '12px', padding: '24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '28px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#e61a8d', color: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '24px',
              boxShadow: '0 4px 12px rgba(230,26,141,0.3)'
            }}>
              {(fullName || 'S').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#2d2d2d', margin: 0 }}>
                {fullName}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '13px', margin: '4px 0 0 0' }}>
                {user?.email || 'student@gre.com'} • Student Portal
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            style={{
              padding: '10px 20px', backgroundColor: isEditing ? '#6b7280' : '#e61a8d', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer'
            }}
          >
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>

        {saveMessage && (
          <div style={{
            backgroundColor: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46',
            padding: '14px 18px', borderRadius: '8px', marginBottom: '24px', fontSize: '13px', fontWeight: '600'
          }}>
            {saveMessage}
          </div>
        )}

        {/* Profile Content */}
        {isEditing ? (
          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#5a5a5a', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#5a5a5a', marginBottom: '6px' }}>
                Mobile Number
              </label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#5a5a5a', marginBottom: '6px' }}>
                  Target GRE Score (260 - 340)
                </label>
                <input
                  type="number"
                  min="260"
                  max="340"
                  value={targetScore}
                  onChange={(e) => setTargetScore(Number(e.target.value))}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#5a5a5a', marginBottom: '6px' }}>
                  Target Test Date
                </label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #ede9e4', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '12px 24px', backgroundColor: '#e61a8d', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '700', cursor: 'pointer',
                opacity: saving ? 0.6 : 1, width: 'fit-content'
              }}
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: '#fafafa', padding: '20px', borderRadius: '12px', border: '1px solid #ede9e4' }}>
              <p style={{ color: '#5a5a5a', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Full Name</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#2d2d2d', margin: 0 }}>{fullName}</p>
            </div>

            <div style={{ backgroundColor: '#fafafa', padding: '20px', borderRadius: '12px', border: '1px solid #ede9e4' }}>
              <p style={{ color: '#5a5a5a', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Email Address</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#2d2d2d', margin: 0 }}>{user?.email || 'student@gre.com'}</p>
            </div>

            <div style={{ backgroundColor: '#fafafa', padding: '20px', borderRadius: '12px', border: '1px solid #ede9e4' }}>
              <p style={{ color: '#5a5a5a', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Target Score</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#e61a8d', margin: 0 }}>{targetScore} / 340</p>
            </div>

            <div style={{ backgroundColor: '#fafafa', padding: '20px', borderRadius: '12px', border: '1px solid #ede9e4' }}>
              <p style={{ color: '#5a5a5a', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 6px 0' }}>Target Test Date</p>
              <p style={{ fontSize: '16px', fontWeight: '700', color: '#2d2d2d', margin: 0 }}>{targetDate}</p>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
