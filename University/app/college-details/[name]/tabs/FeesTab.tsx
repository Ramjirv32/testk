'use client';

import { GraduationCap, BookOpen, Home, DollarSign, Info, Award } from 'lucide-react';
import { CollegeData, formatCurrency } from '../types';

interface Props { college: CollegeData }

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="section-title">
      <span className="section-icon">{icon}</span>
      {children}
    </h2>
  );
}

export default function FeesTab({ college }: Props) {
  const fees = college.fees;
  const currencyVal = fees?.UG?.currency || fees?.PG?.currency || (fees as any)?.PhD?.currency || 'INR';

  return (
    <div className="tab-content">

      {/*  Main Fee Structure  */}
      <section className="content-section">
        <SectionTitle icon={<DollarSign size={20} />}>Fee Structure</SectionTitle>

        {(fees?.UG?.per_year || fees?.PG?.per_year || fees?.hostel_per_year) ? (
          <div className="fee-cards-row">
            {fees?.UG?.per_year && (
              <div className="fee-premium-card fee-ug">
                <div className="fee-premium-header">
                  <GraduationCap size={20} />
                  <span>Undergraduate (UG)</span>
                </div>
                <div className="fee-premium-amount">{fees.UG.per_year}</div>
                <div className="fee-premium-sublabel">Per Year · {fees.UG.currency || currencyVal}</div>
                {fees.UG.total_course && (
                  <div className="fee-premium-total">
                    <span>Total Course</span>
                    <strong>{fees.UG.total_course}</strong>
                  </div>
                )}
              </div>
            )}
            {fees?.PG?.per_year && (
              <div className="fee-premium-card fee-pg">
                <div className="fee-premium-header">
                  <BookOpen size={20} />
                  <span>Postgraduate (PG)</span>
                </div>
                <div className="fee-premium-amount">{fees.PG.per_year}</div>
                <div className="fee-premium-sublabel">Per Year · {fees.PG.currency || currencyVal}</div>
                {fees.PG.total_course && (
                  <div className="fee-premium-total">
                    <span>Total Course</span>
                    <strong>{fees.PG.total_course}</strong>
                  </div>
                )}
              </div>
            )}
            {fees?.hostel_per_year && (
              <div className="fee-premium-card fee-hostel">
                <div className="fee-premium-header">
                  <Home size={20} />
                  <span>Hostel</span>
                </div>
                <div className="fee-premium-amount">{fees.hostel_per_year}</div>
                <div className="fee-premium-sublabel">Per Year</div>
              </div>
            )}
          </div>
        ) : (fees?.ug_yearly_min || fees?.pg_yearly_min) ? (
          <div className="fees-grid">
            <div className="fee-card ug">
              <h3><GraduationCap size={16} style={{ marginRight: 6 }} />Undergraduate</h3>
              <div className="fee-range">
                <div className="fee-min">
                  <span className="fee-label">Minimum</span>
                  <span className="fee-amount">{formatCurrency(fees?.ug_yearly_min, currencyVal)}</span>
                </div>
                <span className="fee-arrow">→</span>
                <div className="fee-max">
                  <span className="fee-label">Maximum</span>
                  <span className="fee-amount">{formatCurrency(fees?.ug_yearly_max, currencyVal)}</span>
                </div>
              </div>
            </div>
            <div className="fee-card pg">
              <h3><BookOpen size={16} style={{ marginRight: 6 }} />Postgraduate</h3>
              <div className="fee-range">
                <div className="fee-min">
                  <span className="fee-label">Minimum</span>
                  <span className="fee-amount">{formatCurrency(fees?.pg_yearly_min, currencyVal)}</span>
                </div>
                <span className="fee-arrow">→</span>
                <div className="fee-max">
                  <span className="fee-label">Maximum</span>
                  <span className="fee-amount">{formatCurrency(fees?.pg_yearly_max, currencyVal)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <p className="no-data">No fee structure data available</p>
        )}
      </section>

      {/*  Fees by Year  */}
      {(college.fees_by_year?.length ?? 0) > 0 && (
        <section className="content-section">
          <SectionTitle icon={<DollarSign size={20} />}>Fees by Year</SectionTitle>
          <table className="data-table">
            <thead>
              <tr>
                <th>Year</th><th>Program</th><th>Per Year</th>
                <th>Total Course</th><th>Hostel / Year</th><th>Currency</th>
              </tr>
            </thead>
            <tbody>
              {college.fees_by_year!.map((fy, i) => (
                <tr key={i}>
                  <td>{fy.year}</td>
                  <td><span className={`program-type-badge program-type-badge--${fy.program_type.toLowerCase()}`}>{fy.program_type}</span></td>
                  <td>{fy.per_year_local || '-'}</td>
                  <td>{fy.total_course_local || '-'}</td>
                  <td>{fy.hostel_per_year_local || '-'}</td>
                  <td>{fy.currency || currencyVal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/*  Fees Note  */}
      {college.fees_note && (
        <section className="content-section">
          <div className="info-callout">
            <Info size={15} style={{ marginRight: 8, flexShrink: 0 }} />
            <div>
              <strong>Note</strong><br />
              {college.fees_note}
            </div>
          </div>
        </section>
      )}

      {/*  Scholarships  */}
      <section className="content-section">
        <SectionTitle icon={<Award size={20} />}>Scholarships</SectionTitle>

        {(college.scholarships_detail?.length ?? 0) > 0 ? (
          <div className="scholarship-cards">
            {college.scholarships_detail!.map((s, i) => (
              <div className="scholarship-pro-card" key={i} style={{ '--i': i } as React.CSSProperties}>
                <div className="scholarship-pro-icon">
                  <Award size={20} />
                </div>
                <div className="scholarship-pro-body">
                  <div className="scholarship-pro-name">{s.name}</div>
                  {s.amount && (
                    <div className="scholarship-pro-amount">
                      <DollarSign size={12} />
                      {s.amount}
                    </div>
                  )}
                  {s.provider && (
                    <div className="scholarship-pro-provider">{s.provider}</div>
                  )}
                  {s.eligibility && (
                    <div className="scholarship-pro-eligibility">{s.eligibility}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (college.scholarships?.length ?? 0) > 0 ? (
          <div className="scholarships-grid">
            {college.scholarships!.map((s, i) => (
              <div className="scholarship-card" key={i}>
                <Award size={16} />
                <span className="scholarship-name">{s}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No scholarships data available</p>
        )}
      </section>
    </div>
  );
}
