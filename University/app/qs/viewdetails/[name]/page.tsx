/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { API_URL, WS_URL } from '@/lib/config';
import styles from './page.module.css';

type Payload = { status: 'ready' | 'pending' | 'scraping'; profile?: any; ranking?: any; running?: boolean };

export default function QSViewDetailsPage() {
  const params = useParams();
  const name = decodeURIComponent(params.name as string);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let socket: WebSocket | null = null;
    let poller: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch(`${API_URL}/api/qs-profile?name=${encodeURIComponent(name)}`, { cache: 'no-store' });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load QS profile');
        if (cancelled) return;
        setPayload(data);
        if (data.status === 'ready') return;

        const runResponse = await fetch(`${API_URL}/api/qs-profile/run`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }),
        });
        const runData = await runResponse.json();
        if (!runResponse.ok) throw new Error(runData.error || 'Unable to start QS profile scraper');
        if (runData.status === 'ready') {
          setPayload(runData);
          return;
        }
        socket = new WebSocket(`${WS_URL}/ws/qs-profile?name=${encodeURIComponent(name)}`);
        socket.onmessage = (event) => {
          const update = JSON.parse(event.data) as Payload;
          if (!cancelled) setPayload((current) => ({ ...current, ...update }));
        };
        socket.onerror = () => {
          if (!cancelled) setError('Live connection interrupted; HTTP progress checks are still active.');
        };
        poller = setInterval(async () => {
          try {
            const progressResponse = await fetch(`${API_URL}/api/qs-profile?name=${encodeURIComponent(name)}`, { cache: 'no-store' });
            const progress = await progressResponse.json();
            if (!cancelled && progressResponse.ok) setPayload(progress);
            if (progress.status === 'ready' && poller) {
              clearInterval(poller);
              poller = null;
              socket?.close();
            }
          } catch { /* WebSocket remains the primary live channel. */ }
        }, 2000);
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'Unable to load QS profile');
      }
    };
    load();
    return () => { cancelled = true; socket?.close(); if (poller) clearInterval(poller); };
  }, [name]);

  if (!payload && !error) return <div className={styles.center}><div className={styles.spinner} /><h1>Loading QS profile…</h1></div>;
  if (error && !payload) return <div className={styles.center}><h1>{error}</h1><Link href="/all-university">← All universities</Link></div>;
  if (payload?.status !== 'ready' || !payload.profile) return <PendingProfile name={name} ranking={payload?.ranking} profile={payload?.profile} message={error} />;
  return <ReadyProfile profile={payload.profile} />;
}

function PendingProfile({ name, ranking, profile, message }: { name: string; ranking?: any; profile?: any; message?: string }) {
  const completed: string[] = profile?.completed_sections || [];
  return <main className={styles.page}>
    <section className={styles.pendingHero}><Link href="/all-university">← All universities</Link><div className={styles.pendingCard}>
      {ranking?.logo_path && <Image src={ranking.logo_path} alt={`${name} logo`} width={90} height={90} />}
      <div><p>QS PROFILE SCRAPING</p><h1>{name}</h1><span>{ranking?.location}</span></div>
    </div></section>
    <section className={styles.progress}><div className={styles.spinner} /><h2>Please wait about 10–15 seconds</h2><p>The selected university is being scraped now. Each completed section is stored in MongoDB and sent to this page live.</p>
      {completed.length > 0 && <div className={styles.groups}>{completed.map(section => <span key={section}>✓ {section.replaceAll('_', ' ')}</span>)}</div>}
      {profile?.about && <p className={styles.prose}>{profile.about}</p>}
      <div className={styles.progressBar}><i /></div><small>{message || 'Live updates are connected through WebSocket. This page will update automatically.'}</small></section>
  </main>;
}

