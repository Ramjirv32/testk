'use client';

import { useState, useEffect } from 'react';
import FilterSection from '@/components/home/dontsettle/com/FilterSection';
import UniversityList from '@/components/home/dontsettle/com/UniversityList';
import Pagination from '@/components/home/dontsettle/com/Pagination';

export default function AllUniversityPage() {
  const [universities, setUniversities] = useState<any[]>([]);
  const [filters, setFilters] = useState<any>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setFiltersInitialized(true);
      return;
    }

    const storedFilters = localStorage.getItem('selectedFilters');
    if (storedFilters && storedFilters !== 'undefined') {
      try {
        setFilters(JSON.parse(storedFilters));
      } catch (error) {
        console.error('Unable to parse stored filters:', error);
        localStorage.removeItem('selectedFilters');
      }
    }

    setFiltersInitialized(true);
  }, []);

  useEffect(() => {
    if (!filtersInitialized) return;
    fetchUniversities(filters, currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [filters, currentPage, filtersInitialized]);

  const handleFilterChange = (updatedFilters: any) => {
    setFilters(updatedFilters);
    setCurrentPage(1);
  };

  const fetchUniversities = async (selectedFilters: any, page: number = 1) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/dontsettle?page=${page}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedFilters),
      });

      if (!response.ok) {
        console.error('API error:', response.status, response.statusText);
        setUniversities([]);
        setTotalPages(1);
        setCurrentPage(1);
        return;
      }

      const data = await response.json();

      if (data.universities) {
        setUniversities(data.universities.data || []);
        setTotalPages(data.universities.last_page || 1);
        setCurrentPage(data.universities.current_page || 1);
      } else {
        setUniversities([]);
        setTotalPages(1);
        setCurrentPage(1);
      }
    } catch (error) {
      console.error('Error fetching universities:', error);
      setUniversities([]);
      setTotalPages(1);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="section1">
        <div className="container">
          <div className="row">
            <div className="col-lg-12 col-md-12 col-sm-12 subpage_coloum">
              <div className="subpage_heading">
                <h1>INSTITUTE</h1>
              </div>
              <div className="ranking_section">
                <div className="container">
                  <div className="row">
                    <div className="col-lg-12 col-md-12 col-sm-12">
                      <ul className="select_ul_li">
                        <li>
                          <form className="input-group" style={{ position: 'relative' }} onSubmit={(e) => {
                            e.preventDefault();
                            setFilters({});
                            setCurrentPage(1);
                          }}>
                            <input
                              style={{
                                border: '2px solid #9a3197 !important',
                                paddingRight: '45px'
                              }}
                              type="text"
                              className="form-control rounded-pill"
                              name="search"
                              id="searchInput"
                              placeholder="Search.."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            <div style={{
                              position: 'absolute',
                              right: '15px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: '#9a3197',
                              pointerEvents: 'none',
                              zIndex: 10
                            }}>
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                          </form>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="fillter_institute">
        <div className="container">
          <div className="row" style={{ position: 'relative' }}>
            <div className="col-lg-4 col-md-4 col-sm-12" style={{ position: 'sticky', height: '100%', top: 0 }}>
              <FilterSection onFilterChange={handleFilterChange} />
            </div>
            <div className="col-lg-8 col-md-8 col-sm-12">
              {loading ? (
                <div className="loading-container">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="university-card-skeleton">
                      <div className="skeleton-header">
                        <div className="skeleton-logo"></div>
                        <div className="skeleton-title"></div>
                      </div>
                      <div className="skeleton-content">
                        <div className="skeleton-line"></div>
                        <div className="skeleton-line short"></div>
                      </div>
                      <div className="skeleton-footer">
                        <div className="skeleton-button"></div>
                        <div className="skeleton-button"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <UniversityList universities={universities} />
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}