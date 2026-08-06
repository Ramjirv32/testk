'use client';

import React, { useState } from 'react';
import styles from './CollegeDetailsModal.module.css';

interface CollegeDetailsModalProps {
  collegeData: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function CollegeDetailsModal({ collegeData, isOpen, onClose }: CollegeDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen || !collegeData) return null;

  const renderOverview = () => (
    <div className={styles.tabContent}>
      <div className={styles.overviewGrid}>
        {}
        <div className={styles.card}>
          <h3> Location</h3>
          <p>{collegeData.location || 'N/A'}</p>
        </div>

        {}
        <div className={styles.card}>
          <h3> Country</h3>
          <p>{collegeData.country || 'N/A'}</p>
        </div>

        {}
        <div className={styles.card}>
          <h3> Global Ranking</h3>
          <p className={styles.highlight}>{collegeData.global_ranking || 'N/A'}</p>
        </div>

        {}
        <div className={styles.card}>
          <h3> Faculty & Staff</h3>
          <p className={styles.highlight}>{collegeData.faculty_staff || 'N/A'}</p>
        </div>

        {}
        <div className={styles.card}>
          <h3> International Students</h3>
          <p className={styles.highlight}>{collegeData.international_students || '0'}</p>
        </div>

        {}
        <div className={styles.card}>
          <h3> Gender Ratio</h3>
          <p> {collegeData.student_gender_ratio?.male_percentage || '0'}% |  {collegeData.student_gender_ratio?.female_percentage || '0'}%</p>
        </div>
      </div>

      {}
      <div className={styles.summaryBox}>
        <h3> About the College</h3>
        <p>{collegeData.about || collegeData.summary || 'No information available'}</p>
      </div>

      {}
      {collegeData.summary && (
        <div className={styles.summaryBox}>
          <h3> Summary</h3>
          <p>{collegeData.summary}</p>
        </div>
      )}

      {}
      <div className={styles.section}>
        <h3> Key Statistics</h3>
        <div className={styles.overviewGrid}>
          {collegeData.student_statistics && (
            <>
              {collegeData.student_statistics
                .filter((stat: any) => stat.category.includes('Total students') && !stat.category.includes('placed'))
                .map((stat: any, idx: number) => (
                  <div key={idx} className={styles.card}>
                    <h3> {stat.category}</h3>
                    <p className={styles.highlight}>{stat.value}</p>
                  </div>
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderAcademics = () => (
    <div className={styles.tabContent}>
      {}
      {collegeData.ug_programs && collegeData.ug_programs.length > 0 && (
        <div className={styles.section}>
          <h3> Undergraduate Programs</h3>
          <div className={styles.courseList}>
            {collegeData.ug_programs.map((program: string, idx: number) => (
              <div key={idx} className={styles.courseItem}>
                <strong>{program}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      {collegeData.pg_programs && collegeData.pg_programs.length > 0 && (
        <div className={styles.section}>
          <h3> Postgraduate Programs</h3>
          <div className={styles.courseList}>
            {collegeData.pg_programs.map((program: string, idx: number) => (
              <div key={idx} className={styles.courseItem}>
                <strong>{program}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      {collegeData.phd_programs && collegeData.phd_programs.length > 0 && (
        <div className={styles.section}>
          <h3> PhD Programs</h3>
          <div className={styles.courseList}>
            {collegeData.phd_programs.map((program: string, idx: number) => (
              <div key={idx} className={styles.courseItem}>
                <strong>{program}</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {}
      {collegeData.departments && collegeData.departments.length > 0 && (
        <div className={styles.section}>
          <h3> Departments</h3>
          <div className={styles.deptList}>
            <ul>
              {collegeData.departments.map((dept: string, idx: number) => (
                <li key={idx}>{dept}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  const renderPlacements = () => {

    const allStats = [...(collegeData.student_statistics || []), ...(collegeData.additional_details || [])];
    
    const getStatValue = (category: string) => {
      const stat = allStats.find((s: any) => s.category.toLowerCase().includes(category.toLowerCase()));
      return stat?.value || 'N/A';
    };

    const placementRate = getStatValue('placement rate');
    const totalPlaced = getStatValue('total students placed');
    const ugPlaced = getStatValue('ug 4-year students placed');
    const pgPlaced = getStatValue('pg 2-year students placed');
    const medianCTC = getStatValue('median ctc');
    const ugCTC = getStatValue('median ctc (ug 4-year');
    const pgCTC = getStatValue('median ctc (pg 2-year');

    return (
      <div className={styles.tabContent}>
        <div className={styles.placementGrid}>
          <div className={styles.placementCard}>
            <h4> Placement Rate</h4>
            <p className={styles.placementValue}>{placementRate}%</p>
          </div>
          <div className={styles.placementCard}>
            <h4> Total Placed</h4>
            <p className={styles.placementValue}>{totalPlaced}</p>
          </div>
          <div className={styles.placementCard}>
            <h4> UG Placed</h4>
            <p className={styles.placementValue}>{ugPlaced}</p>
          </div>
          <div className={styles.placementCard}>
            <h4> PG Placed</h4>
            <p className={styles.placementValue}>{pgPlaced}</p>
          </div>
          <div className={styles.placementCard}>
            <h4> Median CTC</h4>
            <p className={styles.placementValue}>{medianCTC}</p>
          </div>
          <div className={styles.placementCard}>
            <h4> UG Median CTC</h4>
            <p className={styles.placementValue}>{ugCTC}</p>
          </div>
        </div>

        {}
        <div className={styles.section}>
          <h3> Detailed Student Statistics</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              marginTop: '15px'
            }}>
              <thead style={{ backgroundColor: '#f0f0f0' }}>
                <tr>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Category</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Value</th>
                </tr>
              </thead>
              <tbody>
                {collegeData.student_statistics?.map((stat: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{stat.category}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', color: '#667eea' }}>
                      {stat.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {}
        {collegeData.additional_details && collegeData.additional_details.length > 0 && (
          <div className={styles.section}>
            <h3> Additional Details</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '15px'
              }}>
                <thead style={{ backgroundColor: '#f0f0f0' }}>
                  <tr>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>Category</th>
                    <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {collegeData.additional_details.map((detail: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #ddd' }}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{detail.category}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold', color: '#667eea' }}>
                        {detail.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderContact = () => (
    <div className={styles.tabContent}>
      <div className={styles.contactCard}>
        <h3> Contact Information</h3>
        {collegeData.contact?.website && (
          <p>
            <strong>Website:</strong>{' '}
            <a href={collegeData.contact.website} target="_blank" rel="noopener noreferrer">
              {collegeData.contact.website}
            </a>
          </p>
        )}
        {collegeData.contact?.email && (
          <p>
            <strong>Email:</strong> <a href={`mailto:${collegeData.contact.email}`}>{collegeData.contact.email}</a>
          </p>
        )}
        {collegeData.contact?.phone && <p><strong>Phone:</strong> {collegeData.contact.phone}</p>}
        {collegeData.contact?.address && <p><strong>Address:</strong> {collegeData.contact.address}</p>}
      </div>

      {collegeData.contact?.social_media && Object.keys(collegeData.contact.social_media).length > 0 && (
        <div className={styles.socialLinks}>
          <h3>Social Media</h3>
          {Object.entries(collegeData.contact.social_media).map(([platform, link]: [string, any]) => (
            <a key={platform} href={link} target="_blank" rel="noopener noreferrer" className={styles.socialLink}>
              {platform.charAt(0).toUpperCase() + platform.slice(1)}
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const renderFeesAndScholarships = () => (
    <div className={styles.tabContent}>
      {}
      {collegeData.fees && (
        <div className={styles.section}>
          <h3> Fees (Yearly)</h3>
          <div className={styles.placementGrid}>
            {collegeData.fees.ug_yearly_min && (
              <div className={styles.placementCard}>
                <h4> UG Fee Range</h4>
                <p className={styles.placementValue}>
                  ₹{collegeData.fees.ug_yearly_min?.toLocaleString()} - ₹{collegeData.fees.ug_yearly_max?.toLocaleString()}
                </p>
              </div>
            )}
            {collegeData.fees.pg_yearly_min && (
              <div className={styles.placementCard}>
                <h4> PG Fee Range</h4>
                <p className={styles.placementValue}>
                  ₹{collegeData.fees.pg_yearly_min?.toLocaleString()} - ₹{collegeData.fees.pg_yearly_max?.toLocaleString()}
                </p>
              </div>
            )}
            {collegeData.fees.phd_yearly_min !== undefined && (
              <div className={styles.placementCard}>
                <h4> PhD Fee Range</h4>
                <p className={styles.placementValue}>
                  ₹{collegeData.fees.phd_yearly_min?.toLocaleString()} - ₹{collegeData.fees.phd_yearly_max?.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {}
      {collegeData.scholarships && collegeData.scholarships.length > 0 && (
        <div className={styles.section}>
          <h3> Available Scholarships</h3>
          <div className={styles.recruitersList}>
            {collegeData.scholarships.map((scholarship: string, idx: number) => (
              <span key={idx} className={styles.recruiterTag}>{scholarship}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const tabs = [
    { id: 'overview', label: ' Overview', content: renderOverview },
    { id: 'academics', label: ' Academics', content: renderAcademics },
    { id: 'placements', label: ' Placements', content: renderPlacements },
    { id: 'fees-scholarships', label: ' Fees & Scholarships', content: renderFeesAndScholarships },
    { id: 'contact', label: ' Contact', content: renderContact }
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{collegeData.college_name}</h2>
          <button className={styles.closeBtn} onClick={onClose}></button>
        </div>

        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className={styles.content}>
          {tabs.find(tab => tab.id === activeTab)?.content()}
        </div>
      </div>
    </div>
  );
}