function ReadyProfile({ profile }: { profile: any }) {
  const qs = profile.qs_profile || {}; const programs = profile.programs || {}; const filters = profile.filters || {};
  const groups: Array<[string, any[]]> = [['Undergraduate', cleanProgrammes(programs.ug_programs)], ['Postgraduate', cleanProgrammes(programs.pg_programs)], ['Doctorate/PhD', cleanProgrammes(programs.phd_programs)]];
  const total = groups.reduce((sum, [, items]) => sum + items.length, 0);
  const rawPage = qs.campus_locations || '';
  const information = usableSection(qs.university_information, rawPage, ['University Information'], ['Cost of Living', 'Scholarships', 'Employability']);
  const cost = usableSection(qs.cost_of_living, rawPage, ['Cost of Living'], ['Scholarships', 'Employability', 'Rankings & Ratings']);
  const scholarships = usableSection(qs.scholarships, rawPage, ['Scholarships'], ['Employability', 'Rankings & Ratings', 'Campus Locations']);
  const employability = usableSection(qs.employability, rawPage, ['Employability'], ['Rankings & Ratings', 'Videos & Media', 'Campus Locations']);
  const rankings = usableSection(qs.rankings_ratings, rawPage, ['Rankings & Ratings'], ['Videos & Media', 'Campus Locations']);
  const media = usableSection(qs.videos_media, rawPage, ['Videos & Media'], ['Campus Locations']);
  const campus = rawPage.includes('About ')
    ? extractSection(rawPage, ['Campus Locations'], ['Similar Universities', 'Follow us', 'For Students'])
    : cleanText(rawPage);
  return <main className={styles.page}>
    <section className={styles.hero}><div className={styles.wrap}><Link href="/all-university" className={styles.back}>← All universities</Link><div className={styles.identity}>
      {profile.logo_path && <Image src={profile.logo_path} alt={`${profile.college_name} logo`} width={105} height={105} />}
      <div><p>QS UNIVERSITY PROFILE</p><h1>{profile.college_name}</h1><span>{profile.location || profile.country}</span><div className={styles.actions}><a href={profile.source_url} target="_blank" rel="noreferrer">Explore QS ↗</a></div></div>
    </div><div className={styles.stats}><div><span>QS world rank</span><b>{String(qs.rank || '—').replace(/^=+/, '')}</b></div><div><span>Overall score</span><b>{qs.score || '—'}</b></div><div><span>Programmes extracted</span><b>{total}</b></div><div><span>University type</span><b>{profile.institution_type || 'Not published'}</b></div></div></div></section>
    <nav className={styles.nav}><a href="#overview">Overview</a><a href="#programmes">Programmes</a><a href="#information">Information</a><a href="#cost">Costs</a><a href="#scholarships">Scholarships</a><a href="#employability">Employability</a><a href="#rankings">Rankings</a><a href="#media">Media</a><a href="#campus">Campus</a></nav>
    <div className={styles.layout}><article>
      <Section id="overview" eyebrow="Overview" title={`About ${profile.college_name}`} text={profile.about || profile.summary} />
      <section id="programmes" className={styles.section}><p className={styles.eyebrow}>Academic offering</p><h2>Available programmes</h2><div className={styles.groups}>{groups.filter(([,items]) => items.length).map(([label,items]) => <details key={label}><summary>{label}<b>{items.length}</b></summary><div className={styles.courseGrid}>{items.map((item,index) => <div className={styles.courseCard} key={`${item.title}-${index}`}><span>{label}</span><strong>{item.title}</strong></div>)}</div></details>)}</div></section>
      <UniversityInfoSection qs={qs} fallback={information} />
      <CostSection text={cost} />
      <ScholarshipSection text={scholarships} />
      <Section id="employability" eyebrow="Careers" title="Employability and career services" text={employability} />
      <RankingsSection text={rankings} criteria={qs.ranking_criteria || []} />
      <MediaSection text={media} titles={qs.media_titles || []} items={qs.media_items || []} />
      <CampusSection text={campus} fallback={profile.location} />
    </article><aside className={styles.aside}><h2>Study filters</h2><Fact label="Disciplines" value={(filters.disciplines || []).join(', ')} /><Fact label="Degree levels" value={(filters.degrees || []).join(', ')} /><Fact label="Format" value={(filters.formats || []).join(', ')} /><Fact label="Special programmes" value={(filters.special_programs || []).join(', ')} /><small>Source: QS TopUniversities<br/>Last scraped: {profile.scraped_at ? new Date(profile.scraped_at).toLocaleString() : 'Recently'}</small></aside></div>
  </main>;
}

