'use client';

import { useState, useEffect } from 'react';
import { API_URL, SERPER_API_URL } from '@/lib/config';

interface SearchModalProps {
  showModal: boolean;
  onClose: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchResults?: any[];
  onCollegeSelected?: (collegeName: string, country?: string, collegeData?: any) => void;
  onCountrySelected?: (countryName: string) => void;
}

export default function SearchModal({
  showModal,
  onClose,
  searchQuery: initialQuery = '',
  onSearchChange,
  searchResults,
  onCollegeSelected,
  onCountrySelected,
}: SearchModalProps) {
  const [localQuery, setLocalQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<'idle' | 'scraping' | 'analyzing' | 'fetching'>('idle');
  const [error, setError] = useState('');
  const [displayText, setDisplayText] = useState('');
  const [recentColleges, setRecentColleges] = useState<any[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);

  // New states for location filtering
  const [countries, setCountries] = useState<any[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loadingLocations, setLoadingLocations] = useState(false);

  const query = localQuery;

  useEffect(() => {
    if (showModal) {
      fetchRecentColleges();
      fetchCountries();
    }
  }, [showModal]);

  const fetchCountries = async () => {
    try {
      const resp = await fetch('https://countriesnow.space/api/v0.1/countries/positions');
      const json = await resp.json();
      if (!json.error) {
        setCountries(json.data.sort((a: any, b: any) => a.name.localeCompare(b.name)));
      }
    } catch (err) {
      console.error('Failed to fetch countries:', err);
    }
  };

  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setSelectedCountry(country);
    setSelectedCity('');
    setCities([]);

    if (country) {
      setLoadingLocations(true);
      try {
        const resp = await fetch(`https://countriesnow.space/api/v0.1/countries/cities/q?country=${encodeURIComponent(country)}`);
        const json = await resp.json();
        if (!json.error) {
          setCities(json.data.sort());
        }
      } catch (err) {
        console.error('Failed to fetch cities:', err);
      } finally {
        setLoadingLocations(false);
      }
    }
  };

  const fetchRecentColleges = async () => {
    setLoadingRecent(true);
    try {
      const response = await fetch(`${SERPER_API_URL}/api/most-searched?limit=6`);
      const data = await response.json();
      if (Array.isArray(data)) {
        setRecentColleges(data);
      }
    } catch (err) {
      console.error('Failed to fetch most searched colleges:', err);
    } finally {
      setLoadingRecent(false);
    }
  };

  const handleCollegeClick = (college: any) => {
    setLocalQuery(college.college_name);
    setTimeout(() => {
      handleSearch();
    }, 100);
  };

  useEffect(() => {
    if (!loading) return;

    const messages = [
      ' We are Scraping...',
      ' We are Analyzing...',
      ' We are Fetching...'
    ];

    let messageIndex = 0;
    setDisplayText(messages[0]);

    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setDisplayText(messages[messageIndex]);
    }, 3000);

    return () => clearInterval(interval);
  }, [loading]);

  const handleSearch = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e && e.type === 'keypress' && (e as React.KeyboardEvent).key !== 'Enter') return;

    if (e) e.preventDefault();

    if (!query.trim()) return;

    setLoading(true);
    setError('');
    setProgress('scraping');

    try {
      // STEP 1: Validate college name via Go API
      console.log(' Validating college name...');
      setProgress('analyzing');

      const validationPayload = {
        college_name: query,
        country: selectedCountry || 'Unknown',
        city: selectedCity || 'Unknown'
      };

      const validationUrl = `${API_URL}/api/college/validate`;
      console.log('Sending validation request to:', validationUrl);

      const validationResponse = await fetch(validationUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validationPayload),
      });

      const validationData = await validationResponse.json();
      console.log('Validation response:', validationData);

      if (!validationData.is_valid) {
        setError(`College not found: ${validationData.error || 'Please check the spelling and try again'}`);
        setLoading(false);
        setProgress('idle');
        return;
      }

      // Use validated college info
      const validatedCollegeName = validationData.name;
      const validatedCountry = validationData.country;
      const validatedLocation = validationData.location;

      console.log(' College validated:', { validatedCollegeName, validatedCountry, validatedLocation });

      // STEP 2: Search using validated name
      setProgress('fetching');
      await new Promise(resolve => setTimeout(resolve, 500));

      const searchUrl = new URL(`${SERPER_API_URL}/api/college-statistics`);
      searchUrl.searchParams.append('college_name', validatedCollegeName);
      searchUrl.searchParams.append('country', validatedCountry);
      searchUrl.searchParams.append('city', validatedLocation);

      const response = await fetch(searchUrl.toString());
      const data = await response.json();

      if (data.error || !data.college_name) {
        setError('Failed to fetch college details. Please try again.');
        setLoading(false);
        setProgress('idle');
        return;
      }

      if (onCountrySelected && data.country) {
        onCountrySelected(data.country);
      }

      if (onCollegeSelected && data.college_name) {
        onCollegeSelected(data.college_name, data.country, data);
      }

      setTimeout(() => {
        setLoading(false);
        setProgress('idle');
        setLocalQuery('');
        if (onSearchChange) {
          onSearchChange('');
        }
        onClose();

        const pieChartSection = document.getElementById('pieChartSection');
        if (pieChartSection) {
          pieChartSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);

    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search college. Please try again.');
      setLoading(false);
      setProgress('idle');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalQuery(value);
    setError('');
    if (onSearchChange) {
      onSearchChange(value);
    }
  };
  return (
    <div id="searchModal" className={`modal ${showModal ? 'show' : ''}`}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <div className="search-container">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search Universities, Colleges..."
              id="universitySearchInput"
              value={query}
              onChange={handleInputChange}
              onKeyPress={handleSearch}
              disabled={loading}
              autoFocus
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ display: loading ? 'none' : 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginLeft: '4px' }}>COUNTRY</label>
              <select
                value={selectedCountry}
                onChange={handleCountryChange}
                disabled={loading}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'border 0.2s',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px top 50%',
                  backgroundSize: '12px auto'
                }}
              >
                <option value="">Select Country (Optional)</option>
                {countries.map((c: any) => (
                  <option key={c.iso2} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#666', marginLeft: '4px' }}>CITY</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                disabled={loading || !selectedCountry || loadingLocations}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #ddd',
                  fontSize: '14px',
                  backgroundColor: !selectedCountry ? '#f5f5f5' : 'white',
                  cursor: !selectedCountry ? 'not-allowed' : 'pointer',
                  outline: 'none',
                  transition: 'border 0.2s',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px top 50%',
                  backgroundSize: '12px auto'
                }}
              >
                <option value="">{loadingLocations ? 'Loading Cities...' : 'Select City (Optional)'}</option>
                {cities.map((city: string) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginTop: '16px', display: loading ? 'none' : 'block' }}>
            <button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              style={{
                width: '100%',
                padding: '12px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #4834d4 0%, #686de0 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(104, 109, 224, 0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(104, 109, 224, 0.6)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(104, 109, 224, 0.4)';
              }}
            >
               Analyze University
            </button>
          </div>

          {}
          {loading && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '40px 20px',
              gap: '20px'
            }}>
              {}
              <div style={{
                width: '280px',
                height: '320px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'float 3s ease-in-out infinite'
              }}>
                <img
                  src="/2.gif"
                  alt="Thinking..."
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',

                  }}
                />
              </div>

              {}
              <div style={{
                textAlign: 'center',
                minHeight: '60px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: '8px'
              }}>
                <h3 style={{
                  margin: '0',
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#333',
                  animation: 'fadeInOut 1.5s ease-in-out infinite'
                }}>
                  {displayText}
                </h3>
                <p style={{
                  margin: '0',
                  fontSize: '14px',
                  color: '#666',
                  fontWeight: '500'
                }}>
                  Please wait, we are getting your data
                </p>
              </div>
            </div>
          )}

          {}
          {error && (
            <div style={{
              padding: '12px',
              backgroundColor: '#ffebee',
              color: '#c62828',
              borderRadius: '4px',
              marginTop: '10px',
              fontSize: '12px'
            }}>
               {error}
            </div>
          )}

          {}
          {!loading && !error && (
            <div style={{ marginTop: '20px' }}>
              <h4 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#666',
                marginBottom: '12px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {query.trim() ? 'Suggested Colleges' : 'Most Searched Colleges'}
              </h4>

              {loadingRecent ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                  Loading...
                </div>
              ) : (() => {

                const filteredColleges = query.trim()
                  ? recentColleges.filter(college =>
                    college.college_name.toLowerCase().includes(query.toLowerCase())
                  )
                  : recentColleges;

                return filteredColleges.length > 0 ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '12px',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}>
                    {filteredColleges.map((college, index) => {

                      const collegeName = college.college_name;
                      const queryLower = query.toLowerCase();
                      const nameLower = collegeName.toLowerCase();
                      const matchIndex = nameLower.indexOf(queryLower);

                      let displayName;
                      if (query.trim() && matchIndex !== -1) {
                        const beforeMatch = collegeName.substring(0, matchIndex);
                        const match = collegeName.substring(matchIndex, matchIndex + query.length);
                        const afterMatch = collegeName.substring(matchIndex + query.length);
                        displayName = (
                          <>
                            {beforeMatch}
                            <span style={{ backgroundColor: '#ffeb3b', fontWeight: '700' }}>{match}</span>
                            {afterMatch}
                          </>
                        );
                      } else {
                        displayName = collegeName;
                      }

                      return (
                        <div
                          key={index}
                          onClick={() => handleCollegeClick(college)}
                          style={{
                            padding: '12px 16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            border: '1px solid #e0e0e0'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e3f2fd';
                            e.currentTarget.style.borderColor = '#2196f3';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#e0e0e0';
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '4px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {displayName}
                          </div>
                          <div style={{
                            fontSize: '12px',
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span></span>
                            <span>{college.country || 'Unknown'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                    No colleges found
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes spin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.05); }
          100% { transform: rotate(360deg) scale(1); }
        }

        @keyframes fadeInOut {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}