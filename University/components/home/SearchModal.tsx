'use client';

import { useState, useEffect } from 'react';
import { API_URL, WS_URL } from '@/lib/config';

interface SearchModalProps {
  showModal: boolean;
  onClose: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchResults?: any[];
  onCollegeSelected?: (collegeName: string, country?: string, collegeData?: any) => void;
  onCountrySelected?: (countryName: string) => void;
  onPipelineStarted?: (streamUrl: string, collegeName: string, country: string) => void;
  scrapingProgress?: {
    active: boolean;
    section: string;
    completed: number;
    total: number;
  };
}

export default function SearchModal({
  showModal,
  onClose,
  onSearchChange,
  onCollegeSelected,
  onCountrySelected,
  onPipelineStarted,
  scrapingProgress,
}: SearchModalProps) {
  const [localQuery, setLocalQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentColleges, setRecentColleges] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [streamingCollege, setStreamingCollege] = useState('');

  const getBasicInfoFromFiles = (files: Record<string, any> = {}) => {
    const normalized = files['normalized.json'] || files['serper.json'] || {};
    const raw = files['raw.json'] || {};
    return normalized.basic_info || raw.basic_info || normalized || raw || {};
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (showModal) {
      fetchRecentColleges();
      fetchCountries();
    } else {
      setLoading(false);
      setLocalQuery('');
      setError('');
    }
  }, [showModal]);

  const fetchCountries = async () => {
    try {
      const resp = await fetch('https://countriesnow.space/api/v0.1/countries/positions');
      const json = await resp.json();
      if (!json.error) setCountries(json.data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
    } catch { }
  };

  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const c = e.target.value;
    setSelectedCountry(c);
    setSelectedCity('');
    setCities([]);
    setAllCities([]);
    if (c) {
      setLoadingLocations(true);
      try {
        const resp = await fetch(`https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(c)}`);
        const json = await resp.json();
        if (!json.error) {
          const sorted = json.data.sort();
          setAllCities(sorted);
          setCities(sorted.slice(0, 100)); // Initially show first 100 cities to prevent UI freezing
        }
      } catch { } finally { setLoadingLocations(false); }
    }
  };

  const fetchRecentColleges = async () => {
    setLoadingRecent(true);
    try {
      const resp = await fetch(`${API_URL}/api/all-colleges`);
      const data = await resp.json();
      if (Array.isArray(data)) {
        setRecentColleges(data.slice(0, 6).map((u: any) => ({
          college_name: u.college_name,
          country: u.country || 'Unknown',
          files_completed: 1, // Optional: adjust based on actual progress if tracked
          total_files: 13,
        })));
      } else if (data.universities) {
        setRecentColleges(data.universities.slice(0, 6).map((u: any) => ({
          college_name: u.display_name || u.college_name,
          country: u.country,
          files_completed: u.files_completed,
          total_files: u.total_files,
        })));
      }
    } catch { } finally { setLoadingRecent(false); }
  };

  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && e.type === 'keypress' && (e as React.KeyboardEvent).key !== 'Enter') return;
    if (e) e.preventDefault();
    if (!localQuery.trim()) return;

    setLoading(true);
    setError('');
    setStreamingCollege(localQuery.trim());

    try {
      // 1. Validate via Go Engine (optional — fallback to raw query if it fails)
      let vName = localQuery.trim();
      let vCountry = selectedCountry || 'India';
      let vLocation = selectedCity || '';

      try {
        const valResp = await fetch(`${API_URL}/api/college/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ college_name: localQuery, country: selectedCountry || 'Unknown', city: selectedCity || 'Unknown' }),
          signal: AbortSignal.timeout(8000),
        });
        if (valResp.ok) {
          const valData = await valResp.json();
          if (valData.is_valid) {
            vName = valData.name || vName;
            vCountry = valData.country || vCountry;
            vLocation = valData.location || vLocation;
          } else {
            console.warn('Go Engine says invalid, proceeding with raw query:', valData.error);
          }
        }
      } catch (validateErr) {
        console.warn('Go Engine validate failed, using raw query:', validateErr);
      }

      setStreamingCollege(vName);

      // 2. Check-or-start scraper pipeline via Go Engine -> Python Server
      const checkResp = await fetch(`${API_URL}/api/college/check-or-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ college_name: vName, country: vCountry, location: vLocation }),
      });
      const checkData = await checkResp.json();

	  // The backend may resolve an acronym/alias (for example KPRIET) to the
	  // institution's official name. Always navigate and render with that
	  // verified identity instead of the raw text typed by the user.
	  const resolvedName = checkData.college_name || checkData.basic_info?.college_name || vName;
	  const resolvedCountry = checkData.country || checkData.basic_info?.country || vCountry;

      if (checkData.stream_url || checkData.pipeline_started) {
        const files = checkData.files || {};
        const basicInfo = getBasicInfoFromFiles(files);
        try {
          sessionStorage.setItem('_streaming_college', resolvedName);
          if (checkData.pipeline_id) sessionStorage.setItem('_streaming_pipeline_id', checkData.pipeline_id);
        } catch (_) {}
        if (onCountrySelected && resolvedCountry) onCountrySelected(resolvedCountry);
        if (onCollegeSelected) {
          onCollegeSelected(resolvedName, resolvedCountry, {
            ...basicInfo,
            ...checkData.basic_info,
            files,
            _streaming: true,
            country: resolvedCountry,
          });
        }
        if (onPipelineStarted) {
          onPipelineStarted(`${WS_URL}/ws/college-details/${encodeURIComponent(resolvedName)}`, resolvedName, resolvedCountry);
        }
        // Close modal immediately and show pie chart with streaming status
        setTimeout(() => { setLoading(false); setLocalQuery(''); setError(''); onClose(); scrollToPie(); }, 300);
        return;
      }

      if (checkData.found && checkData.cached) {
        // Immediate: all data cached — serve it right away
        const files = checkData.files || {};
        const basicInfo = getBasicInfoFromFiles(files);
        if (onCountrySelected && resolvedCountry) onCountrySelected(resolvedCountry);
        if (onCollegeSelected) {
          onCollegeSelected(resolvedName, resolvedCountry, {
            ...basicInfo,
            ...checkData.basic_info,
            files,
            country: resolvedCountry,
          });
        }
        setTimeout(() => { setLoading(false); setLocalQuery(''); setError(''); onClose(); scrollToPie(); }, 300);
        return;
      }

      if (checkData.basic_info && Object.keys(checkData.basic_info).length > 0 && !(checkData.pipeline_started || checkData.stream_url)) {
        // We received the basic_info quickly and no pipeline is actively running (already cached)! Close the modal and show pie chart.
        if (onCountrySelected && resolvedCountry) onCountrySelected(resolvedCountry);
        if (onCollegeSelected) {
          onCollegeSelected(resolvedName, resolvedCountry, { ...checkData.basic_info, country: resolvedCountry });
        }
        setTimeout(() => { setLoading(false); setLocalQuery(''); setError(''); onClose(); scrollToPie(); }, 300);
        return;
      }

      if (!(checkData.basic_info && Object.keys(checkData.basic_info).length > 0)) {
        setLoading(false);
        setError('Failed to start search. Please try again.');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search college. Please try again.');
      setLoading(false);
    }
  };

  const scrollToPie = () => {
    document.getElementById('pieChartSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div id="searchModal" className={`modal ${showModal ? 'show' : ''}`}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        <div className="search-container">

          {/* Search input */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text" placeholder="Search Universities, Colleges..."
              id="universitySearchInput" value={localQuery}
              onChange={e => { setLocalQuery(e.target.value); setError(''); if (onSearchChange) onSearchChange(e.target.value); }}
              onKeyPress={handleSearch} disabled={loading} autoFocus style={{ flex: 1 }}
            />
          </div>

          {/* Location filters */}
          {!loading && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginLeft: '4px' }}>COUNTRY</label>
                  <select value={selectedCountry} onChange={handleCountryChange}
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '14px', backgroundColor: 'white' }}>
                    <option value="">Select Country (Optional)</option>
                    {countries.map((c: any) => <option key={c.iso2} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginLeft: '4px' }}>CITY</label>
                  {selectedCountry && allCities.length > 100 && (
                    <input
                      type="text"
                      placeholder="Type to filter cities..."
                      onChange={(e) => {
                        const val = e.target.value;
                        const filtered = allCities
                          .filter(city => city.toLowerCase().includes(val.toLowerCase()))
                          .slice(0, 100);
                        setCities(filtered);
                      }}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #ddd',
                        fontSize: '13px',
                        marginBottom: '4px',
                        outline: 'none'
                      }}
                    />
                  )}
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    disabled={!selectedCountry || loadingLocations}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: '1px solid #ddd',
                      fontSize: '14px',
                      backgroundColor: !selectedCountry ? '#f5f5f5' : 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="">{loadingLocations ? 'Loading Cities...' : 'Select City (Optional)'}</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <button onClick={handleSearch} disabled={!localQuery.trim()}
                  style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #4834d4 0%, #686de0 100%)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', boxShadow: '0 4px 15px rgba(104,109,224,0.4)' }}>
                   Analyze University
                </button>
              </div>
            </>
          )}

          {/* PIPELINE INITIALIZATION STATUS */}
          {(loading || (scrapingProgress && scrapingProgress.active)) && (
            <div style={{ padding: '30px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <span style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                border: '4px solid rgba(72, 52, 212, 0.15)',
                borderTopColor: '#4834d4',
                animation: 'modalSpin 1s linear infinite',
                display: 'inline-block'
              }} />
              <div style={{ textAlign: 'center', width: '100%' }}>
                <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
                  Analyzing <span style={{ color: '#4834d4' }}>{streamingCollege || 'Institution'}</span>
                </div>
                {scrapingProgress && scrapingProgress.active ? (
                  <div style={{ width: '100%', padding: '0 10px' }}>
                    <div style={{ fontSize: '14px', color: '#4834d4', fontWeight: 600, marginBottom: '8px' }}>
                      Scraping: {scrapingProgress.section || 'In Progress'}...
                    </div>
                    {/* Visual Progress Bar */}
                    <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '10px', marginBottom: '6px' }}>
                      <div style={{ 
                        width: `${Math.min(100, (scrapingProgress.completed / scrapingProgress.total) * 100)}%`, 
                        height: '100%', 
                        backgroundColor: '#4834d4', 
                        transition: 'width 0.4s ease-in-out' 
                      }} />
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Completed {scrapingProgress.completed} of {scrapingProgress.total} sections ({Math.round(Math.min(100, (scrapingProgress.completed / scrapingProgress.total) * 100))}%)
                    </div>
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: '#64748b' }}>
                    Starting scraping pipeline. Please wait...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginTop: '10px', fontSize: '12px' }}>
               {error}
            </div>
          )}

          {/* Recent colleges */}
          {!loading && !error && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#666', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {localQuery.trim() ? 'Suggested Colleges' : 'Recently Scraped Colleges'}
              </h4>
              {loadingRecent ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Loading...</div>
              ) : (() => {
                const filtered = localQuery.trim()
                  ? recentColleges.filter(c => c.college_name.toLowerCase().includes(localQuery.toLowerCase()))
                  : recentColleges;
                return filtered.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: '10px', maxHeight: '280px', overflowY: 'auto' }}>
                    {filtered.map((college, idx) => {
                      const qLow = localQuery.toLowerCase();
                      const nLow = college.college_name.toLowerCase();
                      const mi = nLow.indexOf(qLow);
                      const displayName = (localQuery.trim() && mi !== -1)
                        ? <>{college.college_name.substring(0, mi)}<span style={{ backgroundColor: '#ffeb3b', fontWeight: 700 }}>{college.college_name.substring(mi, mi + localQuery.length)}</span>{college.college_name.substring(mi + localQuery.length)}</>
                        : college.college_name;
                      const pct = college.total_files ? Math.round((college.files_completed / college.total_files) * 100) : 100;
                      return (
                        <div key={idx} onClick={() => { setLocalQuery(college.college_name); setTimeout(handleSearch, 100); }}
                          style={{ padding: '10px 14px', backgroundColor: '#f8f9fa', borderRadius: '8px', cursor: 'pointer', border: '1px solid #e0e0e0', transition: 'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#e3f2fd'; e.currentTarget.style.borderColor = '#2196f3'; }}
                          onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f8f9fa'; e.currentTarget.style.borderColor = '#e0e0e0'; }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>{displayName}</div>
                          <div style={{ fontSize: '11px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                            <span> {college.country}</span>
                            <span style={{ color: pct === 100 ? '#16a34a' : '#4834d4', fontWeight: 600 }}>{pct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>No colleges found</div>;
              })()}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalSpin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