function Section({ id, eyebrow, title, text, fallback = 'This section was not published by QS.' }: { id: string; eyebrow: string; title: string; text?: string; fallback?: string }) { return <section id={id} className={styles.section}><p className={styles.eyebrow}>{eyebrow}</p><h2>{title}</h2><p className={styles.prose}>{cleanText(text) || fallback}</p></section>; }
function Fact({ label, value }: { label: string; value?: string }) { return <div><span>{label}</span><p>{value || 'Not published'}</p></div>; }

const NOISE_LINE = /^(?:::type_[a-z0-9_:-]+::|go to programme|go to program|view (?:more|less|all)|read (?:more|less)|chat to students?|apply with qs|log in|sign up|home|universities)$/i;

function cleanText(value?: string) {
  if (!value) return '';
  return value.replace(/\u00a0/g, ' ').split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => !NOISE_LINE.test(line)).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function cleanProgrammes(items: any[] = []) {
  const seen = new Set<string>();
  return items.filter(Boolean).map(item => ({ ...item, title: cleanText(item.title).replace(/\n/g, ' ') }))
    .filter(item => item.title && !NOISE_LINE.test(item.title) && !/^::.*::$/.test(item.title))
    .filter(item => { const key = item.title.toLocaleLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
}

function extractSection(raw: string, headings: string[], endings: string[]) {
  const lines = raw.replace(/\u00a0/g, ' ').split(/\r?\n/).map(line => line.replace(/\s+/g, ' ').trim());
  const starts = lines.map((line, index) => headings.some(value => line.toLowerCase() === value.toLowerCase()) ? index : -1).filter(index => index >= 0);
  if (!starts.length) return '';
  const start = starts[starts.length - 1];
  const end = lines.findIndex((line, index) => index > start && endings.some(value => line.toLowerCase() === value.toLowerCase()));
  return cleanText(lines.slice(start + 1, end > start ? end : undefined).join('\n'));
}

function usableSection(value: string, raw: string, headings: string[], endings: string[]) {
  const cleaned = cleanText(value);
  const extracted = extractSection(raw, headings, endings);
  const looksLikeNavigation = /profile\d* menu|home\nuniversities|undergrad & postgrad programmes/i.test(cleaned);
  if (extracted && (headings[0] === 'Scholarships' || cleaned.length < 40 || looksLikeNavigation)) return extracted;
  if (cleaned.length > 40 && !/^(?:tuition fees?|chat to students?)$/i.test(cleaned)) return cleaned;
  return extracted || cleaned;
}

function CostSection({ text }: { text: string }) {
  const lines = cleanText(text).split('\n').filter(Boolean);
  const rows: Array<{ label: string; value: string }> = [];
  lines.forEach((line, index) => {
    if (!/(?:[$€£]\s?[\d,.]+|[\d,.]+\s?(?:GBP|USD|EUR|AUD|CAD))\b/i.test(line)) return;
    let label = lines[index - 1] || 'Published amount';
    if (/^(?:starts from|approx\.? amount)$/i.test(label)) label = lines[index - 2] || label;
    const value = /starts from/i.test(lines[index - 1] || '') ? `Starts from ${line}` : line;
    if (!rows.some(row => row.label === label && row.value === value)) rows.push({ label, value });
  });
  return <section id="cost" className={styles.section}><p className={styles.eyebrow}>Planning</p><h2>Cost of living and tuition</h2>{rows.length ? <div className={styles.costTable}>{rows.map(row => <div key={`${row.label}-${row.value}`}><span>{row.label}</span><strong>{row.value}</strong></div>)}</div> : <p className={styles.prose}>{cleanText(text) || 'QS has not published cost information.'}</p>}</section>;
}

function ScholarshipSection({ text }: { text: string }) {
  const cleaned = cleanText(text).split('\n').filter(line => !/^(?:by |updated )/i.test(line.trim()) && !/^[\d.]+[KM]?\s+\d+$/i.test(line.trim())).join('\n');
  const blocks = cleaned.split(/\n{2,}/).map(value => value.trim()).filter(Boolean);
  const cards: Array<{ title: string; body: string }> = [];
  for (let index = 0; index < blocks.length - 1; index += 1) {
    const title = blocks[index]; const body = blocks[index + 1];
    if (title.length < 100 && body.length > 35 && !/^(?:by |updated|to help)/i.test(title)) {
      cards.push({ title, body }); index += 1;
    }
  }
  const intro = blocks.filter((block, index) => index < 2 && !cards.some(card => card.title === block)).join(' ');
  return <section id="scholarships" className={styles.section}><p className={styles.eyebrow}>Funding</p><h2>Scholarships</h2>{intro && <p className={styles.sectionIntro}>{intro}</p>}{cards.length ? <div className={styles.scholarshipGrid}>{cards.map((card, index) => <article key={`${card.title}-${index}`}><h3>{card.title}</h3><p>{card.body}</p></article>)}</div> : <p className={styles.prose}>QS has not published scholarship details for this university.</p>}</section>;
}

function UniversityInfoSection({ qs, fallback }: { qs: any; fallback: string }) {
  const requirements = qs.admission_requirements || {};
  const groups = Object.entries(requirements) as Array<[string, Array<{ test: string; score: string }>]>
  const admission = cleanText(qs.admission);
  const contact = cleanText(admission.split(/\n(?:General|Bachelor|Master|Undergraduate|Postgraduate)\n/i)[0]);
  const studentStats = Object.entries(qs.student_stats || {}) as Array<[string, string]>;
  const composition = (qs.student_composition || []) as Array<{ label: string; total: string; first_label: string; first_value: string; second_label: string; second_value: string }>;
  return <section id="information" className={styles.section}><p className={styles.eyebrow}>Student guide</p><h2>University information</h2>
    {contact && <p className={styles.sectionIntro}>{contact}</p>}
    {groups.length > 0 && <div className={styles.requirements}>{groups.map(([group, tests]) => tests.length > 0 && <div key={group}><h3>{group}</h3><div>{tests.map(test => <span key={`${test.test}-${test.score}`}><small>{test.test}</small><strong>{test.score}</strong></span>)}</div></div>)}</div>}
    {!contact && groups.length === 0 && <p className={styles.prose}>{cleanText(fallback) || 'QS has not published admissions information.'}</p>}
    {studentStats.length > 0 && <div className={styles.studentStats}>{studentStats.map(([label, value]) => <div key={label}><span>{label.replaceAll('_', ' ')}</span><strong>{value}</strong></div>)}</div>}
    {composition.length > 0 && <div className={styles.composition}>{composition.map(group => <article key={group.label}><span>{group.label}</span><strong>{group.total}</strong><div><small>{group.first_label}<b>{group.first_value}</b></small><small>{group.second_label}<b>{group.second_value}</b></small></div></article>)}</div>}
    {(qs.facilities || (qs.students_and_staff && composition.length === 0)) && <div className={styles.infoCards}>{qs.facilities && <article><h3>Facilities</h3><p>{cleanText(qs.facilities)}</p></article>}{qs.students_and_staff && composition.length === 0 && <article><h3>Students &amp; staff</h3><p>{cleanText(qs.students_and_staff)}</p></article>}</div>}
  </section>;
}

function RankingsSection({ text, criteria }: { text: string; criteria: Array<{ label: string; score: string }> }) {
  const cleaned = cleanText(text);
  const parsed = criteria.length ? criteria : parseRankingCriteria(cleaned);
  const intro = cleaned.split(/\nRankings\n|\nRanking criteria\n/i)[0];
  return <section id="rankings" className={styles.section}><p className={styles.eyebrow}>Performance</p><h2>Rankings and ratings</h2>{intro && <p className={styles.sectionIntro}>{intro}</p>}{parsed.length > 0 ? <div className={styles.metricGrid}>{parsed.map(metric => <div key={metric.label}><span>{metric.label}</span><strong>{String(metric.score).replace(/^=+/, '')}</strong></div>)}</div> : <p className={styles.prose}>{cleaned || 'QS has not published detailed ranking criteria.'}</p>}</section>;
}

function parseRankingCriteria(text: string) {
  const names = new Set(['overall', 'academic reputation', 'citations per faculty', 'employment outcomes', 'employer reputation', 'faculty student ratio', 'international faculty ratio', 'international research network', 'international student ratio', 'sustainability']);
  const lines = text.split('\n').filter(Boolean); const output: Array<{ label: string; score: string }> = [];
  lines.forEach((line, index) => { if (names.has(line.toLowerCase()) && /^\d+(?:\.\d+)?$/.test(lines[index + 1] || '')) output.push({ label: line, score: lines[index + 1] }); });
  return output;
}

function MediaSection({ text, titles, items }: { text: string; titles: string[]; items: Array<{ title: string; url?: string; thumbnail_url?: string }> }) {
  const cleanTitles = Array.from(new Set(titles.map(cleanText).filter(title => title.length > 5 && !/logo|icon|banner|thumbnail|cookie/i.test(title)))).slice(0, 24);
  const cleanItems = items.filter(item => cleanTitles.includes(cleanText(item.title)));
  return <section id="media" className={styles.section}><p className={styles.eyebrow}>Gallery</p><h2>Videos and media</h2>{cleanTitles.length > 0 ? <div className={styles.mediaGrid}>{cleanTitles.map(title => { const item = cleanItems.find(entry => cleanText(entry.title) === title); const card = <><i style={item?.thumbnail_url ? { backgroundImage: `url(${item.thumbnail_url})` } : undefined} /><span>{title}</span></>; return item?.url ? <a href={item.url} target="_blank" rel="noreferrer" key={title}>{card}</a> : <article key={title}>{card}</article>; })}</div> : <p className={styles.prose}>{cleanText(text) || 'QS has not published media titles for this university.'}</p>}</section>;
}

function CampusSection({ text, fallback }: { text: string; fallback?: string }) {
  const lines = cleanText(text || fallback).split('\n').map(line => line.trim()).filter(Boolean);
  const cleanCampus = (value: string) => value.replace(/\bCampus\s+Campus\b/gi, 'Campus').replace(/\s+/g, ' ').trim();
  const campusLabel = lines.findIndex(line => /^campus name$/i.test(line));
  const campusName = cleanCampus(campusLabel >= 0 ? lines[campusLabel + 1] || '' : lines[0] || fallback || 'Main campus');
  const isMain = lines.some(line => /^main campus$/i.test(line)) || /\(main campus\)/i.test(campusName);
  const normalizedName = campusName.replace(/\s*\(main campus\)\s*/i, '').trim();
  const ignored = new Set(['campus name', 'main campus', 'open in maps', campusName.toLowerCase(), normalizedName.toLowerCase()]);
  const address = Array.from(new Set(lines.map(cleanCampus).filter(line => !ignored.has(line.toLowerCase()) && !/^campus name$/i.test(line))));
  const query = [normalizedName, ...address].join(', ');
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return <section id="campus" className={`${styles.section} ${styles.campusSection}`}><p className={styles.eyebrow}>Locations</p><h2>Campus locations</h2><div className={styles.locationCard}>
    <div className={styles.pin}>⌖</div><div className={styles.locationBody}><div className={styles.locationTitle}><div><span>Primary location</span><h3>{normalizedName}</h3></div>{isMain && <b>Main campus</b>}</div>
      <div className={styles.address}>{address.length > 0 ? address.map((line, index) => <span key={`${line}-${index}`}>{line}</span>) : <span>{fallback || 'Address not published'}</span>}</div>
      <a href={mapsUrl} target="_blank" rel="noreferrer">Open in Maps ↗</a>
    </div></div></section>;
}
