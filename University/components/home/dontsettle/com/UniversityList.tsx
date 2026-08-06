'use client';

import Link from 'next/link';
import Image from 'next/image';

interface UniversityListProps {
  universities: any[];
}

export default function UniversityList({ universities }: UniversityListProps) {
  if (universities.length === 0) {
    return <div className="text-center py-5">No universities found.</div>;
  }

  return (
    <ul className="institute_ul" id="universities-list">
      {universities.map((university, index) => (
        <li key={university.id || university.college_name || index}>
          <div className="li_section_main">
            <Image
              src={university.logo || '/images/institute-icon-1.png'}
              alt="University Logo"
              width={60}
              height={60}
              className="university-logo-img"
            />
            <Link href={`/college-details/${encodeURIComponent(university.college_name)}`}>
              <h5>{university.college_name}</h5>
            </Link>
          </div>
          <div className="ul_li_display">
            <div className="d-flex justify-content-between">
              <div>
                <div className="li_section_1">
                  <p>
                    <i className="fa-solid fa-location-dot" style={{ color: '#000', fontSize: '16px', marginRight: '10px' }}></i>
                    Location:
                  </p>
                  <h5>{university.location || 'N/A'}, {university.country || 'N/A'}</h5>
                </div>
              </div>
              <div className="ul_li_section2_width">
                <div className="li_section_2">
                  <div className="inner_section">
                    <Image
                      src="/images/institute-icon-1.png"
                      alt="Global Ranking"
                      width={30}
                      height={30}
                    />
                    <div>
                      <h6>Global Ranking</h6>
                      <p>{university.global_ranking ?? 'N/A'}</p>
                    </div>
                  </div>
                  <div className="inner_section">
                    <Image
                      src="/images/institute-icon-2.png"
                      alt="University Type"
                      width={30}
                      height={30}
                    />
                    <div>
                      <h6>University Type</h6>
                      <p>{university.university_type ?? 'N/A'}</p>
                    </div>
                  </div>
                </div>
                <div className="li_section_2">
                  <div className="inner_section">
                    <Image
                      src="/images/institute-icon-3.png"
                      alt="Masters"
                      width={30}
                      height={30}
                    />
                    <div>
                      <h6>Masters</h6>
                      <p>{university.masters_degree ?? (university.pg_programs?.length > 0 ? 'Available' : 'N/A')}</p>
                    </div>
                  </div>
                  <div className="inner_section">
                    <Image
                      src="/images/institute-icon-4.png"
                      alt="Scholarships"
                      width={30}
                      height={30}
                    />
                    <div>
                      <h6>Scholarships</h6>
                      <p>
                        {Array.isArray(university.scholarships)
                          ? (university.scholarships.length > 0 ? university.scholarships.join(', ') : 'N/A')
                          : (university.scholarships ?? 'N/A')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="university_link">
              <Link href={`/college-details/${encodeURIComponent(university.college_name)}`}>
                <h6>Visit University Page</h6>
              </Link>
              <div className="mobile_margin_top">
                <Link href="/login">
                  <button>Rate my Chance</button>
                </Link>
                <Link href={`/college-details/${encodeURIComponent(university.college_name)}`}>
                  <button>Featured</button>
                </Link>
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}