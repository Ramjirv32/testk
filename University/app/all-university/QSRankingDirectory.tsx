'use client';

import { useCallback, useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import Image from 'next/image';
import styles from './all-university.module.css';

type Ranking = {
  ranking_year: number;
  rank: string;
  rank_order: number;
  score: string;
  name: string;
  inner_url: string;
  location: string;
  country: string;
  logo_url: string;
  logo_path: string;
  is_qs_ranked?: boolean;
};

type RankingResponse = {
  items: Ranking[];
  countries: string[];
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  ranking_year: number;
  cache: string;
};

const PAGE_SIZE = 25;
const DEFAULT_LOGO = '/images/qs-universities/qs-university-default.jpg';
const FILTER_OPTIONS = {
  discipline: ['Business & Management', 'Engineering & Technology', 'Computer Science', 'Medicine & Health', 'Arts & Humanities', 'Natural Sciences', 'Social Sciences', 'Law', 'Education'],
  tuition_max: ['1000000', '2500000', '5000000', '10000000'],
  university_type: ['Public', 'Private'],
  format: ['On-Campus', 'Blended'],
  degree: ['Undergraduate', 'Postgraduate', 'PhD'],
  special_program: ['Executive', 'Joint'],
} as const;

type ProfileFilterKey = keyof typeof FILTER_OPTIONS;
type ProfileFilters = Record<ProfileFilterKey, string>;
const EMPTY_PROFILE_FILTERS: ProfileFilters = {
  discipline: '', tuition_max: '', university_type: '', format: '', degree: '', special_program: '',
};

function displayRank(rank: string) {
  return rank.trim().replace(/^=+\s*/, '');
}

function visiblePages(current: number, total: number) {
  const pages = new Set([1, total]);
  for (let page = current - 2; page <= current + 2; page += 1) {
    if (page > 0 && page <= total) pages.add(page);
  }
  return [...pages].sort((a, b) => a - b);
}

export default function QSRankingDirectory() {
  const [dataset, setDataset] = useState<'qs' | 'all'>('qs');
  const [data, setData] = useState<RankingResponse | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [country, setCountry] = useState('');
  const [rankBand, setRankBand] = useState('');
  const [scoreMin, setScoreMin] = useState('');
  const [profileFilters, setProfileFilters] = useState<ProfileFilters>(EMPTY_PROFILE_FILTERS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshTick, setRefreshTick] = useState(0);
  const [urlReady, setUrlReady] = useState(false);

  const writeURL = useCallback((
    method: 'pushState' | 'replaceState' = 'replaceState',
    overrides: { dataset?: 'qs' | 'all'; page?: number } = {},
  ) => {
    const selectedDataset = overrides.dataset ?? dataset;
    const selectedPage = overrides.page ?? page;
    const params = new URLSearchParams();
    params.set('dataset', selectedDataset);
    params.set('page', String(selectedPage));
    if (search) params.set('q', search);
    if (country) params.set('country', country);
    if (selectedDataset === 'qs') {
      if (rankBand) params.set('rank', rankBand);
      if (scoreMin) params.set('score', scoreMin);
      Object.entries(profileFilters).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
    }
    window.history[method](null, '', `/all-university?${params.toString()}`);
  }, [dataset, page, search, country, rankBand, scoreMin, profileFilters]);

  useEffect(() => {
    const restoreFromURL = () => {
      const params = new URLSearchParams(window.location.search);
      const restoredDataset = params.get('dataset') === 'all' ? 'all' : 'qs';
      const restoredPage = Math.max(1, Number(params.get('page')) || 1);
      const restoredSearch = params.get('q') || '';
      setDataset(restoredDataset);
      setPage(restoredPage);
      setSearchInput(restoredSearch);
      setSearch(restoredSearch);
      setCountry(params.get('country') || '');
      setRankBand(params.get('rank') || '');
      setScoreMin(params.get('score') || '');
      setProfileFilters({
        discipline: params.get('discipline') || '',
        tuition_max: params.get('tuition_max') || '',
        university_type: params.get('university_type') || '',
        format: params.get('format') || '',
        degree: params.get('degree') || '',
        special_program: params.get('special_program') || '',
      });
      setData(null);
      setLoading(true);
      setUrlReady(true);
    };
    restoreFromURL();
    window.addEventListener('popstate', restoreFromURL);
    return () => window.removeEventListener('popstate', restoreFromURL);
  }, []);

  useEffect(() => {
    if (urlReady) writeURL('replaceState');
  }, [urlReady, writeURL]);

  // While the complete directory is being populated, refresh its MongoDB
  // count/cards automatically. Users do not need to reload the page.
  useEffect(() => {
    if (dataset !== 'all') return;
    const timer = window.setInterval(() => setRefreshTick((value) => value + 1), 30_000);
    return () => window.clearInterval(timer);
  }, [dataset]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const nextSearch = searchInput.trim();
      if (nextSearch !== search) {
        setLoading(true);
        setError('');
        setSearch(nextSearch);
        setPage(1);
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput, search]);

  useEffect(() => {
    if (!urlReady) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (search) params.set('search', search);
    if (country) params.set('country', country);
    if (dataset === 'qs' && rankBand) {
      const [rankMin, rankMax] = rankBand.split('-');
      params.set('rank_min', rankMin);
      if (rankMax) params.set('rank_max', rankMax);
    }
    if (dataset === 'qs' && scoreMin) params.set('score_min', scoreMin);
    if (dataset === 'qs') Object.entries(profileFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });

    fetch(`${dataset === 'qs' ? '/api/qs-rankings' : '/api/all-universities'}?${params}`, { signal: controller.signal, cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to load universities');
        return body as RankingResponse;
      })
      .then(setData)
      .catch((reason) => {
        if (reason.name !== 'AbortError') setError(reason.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [urlReady, dataset, page, search, country, rankBand, scoreMin, profileFilters, refreshTick]);

  const activeFilterCount = [country, rankBand, scoreMin, ...Object.values(profileFilters)].filter(Boolean).length;

  const clearFilters = () => {
    setLoading(true);
    setError('');
    setSearchInput('');
    setSearch('');
    setCountry('');
    setRankBand('');
    setScoreMin('');
    setProfileFilters(EMPTY_PROFILE_FILTERS);
    setPage(1);
  };

  const setProfileFilter = (key: ProfileFilterKey, value: string) => {
    setLoading(true);
    setError('');
    setProfileFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
  };

  const pages = useMemo(
    () => visiblePages(data?.page || 1, data?.total_pages || 1),
    [data?.page, data?.total_pages],
  );

  const goToPage = (nextPage: number) => {
    setLoading(true);
    setError('');
    setPage(nextPage);
    writeURL('pushState', { page: nextPage });
  };

  const selectDataset = (nextDataset: 'qs' | 'all') => {
    setDataset(nextDataset);
    setPage(1);
    setData(null);
    setLoading(true);
    writeURL('pushState', { dataset: nextDataset, page: 1 });
  };

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{dataset === 'qs' ? 'QS WORLD UNIVERSITY RANKINGS' : 'GLOBAL UNIVERSITY DIRECTORY'}</p>
          <h1>{dataset === 'qs' ? "Explore the world's ranked universities" : "Explore the complete university directory"}</h1>
          <p>{dataset === 'qs' ? `Search all ${data?.total_items?.toLocaleString() || '1,504'} ranked institutions, with official QS rank, score, location and logo.` : `Search all ${data?.total_items?.toLocaleString() || '7,491'} QS directory institutions, including universities without a published QS world rank.`}</p>
        </div>
      </section>

      <section className={styles.directory}>
        <div className={styles.datasetTabs} aria-label="University dataset">
          <button className={dataset === 'qs' ? styles.activeDataset : ''} onClick={() => selectDataset('qs')}>QS ranked</button>
          <button className={dataset === 'all' ? styles.activeDataset : ''} onClick={() => selectDataset('all')}>All universities</button>
        </div>
        <div className={styles.toolbar}>
          <label className={styles.searchBox}>
            <span className={styles.srOnly}>Search universities</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m21 21-4.4-4.4m2.4-5.1a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search university or location"
            />
          </label>
          <select
            className={styles.countrySelect}
            value={country}
            onChange={(event) => {
              setLoading(true);
              setError('');
              setCountry(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by country"
          >
            <option value="">All countries</option>
            {(data?.countries || []).map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <div className={styles.resultCount}>
            <strong>{data?.total_items?.toLocaleString() || 0}</strong>
            <span>results</span>
          </div>
        </div>

        <div className={styles.content}>
          <aside className={styles.sidebar}>
            <div className={styles.filterHeading}>
              <div><span>All filters</span>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}</div>
              <button type="button" onClick={clearFilters} disabled={!activeFilterCount && !search}>Clear all</button>
            </div>

            {dataset === 'qs' && <details open className={styles.filterGroup}>
              <summary>QS ranking</summary>
              <label>Rank range<select value={rankBand} onChange={(event) => { setRankBand(event.target.value); setPage(1); }}>
                <option value="">All ranks</option><option value="1-100">Top 100</option><option value="101-250">101–250</option><option value="251-500">251–500</option><option value="501-1000">501–1000</option><option value="1001-">1001+</option>
              </select></label>
              <label>Minimum score<select value={scoreMin} onChange={(event) => { setScoreMin(event.target.value); setPage(1); }}>
                <option value="">Any score</option><option value="90">90+</option><option value="80">80+</option><option value="70">70+</option><option value="60">60+</option><option value="50">50+</option>
              </select></label>
            </details>}

            {dataset === 'qs' && <details open className={styles.filterGroup}>
              <summary>Discipline</summary>
              <select aria-label="Discipline" value={profileFilters.discipline} onChange={(event) => setProfileFilter('discipline', event.target.value)}>
                <option value="">All disciplines</option>{FILTER_OPTIONS.discipline.map((value) => <option key={value}>{value}</option>)}
              </select>
            </details>}

            <details open className={styles.filterGroup}>
              <summary>Location</summary>
              <select aria-label="Location" value={country} onChange={(event) => { setCountry(event.target.value); setPage(1); }}>
                <option value="">All countries</option>{(data?.countries || []).map((value) => <option key={value}>{value}</option>)}
              </select>
            </details>

            {dataset === 'qs' && <details className={styles.filterGroup}>
              <summary>Tuition Fee</summary>
              <select aria-label="Tuition fee" value={profileFilters.tuition_max} onChange={(event) => setProfileFilter('tuition_max', event.target.value)}>
                <option value="">Any tuition fee</option><option value="1000000">Up to ₹10 lakh</option><option value="2500000">Up to ₹25 lakh</option><option value="5000000">Up to ₹50 lakh</option><option value="10000000">Up to ₹1 crore</option>
              </select>
            </details>}

            {dataset === 'qs' && ([
              ['university_type', 'University Type', 'All university types'],
              ['format', 'Format', 'All formats'],
              ['degree', 'Degree', 'All degrees'],
              ['special_program', 'Special Programmes', 'All programmes'],
            ] as const).map(([key, label, emptyLabel]) => (
              <details className={styles.filterGroup} key={key}>
                <summary>{label}</summary>
                <select aria-label={label} value={profileFilters[key]} onChange={(event) => setProfileFilter(key, event.target.value)}>
                  <option value="">{emptyLabel}</option>
                  {FILTER_OPTIONS[key].map((value) => <option key={value} value={value}>{value === 'PhD' ? 'Doctorate/PhD' : value === 'Executive' ? 'Executive Programmes' : value === 'Joint' ? 'Joint Programmes' : value}</option>)}
                </select>
              </details>
            ))}

            <div className={styles.filterMeta}><span>{dataset === 'qs' ? `QS ${data?.ranking_year || 2027}` : 'QS directory'}</span><span>{PAGE_SIZE} per page</span></div>
          </aside>

          <div className={styles.results} aria-live="polite">
            {error && <div className={styles.error}>{error}</div>}
            {loading ? (
              <div className={styles.loading}>Loading {dataset === 'qs' ? 'QS ranked' : 'all'} universities…</div>
            ) : data?.items.length ? (
              <>
                <div className={styles.cards}>
                  {data.items.map((university) => (
                    <article className={styles.card} key={`${university.ranking_year}-${university.inner_url || university.name}`}>
                      <div className={styles.rankPanel}>
                        <span>{dataset === 'qs' ? 'Rank' : 'Directory'}</span>
                        <strong>{dataset === 'qs' ? displayRank(university.rank) : university.is_qs_ranked ? 'QS' : 'All'}</strong>
                        <div><small>{dataset === 'qs' ? 'Overall score' : 'Ranking status'}</small><b>{dataset === 'qs' ? (university.score && university.score !== 'n/a' ? university.score : '—') : university.is_qs_ranked ? 'QS ranked' : 'Not ranked'}</b></div>
                      </div>
                      <div className={styles.cardBody}>
                        <div className={styles.identity}>
                          <Image
                            src={university.logo_path || DEFAULT_LOGO}
                            alt={`${university.name} logo`}
                            width={80}
                            height={80}
                            onError={(event: SyntheticEvent<HTMLImageElement>) => { event.currentTarget.src = DEFAULT_LOGO; }}
                          />
                          <div>
                            <h2>{university.name}</h2>
                            <p><span aria-hidden="true">⌖</span> {university.location || university.country || 'Location unavailable'}</p>
                            <div className={styles.cardActions}>
                              <a href={`/qs/viewdetails/${encodeURIComponent(university.name)}`}>View details</a>
                              {university.inner_url && (
                                <a href={university.inner_url} target="_blank" rel="noreferrer">Explore QS ↗</a>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className={styles.scoreStrip}>
                          <div><span>{dataset === 'qs' ? 'QS world rank' : 'Dataset'}</span><strong>{dataset === 'qs' ? displayRank(university.rank) : 'University directory'}</strong></div>
                          <div><span>{dataset === 'qs' ? 'Overall score' : 'QS ranking'}</span><strong>{dataset === 'qs' ? (university.score && university.score !== 'n/a' ? university.score : 'Not published') : university.is_qs_ranked ? 'Published' : 'Not published'}</strong></div>
                          <div><span>Country</span><strong>{university.country || '—'}</strong></div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>

                {data.total_pages > 1 && (
                  <nav className={styles.pagination} aria-label="University pages">
                    <button disabled={page <= 1} onClick={() => goToPage(page - 1)}>Previous</button>
                    {pages.map((number, index) => (
                      <span key={number} className={styles.pageSlot}>
                        {index > 0 && number - pages[index - 1] > 1 && <i>…</i>}
                        <button className={number === page ? styles.activePage : ''} onClick={() => goToPage(number)}>{number}</button>
                      </span>
                    ))}
                    <button disabled={page >= data.total_pages} onClick={() => goToPage(page + 1)}>Next</button>
                  </nav>
                )}
              </>
            ) : (
              <div className={styles.empty}>No universities match these filters.</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
