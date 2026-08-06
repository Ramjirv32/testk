'use client';

import React, { useState } from 'react';
import { FileText, CreditCard, CheckSquare, Upload, Search, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { getCurrencySymbol } from '../types';

interface AdmissionsTabProps {
  admissions: any[];
  college: any;
}

export default function AdmissionsTab({ admissions = [], college = {} }: AdmissionsTabProps) {
  const adm = admissions[0] || {};
  const [openStep, setOpenStep] = useState<number | null>(null);

  //  Data extraction with no hardcoded fallbacks 
  const ugTests: string[] = adm.standardized_tests?.undergraduate || [];
  const pgTests: string[] = adm.standardized_tests?.postgraduate || [];
  const phdTests: string[] = adm.standardized_tests?.phd || [];

  const importantDates: any[] = adm.important_dates || [];
  const processSteps: any[] = adm.admission_process_steps || [];
  const mandatoryDocs: string[] = adm.mandatory_documents || [];
  const pgDocs: string[] = adm.additional_documents_pg || [];
  const paymentMethods: string[] = adm.payment_methods || [];
  const officialLinks: any = adm.official_links || {};

  const meritCriteria: any = adm.merit_criteria || {};
  const ugMerit = meritCriteria.undergraduate || {};
  const pgMerit = meritCriteria.postgraduate || {};

  const collegeUrl = officialLinks.official_website || college.website || '';
  const admissionsUrl = officialLinks.admissions_page || (college.website ? `${college.website.replace(/\/$/, '')}/admission` : '');
  const applicationPortal = officialLinks.application_portal || admissionsUrl || collegeUrl;

  // Application fee — check all possible currency keys
  const getFeeDisplay = (level: 'UG' | 'PG'): string | null => {
    // Check generic key pattern
    const feeKey = Object.keys(adm).find(k => k.startsWith('application_fee_'));
    if (feeKey) {
      const currency = feeKey.split('application_fee_')[1].toUpperCase();
      const symbol = getCurrencySymbol(currency);
      const val = adm[feeKey];
      if (val !== null && val !== undefined && val !== '') {
        return `${symbol}${val.toLocaleString()}`;
      }
    }
    if (adm.application_fee_inr) return `₹${adm.application_fee_inr.toLocaleString()}`;
    if (adm.application_fee_usd) return `$${adm.application_fee_usd}`;
    if (adm.application_fee_gbp) return `£${adm.application_fee_gbp}`;
    return null;
  };

  const feeDisplay = getFeeDisplay('UG');

  const proficiency = adm.english_proficiency || {};

  //  Colour palette for date steps 
  const dotColors = ['#070642', '#9a3197', '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#6366f1'];

  const stepIcons = [
    <FileText size={16} />, <Upload size={16} />, <CreditCard size={16} />,
    <Search size={16} />, <CheckSquare size={16} />, <FileText size={16} />,
    <Search size={16} />, <CheckSquare size={16} />
  ];

  return (
    <div className="tab-content" style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: '30px' }}>

      {/*  Row 1: General Requirements & English Proficiency  */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>

        {/* General Requirements */}
        {adm.general_requirements && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#070642', marginBottom: '16px' }}> General Requirements</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.8', color: '#475569' }}>{adm.general_requirements}</p>
          </div>
        )}

        {/* English Proficiency */}
        {(proficiency.ielts_min || proficiency.toefl_min || proficiency.duolingo_min || proficiency.pte_min) && (
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#070642', marginBottom: '20px' }}> English Proficiency Minimums</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '16px' }}>
              {proficiency.ielts_min && (
                <div style={{ background: 'linear-gradient(135deg, #eef2ff, #fff)', borderRadius: '12px', padding: '16px', border: '1px solid #c7d2fe', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#4338ca' }}>{proficiency.ielts_min}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: 4 }}>IELTS</div>
                </div>
              )}
              {proficiency.toefl_min && (
                <div style={{ background: 'linear-gradient(135deg, #f0fdf4, #fff)', borderRadius: '12px', padding: '16px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#15803d' }}>{proficiency.toefl_min}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: 4 }}>TOEFL</div>
                </div>
              )}
              {proficiency.duolingo_min && (
                <div style={{ background: 'linear-gradient(135deg, #fefce8, #fff)', borderRadius: '12px', padding: '16px', border: '1px solid #fde68a', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#b45309' }}>{proficiency.duolingo_min}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: 4 }}>Duolingo</div>
                </div>
              )}
              {proficiency.pte_min && (
                <div style={{ background: 'linear-gradient(135deg, #fdf4ff, #fff)', borderRadius: '12px', padding: '16px', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#7c3aed' }}>{proficiency.pte_min}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', marginTop: 4 }}>PTE</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/*  Row 2: Standardized Tests  */}
      {(ugTests.length > 0 || pgTests.length > 0 || phdTests.length > 0) && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#070642', marginBottom: '20px' }}> Entrance Exams & Standardized Tests</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            {ugTests.length > 0 && (
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#070642', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid #070642', paddingBottom: '6px', marginBottom: '12px' }}>Undergraduate (UG)</h4>
                <ul style={{ paddingLeft: 0, listStyleType: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {ugTests.map((test: string, i: number) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#334155' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#070642', flexShrink: 0, marginTop: 6 }} />
                      {test}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pgTests.length > 0 && (
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#9a3197', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid #9a3197', paddingBottom: '6px', marginBottom: '12px' }}>Postgraduate (PG)</h4>
                <ul style={{ paddingLeft: 0, listStyleType: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pgTests.map((test: string, i: number) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#334155' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#9a3197', flexShrink: 0, marginTop: 6 }} />
                      {test}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {phdTests.length > 0 && (
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.6px', borderBottom: '2px solid #0284c7', paddingBottom: '6px', marginBottom: '12px' }}>PhD / Research</h4>
                <ul style={{ paddingLeft: 0, listStyleType: 'none', margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {phdTests.map((test: string, i: number) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#334155' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#0284c7', flexShrink: 0, marginTop: 6 }} />
                      {test}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/*  Row 3: Admission Process Steps (from backend)  */}
      {processSteps.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#070642', marginBottom: '24px' }}> Admission Process</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
            {processSteps.map((step: any, i: number) => (
              <div key={i} style={{
                position: 'relative', background: '#f8fafc', borderRadius: '12px',
                border: `1px solid #e2e8f0`, padding: '20px 16px 16px',
                display: 'flex', flexDirection: 'column', gap: '8px',
                borderTop: `3px solid ${dotColors[i % dotColors.length]}`
              }}>
                <div style={{
                  position: 'absolute', top: '-12px', left: '14px',
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: dotColors[i % dotColors.length], color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: '800'
                }}>{step.step || i + 1}</div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#070642', margin: 0 }}>{step.title}</h4>
                <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: 0 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/*  Row 4: Merit Criteria (from backend)  */}
      {(Object.keys(ugMerit).length > 0 || Object.keys(pgMerit).length > 0) && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#070642', marginBottom: '20px' }}> Merit & Selection Criteria</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {Object.entries(ugMerit).length > 0 && (
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#070642', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '12px' }}>Undergraduate</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {Object.entries(ugMerit).map(([stream, criteria]: [string, any], i) => (
                    <div key={i} style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#f8fafc' }}>
                      <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#070642', margin: '0 0 8px' }}>{stream}</h5>
                      {Object.entries(criteria).map(([key, val]: [string, any]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: 4 }}>
                          <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ').replace(' weight', '')}</span>
                          <span style={{ fontWeight: '700', color: '#070642' }}>{val}%</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {Object.entries(pgMerit).length > 0 && (
              <div>
                <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#9a3197', textTransform: 'uppercase', borderBottom: '2px solid #e9d5ff', paddingBottom: '6px', marginBottom: '12px' }}>Postgraduate</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                  {Object.entries(pgMerit).map(([stream, criteria]: [string, any], i) => (
                    <div key={i} style={{ padding: '12px', border: '1px solid #e9d5ff', borderRadius: '8px', background: '#fdf4ff' }}>
                      <h5 style={{ fontSize: '12px', fontWeight: '700', color: '#9a3197', margin: '0 0 8px' }}>{stream}</h5>
                      {Object.entries(criteria).map(([key, val]: [string, any]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: 4 }}>
                          <span style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ').replace(' weight', '')}</span>
                          <span style={{ fontWeight: '700', color: '#9a3197' }}>{val}%</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/*  Row 5: Important Dates Timeline (from backend)  */}
      {importantDates.length > 0 && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#070642', marginBottom: '24px' }}> Important Dates</h3>
          <div style={{ position: 'relative' }}>
            {/* Vertical line */}
            <div style={{ position: 'absolute', left: 20, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #070642, #9a3197, #3b82f6)', borderRadius: 4 }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingLeft: '52px' }}>
              {importantDates.map((item: any, i: number) => (
                <div key={i} style={{ position: 'relative' }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute', left: -42, top: 12,
                    width: 16, height: 16, borderRadius: '50%',
                    background: dotColors[i % dotColors.length],
                    border: '3px solid #fff',
                    boxShadow: `0 0 0 2px ${dotColors[i % dotColors.length]}`
                  }} />
                  <div style={{
                    background: '#f8fafc', borderRadius: '12px', padding: '14px 18px',
                    border: '1px solid #e2e8f0',
                    borderLeft: `4px solid ${dotColors[i % dotColors.length]}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                      <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{item.event}</h4>
                      <span style={{
                        fontSize: '12px', fontWeight: '700', padding: '3px 10px',
                        borderRadius: '20px', background: dotColors[i % dotColors.length],
                        color: '#fff', whiteSpace: 'nowrap'
                      }}>{item.date}</span>
                    </div>
                    {item.description && (
                      <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/*  Row 6: Document Checklist (from backend)  */}
      {(mandatoryDocs.length > 0 || pgDocs.length > 0) && (
        <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#070642', marginBottom: '20px' }}> Document Checklist</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {mandatoryDocs.length > 0 && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#070642', textTransform: 'uppercase', borderBottom: '2px solid #cbd5e1', paddingBottom: '8px', marginBottom: '14px', letterSpacing: '0.5px' }}>Mandatory Documents</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {mandatoryDocs.map((doc: string, i: number) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ width: '15px', height: '15px', accentColor: '#070642', flexShrink: 0 }} />
                      {doc}
                    </label>
                  ))}
                </div>
              </div>
            )}
            {pgDocs.length > 0 && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#9a3197', textTransform: 'uppercase', borderBottom: '2px solid #e9d5ff', paddingBottom: '8px', marginBottom: '14px', letterSpacing: '0.5px' }}>Postgraduate Additions</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {pgDocs.map((doc: string, i: number) => (
                    <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                      <input type="checkbox" style={{ width: '15px', height: '15px', accentColor: '#9a3197', flexShrink: 0 }} />
                      {doc}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/*  Row 7: Fees & Payment (from backend)  */}
      <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#070642', marginBottom: '20px' }}> Fees & Payment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>

          {/* Application Fee */}
          {feeDisplay && (
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#070642', marginBottom: '12px' }}>Application Fee</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: '800', color: '#070642' }}>{feeDisplay}</span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>one-time, non-refundable</span>
              </div>
            </div>
          )}

          {/* Payment Methods */}
          {paymentMethods.length > 0 && (
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#070642', marginBottom: '12px' }}>Payment Methods</h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {paymentMethods.map((method: string, i: number) => (
                  <span key={i} style={{ fontSize: '11px', background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontWeight: '700' }}>{method}</span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Links */}
          {(applicationPortal || admissionsUrl || collegeUrl) && (
            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#070642', marginBottom: '12px' }}>Quick Links</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {applicationPortal && (
                  <a href={applicationPortal} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>
                    <ExternalLink size={13} /> Apply Online
                  </a>
                )}
                {admissionsUrl && admissionsUrl !== applicationPortal && (
                  <a href={admissionsUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>
                    <ExternalLink size={13} /> Admissions Page
                  </a>
                )}
                {collegeUrl && (
                  <a href={collegeUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0284c7', textDecoration: 'none', fontWeight: '600' }}>
                    <ExternalLink size={13} /> Official Website
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* No data fallback */}
      {!adm.general_requirements && ugTests.length === 0 && importantDates.length === 0 && (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: '40px 0' }}>Admission details not yet available for this institution.</p>
      )}

    </div>
  );
}
