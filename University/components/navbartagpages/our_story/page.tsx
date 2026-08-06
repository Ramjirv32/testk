'use client'

import styles from './ourStory.module.css'
import { useState, useEffect } from 'react'

export default function OurStoryPage() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null)
  const [visibleCards, setVisibleCards] = useState<boolean[]>([false, false, false])

  const storySections = [
    {
      icon: '',
      title: 'From Rankings to Real Impact',
      subtitle: 'How TRU was born',
      paragraphs: [
        'Top Ranking University (TRU) was founded with a single vision: to bring clarity, trust, and global relevance to university rankings and educational choices.',
        'TRU was born from years of experience working with international rankings, accreditation bodies, and global universities. We saw that rankings could be more than numbers on a chart—they could become a roadmap for institutions and a trustworthy guide for students and parents.',
      ],
      color: '#9a3197',
    },
    {
      icon: '',
      title: 'What Drives Us',
      subtitle: 'Transparency, reliability, uniqueness',
      paragraphs: [
        "By uniting Transparency, Reliability, and Uniqueness, TRU Ranking transforms complex data into meaningful insights that highlight institutional strengths, societal contributions, and student outcomes.",
        "We partner with institutions that aspire to be among the world's best—guiding them on quality benchmarks, accreditation readiness, ranking strategy, and student-centered outcomes.",
      ],
      color: '#e084cd',
    },
    {
      icon: '',
      title: 'Who We Serve',
      subtitle: 'Institutions, students, and parents',
      paragraphs: [
        'From universities and schools to students and parents, TRU connects every stakeholder to data, guidance, and tools that make educational decisions more confident and future-ready.',
      ],
      color: '#7c5dac',
    },
  ]

  useEffect(() => {
    const observers = storySections.map((_, index) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisibleCards((prev) => {
              const newVisible = [...prev]
              newVisible[index] = true
              return newVisible
            })
          }
        },
        { threshold: 0.2 }
      )

      const element = document.getElementById(`story-card-${index}`)
      if (element) {
        observer.observe(element)
      }

      return { observer, element }
    })

    return () => {
      observers.forEach(({ observer, element }) => {
        if (element) {
          observer.unobserve(element)
        }
      })
    }
  }, [])

  return (
    <div className={styles.pageWrapper}>
      <section className={styles.heroSection}>
        <div className={styles.heroInner}>
          <h1 className={styles.heroTitle}>Our Story</h1>
          <p className={styles.heroSubtitle}>
            Bringing clarity, trust, and global relevance to education
          </p>
        </div>
      </section>

      <section className={styles.storySection}>
        <div className={styles.storyInner}>
          <div className={styles.cardsGrid}>
            {storySections.map((section, index) => (
              <div
                key={section.title}
                id={`story-card-${index}`}
                className={`${styles.storyCard} ${styles[`card${index}`]} ${visibleCards[index] ? styles.cardVisible : ''} ${
                  expandedIndex === index ? styles.cardExpanded : ''
                }`}
              >
                {}
                <div className={styles.cardHeader} style={{ borderColor: section.color }}>
                  <div
                    className={styles.cardIcon}
                    style={{ backgroundColor: section.color }}
                  >
                    {section.icon}
                  </div>
                  <h2 className={styles.cardTitle}>{section.title}</h2>
                </div>

                {}
                <div
                  className={styles.cardAccent}
                  style={{ backgroundColor: section.color }}
                />

                {}
                <div className={styles.cardContent}>
                  <p className={styles.cardSubtitle} style={{ color: section.color }}>
                    {section.subtitle}
                  </p>

                  <div
                    className={`${styles.cardDescription} ${
                      expandedIndex === index ? styles.descriptionExpanded : ''
                    }`}
                  >
                    {section.paragraphs.map((text, pIndex) => (
                      <p key={pIndex} className={styles.descriptionText}>
                        {text}
                      </p>
                    ))}
                  </div>

                  {}
                  <button
                    className={styles.readMoreBtn}
                    onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    style={{
                      borderColor: section.color,
                      color: expandedIndex === index ? '#fff' : section.color,
                      background:
                        expandedIndex === index
                          ? `linear-gradient(135deg, ${section.color}, #e084cd)`
                          : 'transparent',
                    }}
                  >
                    {expandedIndex === index ? ' Read Less' : ' Read More'}
                  </button>

                  <span className={styles.tagline}>TRUly yours — data-led, student-first.</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
