'use client';

import { useState, useEffect } from 'react';

interface FilterSectionProps {
  onFilterChange: (filters: any) => void;
}

export default function FilterSection({ onFilterChange }: FilterSectionProps) {
  const [selectedFilters, setSelectedFilters] = useState<any>({
    disciplines: [],
    countries: [],
    formats: [],
    degrees: [],
    universityType: [],
    specialPrograms: [],
  });

  const [tuitionRange, setTuitionRange] = useState<[number, number]>([0, 10000000]);

  const [openSections, setOpenSections] = useState<any>({
    discipline: true,
    location: true,
    tuitionFee: true,
    universityType: true,
    format: true,
    degree: true,
    specialPrograms: true,
  });

  const [availableCountries, setAvailableCountries] = useState<string[]>([]);
  const [availableDisciplines, setAvailableDisciplines] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  const [disciplineSearch, setDisciplineSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [formatSearch, setFormatSearch] = useState('');
  const [degreeSearch, setDegreeSearch] = useState('');
  const [specialProgramSearch, setSpecialProgramSearch] = useState('');

  useEffect(() => {
    fetchFilterOptions();
    loadFiltersFromStorage();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [countriesRes, disciplinesRes, locationsRes] = await Promise.all([
        fetch('/api/dontsettle/countries'),
        fetch('/api/dontsettle/disciplines'),
        fetch('/api/dontsettle/locations'),
      ]);

      if (countriesRes.ok) setAvailableCountries(await countriesRes.json());
      if (disciplinesRes.ok) setAvailableDisciplines(await disciplinesRes.json());
      if (locationsRes.ok) setAvailableLocations(await locationsRes.json());
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections((prev: any) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const loadFiltersFromStorage = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('selectedFilters');
      if (saved && saved !== 'undefined') {
        try {
          const parsedFilters = JSON.parse(saved);

          const merged = {
            disciplines: parsedFilters.disciplines ?? [],
            countries: parsedFilters.countries ?? [],
            formats: parsedFilters.formats ?? [],
            degrees: parsedFilters.degrees ?? [],
            universityType: parsedFilters.universityType ?? [],
            specialPrograms: parsedFilters.specialPrograms ?? [],
            ...parsedFilters,
          };
          setSelectedFilters(merged);
          onFilterChange(merged);
        } catch (error) {
          console.error('Error parsing stored filters:', error);
          localStorage.removeItem('selectedFilters');
        }
      }
    }
  };

  const handleFilterChange = (type: string, value: number | string, checked: boolean) => {
    const updated = { ...selectedFilters };
    if (checked) {
      updated[type].push(value);
    } else {
      updated[type] = updated[type].filter((v: any) => v !== value);
    }
    setSelectedFilters(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedFilters', JSON.stringify(updated));
    }
    onFilterChange(updated);
  };

  const clearAllFilters = () => {
    const cleared = {
      disciplines: [],
      countries: [],
      formats: [],
      degrees: [],
      universityType: [],
      specialPrograms: [],
    };
    setSelectedFilters(cleared);
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedFilters', JSON.stringify(cleared));
    }
    onFilterChange(cleared);
  };

  return (
    <div className="institute_left_side">
      <div className="institute_filter cursor-pointer">
        <h3>All Filters</h3>
        <h3 id="clear-filters" onClick={clearAllFilters} style={{ cursor: 'pointer' }}>
          Clear All
        </h3>
      </div>

      <div id="selected-filters" className="selected-filters" style={{ display: 'none' }}>
        <h5 className="mb-2">Applied Filters:</h5>
        <div id="filter-tags"></div>
      </div>

      <div id="main">
        <div className="container p-0">
          <div className="accordion" id="faq">
            {}
            <div className="card">
              <div className="card-header" id="faqhead2">
                <button
                  className="btn btn-header-link accordion-button"
                  onClick={() => toggleSection('discipline')}
                  type="button"
                >
                  Discipline
                </button>
              </div>
              {openSections.discipline && (
                <div className="card-body">
                  <input
                    type="text"
                    id="searchDiscipline"
                    className="form-control mb-2"
                    placeholder="Search Discipline..."
                    value={disciplineSearch}
                    onChange={(e) => setDisciplineSearch(e.target.value)}
                  />
                  <div className="filter-grid" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {availableDisciplines
                      .filter(d => d.toLowerCase().includes(disciplineSearch.toLowerCase()))
                      .map((discipline) => (
                        <div key={discipline} className="filter-item">
                          <label title={discipline}>
                            <input
                              type="checkbox"
                              value={discipline}
                              checked={selectedFilters.disciplines.includes(discipline)}
                              onChange={(e) =>
                                handleFilterChange('disciplines', discipline, e.target.checked)
                              }
                            />
                            {' '}{discipline}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {}
            <div className="card">
              <div className="card-header" id="faqhead3">
                <button
                  className="btn btn-header-link accordion-button"
                  onClick={() => toggleSection('location')}
                  type="button"
                >
                  Location
                </button>
              </div>
              {openSections.location && (
                <div className="card-body">
                  <input
                    type="text"
                    id="searchLocation"
                    className="form-control mb-2"
                    placeholder="Search Location..."
                    value={locationSearch}
                    onChange={(e) => setLocationSearch(e.target.value)}
                  />
                  <div className="filter-grid" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {availableCountries
                      .filter(c => c.toLowerCase().includes(locationSearch.toLowerCase()))
                      .map((country) => (
                        <div key={country} className="filter-item">
                          <label title={country}>
                            <input
                              type="checkbox"
                              value={country}
                              checked={selectedFilters.countries.includes(country)}
                              onChange={(e) =>
                                handleFilterChange('countries', country, e.target.checked)
                              }
                            />
                            {' '}{country}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {}
            <div className="card">
              <div className="card-header" id="faqhead4">
                <button
                  className="btn btn-header-link accordion-button"
                  onClick={() => toggleSection('tuitionFee')}
                  type="button"
                >
                  Tuition Fee
                </button>
              </div>
              {openSections.tuitionFee && (
                <div className="card-body">
                  <div className="tuition-fee-slider">
                    <div className="tuition-fee-label">
                      ₹ {tuitionRange[0].toLocaleString('en-IN')} - ₹ {tuitionRange[1].toLocaleString('en-IN')}
                    </div>
                    <div className="range-slider-container">
                      <input
                        type="range"
                        min="0"
                        max="10000000"
                        step="100000"
                        value={tuitionRange[0]}
                        onChange={(e) => {
                          const newMin = parseInt(e.target.value);
                          if (newMin <= tuitionRange[1]) {
                            setTuitionRange([newMin, tuitionRange[1]]);
                          }
                        }}
                        className="range-slider range-slider-min"
                      />
                      <input
                        type="range"
                        min="0"
                        max="10000000"
                        step="100000"
                        value={tuitionRange[1]}
                        onChange={(e) => {
                          const newMax = parseInt(e.target.value);
                          if (newMax >= tuitionRange[0]) {
                            setTuitionRange([tuitionRange[0], newMax]);
                          }
                        }}
                        className="range-slider range-slider-max"
                      />
                      <div className="range-slider-track">
                        <div
                          className="range-slider-fill"
                          style={{
                            left: `${(tuitionRange[0] / 10000000) * 100}%`,
                            width: `${((tuitionRange[1] - tuitionRange[0]) / 10000000) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {}
            <div className="card">
              <div className="card-header" id="faqhead5">
                <button
                  className="btn btn-header-link accordion-button"
                  onClick={() => toggleSection('universityType')}
                  type="button"
                >
                  University Type
                </button>
              </div>
              {openSections.universityType && (
                <div className="card-body">
                  <div className="filter-grid">
                    <div className="filter-item">
                      <label>
                        <input
                          type="checkbox"
                          value="Private"
                          checked={selectedFilters.universityType.includes('Private')}
                          onChange={(e) =>
                            handleFilterChange('universityType', 'Private', e.target.checked)
                          }
                        />
                        {' '}Private
                      </label>
                    </div>
                    <div className="filter-item">
                      <label>
                        <input
                          type="checkbox"
                          value="Public"
                          checked={selectedFilters.universityType.includes('Public')}
                          onChange={(e) =>
                            handleFilterChange('universityType', 'Public', e.target.checked)
                          }
                        />
                        {' '}Public
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {}
            <div className="card">
              <div className="card-header" id="faqhead6">
                <button
                  className="btn btn-header-link accordion-button"
                  onClick={() => toggleSection('format')}
                  type="button"
                >
                  Format
                </button>
              </div>
              {openSections.format && (
                <div className="card-body">
                  <input
                    type="text"
                    id="searchFormat"
                    className="form-control mb-2"
                    placeholder="Search Format..."
                    value={formatSearch}
                    onChange={(e) => setFormatSearch(e.target.value)}
                  />
                  <div className="filter-grid">
                    {[
                      { id: 'Blended', name: 'Blended' },
                      { id: 'On-Campus', name: 'On-Campus' },
                    ].filter(f => f.name.toLowerCase().includes(formatSearch.toLowerCase()))
                      .map((format) => (
                        <div key={format.id} className="filter-item">
                          <label>
                            <input
                              type="checkbox"
                              value={format.id}
                              checked={selectedFilters.formats.includes(format.id)}
                              onChange={(e) =>
                                handleFilterChange('formats', format.id, e.target.checked)
                              }
                            />
                            {' '}{format.name}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {}
            <div className="card">
              <div className="card-header" id="faqhead7">
                <button
                  className="btn btn-header-link accordion-button"
                  onClick={() => toggleSection('degree')}
                  type="button"
                >
                  Degree
                </button>
              </div>
              {openSections.degree && (
                <div className="card-body">
                  <input
                    type="text"
                    id="searchDegree"
                    className="form-control mb-2"
                    placeholder="Search Degree..."
                    value={degreeSearch}
                    onChange={(e) => setDegreeSearch(e.target.value)}
                  />
                  <div className="filter-grid">
                    {[
                      { id: 'Undergraduate', name: 'Undergraduate' },
                      { id: 'Postgraduate', name: 'Postgraduate' },
                      { id: 'PhD', name: 'Doctorate/PhD' },
                    ].filter(d => d.name.toLowerCase().includes(degreeSearch.toLowerCase()))
                      .map((degree) => (
                        <div key={degree.id} className="filter-item">
                          <label>
                            <input
                              type="checkbox"
                              value={degree.id}
                              checked={selectedFilters.degrees.includes(degree.id)}
                              onChange={(e) =>
                                handleFilterChange('degrees', degree.id, e.target.checked)
                              }
                            />
                            {' '}{degree.name}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {}
            <div className="card">
              <div className="card-header" id="faqhead8">
                <button
                  className="btn btn-header-link accordion-button"
                  onClick={() => toggleSection('specialPrograms')}
                  type="button"
                >
                  Special Programmes
                </button>
              </div>
              {openSections.specialPrograms && (
                <div className="card-body">
                  <input
                    type="text"
                    id="searchSpecialProgrammes"
                    className="form-control mb-2"
                    placeholder="Search Special Programmes..."
                    value={specialProgramSearch}
                    onChange={(e) => setSpecialProgramSearch(e.target.value)}
                  />
                  <div className="filter-grid">
                    {[
                      { id: 'Executive', name: 'Executive Programmes' },
                      { id: 'Joint', name: 'Joint Programmes' },
                    ].filter(p => p.name.toLowerCase().includes(specialProgramSearch.toLowerCase()))
                      .map((program) => (
                        <div key={program.id} className="filter-item">
                          <label title={program.name}>
                            <input
                              type="checkbox"
                              value={program.id}
                              checked={selectedFilters.specialPrograms.includes(program.id)}
                              onChange={(e) =>
                                handleFilterChange('specialPrograms', program.id, e.target.checked)
                              }
                            />
                            {' '}{program.name}
                          </label>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}