'use client';

import { useState } from 'react';

interface BannerSectionProps {
  onSearchClick: () => void;
}

export default function BannerSection({ onSearchClick }: BannerSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="banner-section" style={{ padding: '0px 0px', backgroundColor: '#faf4ec' }}>
      <div className="container banner_main">
        <div className="row d-flex justify-content-center align-items-center">
          <div className="col-lg-6 col-md-6 col-sm-12">
            <div className="banner_content" data-aos="fade-up" data-aos-easing="ease" data-aos-delay="300">
              <p style={{ fontSize: '31px', fontWeight: 'normal', color: '#000', margin: '20px 0' }}>
                &quot;Don&apos;t guess. Let data tell your story&quot;
              </p>
              <div className="search-container">
                <form className="form_block" id="searchForm" onSubmit={(e) => e.preventDefault()}>
                  <input
                    type="text"
                    placeholder="Search universities, Courses, Questions & Articles"
                    name="search"
                    id="searchInput"
                    value={searchQuery}
                    style={{
                      backgroundColor: '#e8dcc8',
                      border: 'none',
                      padding: '12px 16px',
                      borderRadius: '4px',
                      fontFamily: 'inherit'
                    }}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onClick={onSearchClick}
                  />
                  <button type="button" style={{padding:"12px 16px"}}>Search</button>
                </form>
              </div>
              <p style={{ fontSize: '31px', fontWeight: 'normal', color: '#000', margin: '20px 0' }}>
                &quot;Not Just Rankings. TRUly Yours&quot;
              </p>
            </div>
          </div>

          <div className="col-lg-6 col-md-6 col-sm-12">
            <div data-aos="fade-up" className="banner_img" data-aos-easing="ease" data-aos-delay="300">
              <img src="/images/tru.png" alt="TRU Banner" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
