"use client";

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import styles from './academicInstitution.module.css';

const academicPrograms = [
  {
    title: 'Advanced Ranking Intelligence',
    image: '/images/academic-1.png',
    link: '/filter_university',
    bullets: ['Multi-Year Analytics', 'Historical Trends', 'Emerging Metrics', 'Competitor View'],
    gradient: 'linear-gradient(to right, #9a3197, #e084cd)'
  },
  {
    
    title: 'Institutional Benchmarking & TRU Consulting',
    image: '/images/academic-2.png',
    link: '/learning_hub',
    bullets: ['Global Frameworks', 'SDG & Accreditation', 'Gap Analysis', 'Ranking Roadmap'],
    gradient: 'linear-gradient(to right, #9a3197, #e084cd)'
  },

  {
    title: 'Psychometric-Driven Engagement',
    image: '/images/academic-3.png',
    link: '/career-interest-survey',
    bullets: ['Student Personas', 'Course Interest Heatmaps', 'Engagement Insights', 'Mapping Motivations'],
    gradient: 'linear-gradient(to right, #9a3197, #e084cd)'
  },
  {
    title: 'Inclusion in TRU Rankings',
    image: '/images/academic-4.png',
    link: '/all-blogs',
    bullets: ['Contextual Evaluation', 'Subject-level Scores', 'Transparent Criteria', 'Impact Recognition'],
    gradient: 'linear-gradient(to right, #9a3197, #e084cd)'
  },
  {
    title: 'Program Performance Mapping',
    image: '/images/academic-5.png',
    link: '/all-blogs',
    bullets: ['Department Scorecards', 'Demand Forecasting', 'Skill-Job Fit', 'Trend Alignment'],
    gradient: 'linear-gradient(to right, #9a3197, #e084cd)'
  }
];

export default function AcademicInstitutionPage() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const router = useRouter();

  const handleSelectProgram = (programKey: string) => {

    try {
      localStorage.setItem('selectedFilters', JSON.stringify({ program: programKey }));
    } catch (e) {

    }
    router.push('/filter_university');
  };

  return (
    <div className={styles.pageWrapper}>
      <section className={styles.heroSection}>
        <div className={styles.heroContent}>
          <p className={styles.tagline}>TRU SOLUTIONS</p>
          <h1>Top Ranked Academic Institution</h1>
          <p className={styles.heroCopy}>
            Crafted experiences for universities aiming to lead the global education conversation.
            Discover TRU&apos;s high-impact programs built on transparency, data intelligence, and measurable outcomes.
          </p>
        </div>
      </section>

      <section className={styles.academicSection}>
        <div
          className={styles.flexContainer}

        >
          {academicPrograms.map((program, idx) => {
            const key = program.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
            const isActive = activeIndex === idx;
            return (
              <article
                key={program.title}
                className={`${styles.flexCard} ${isActive ? styles.active : ''}`}
                style={{ background: program.gradient }}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                onFocus={() => setActiveIndex(idx)}
                onBlur={() => setActiveIndex(null)}
                tabIndex={0}
              >
                <button
                  type="button"
                  className={styles.cardImageWrapper}
                  onClick={() => handleSelectProgram(key)}
                  aria-label={`Open filters for ${program.title}`}
                >
                  <Image
                    src={program.image}
                    alt={program.title}
                    width={120}
                    height={120}
                    className={styles.cardImage}
                  />
                </button>

                <button
                  className={styles.cardTitleButton}
                  onClick={() => handleSelectProgram(key)}
                >
                  <h3 className={styles.cardTitle}>{program.title}</h3>
                </button>

                <ul className={styles.cardPoints}>
                  {program.bullets.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>

                <button
                  type="button"
                  className={styles.arrowLink}
                  aria-label={`Learn more about ${program.title}`}
                  onClick={() => handleSelectProgram(key)}
                >
                  <Image src="/images/arrow-right.png" alt="Go" width={24} height={24} />
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
