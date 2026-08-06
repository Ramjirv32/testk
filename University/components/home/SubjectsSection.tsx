'use client';

import { useState, useEffect } from 'react';

export default function SubjectsSection() {
  const [expandedIndex, setExpandedIndex] = useState<number>(-1);

  const subjects = [
    {
      name: 'Business & Management',
      description: 'Adopt the knowledge of the top business schools listed in the world ranking university to enhance your global professional career. Explore MBA and management programs provided by the best universities globally, which are acclaimed for their contributions to entrepreneurship, finance, and leadership education.',
      link: 'Explore: Top Business Schools 2026'
    },
    {
      name: 'Engineering & Technology',
      description: 'The worldwide top-tier university list of engineering schools includes the likes of innovation hubs and high-end research labs that shape tomorrow\'s tech. Check out the universities that are leading the research and are active in practical innovation with their civil, mechanical, electrical, and computer engineering programs.',
      link: 'Explore: Best Engineering Colleges in Europe'
    },
    {
      name: 'Computer Science & IT',
      description: 'Be part of the time where all is digital through the top universities in the world for computer science and information technology from any place. Find the ranking of the world universities to compare the global leaders in AI, cybersecurity, and data science that are recognized for innovation and employability.',
      link: 'Explore: Top Computer Science Universities 2026'
    },
    {
      name: 'Medicine & Life Sciences',
      description: 'Explore the world ranking university reports that determine the most reputable centers in medicine and life sciences. The best universities globally are the birthplace of the next generation of medical professionals and researchers who will foster worldwide healthcare by means of research-based education.',
      link: 'Explore: Top Medical Universities 2026'
    },
    {
      name: 'Arts, Humanities & Design',
      description: 'At the most renowned universities for arts, design, and humanities, spark your creative energy. Find out how global university ranking data highlights that the institutions are the ones that blend innovation with creativity to educate the next generation of inventive thinkers.',
      link: 'Explore: Best Arts & Humanities Universities'
    },
    {
      name: 'Social Sciences & Law',
      description: 'Discover different societies across the globe and study the behavior of humans and the ways of fairness through the highly ranked university programs in law, economics, psychology, and sociology. These universities that top the world are characterized by their breakthroughs in research, societal impact, and academic reputation.',
      link: 'Explore: Top Law & Social Science Programs'
    },
    {
      name: 'Natural Sciences & Mathematics',
      description: 'Delve into the world ranking university listings for physics, chemistry, biology, and mathematics courses at the leading universities across the globe. Learn about these university locations where research is the primary driver of scientific innovation and the making of new discoveries all over the world.',
      link: 'Explore: Best Science Universities 2026'
    },
    {
      name: 'Environmental & Agricultural Sciences',
      description: 'Find out the most sustainable industries with the help of the global database of universities. Uncover the top universities in the world that are heavily involved in the research areas of agronomy, forest sciences, and environmental studies to achieve a sustainable future.',
      link: 'Explore: Top Environmental Universities 2026'
    }
  ];

  useEffect(() => {
    if (expandedIndex !== -1) {
      const timer = setTimeout(() => {
        setExpandedIndex(-1);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [expandedIndex]);

  return (
    <section className="subjects_section">
      <div className="container">
        <div className="row">
          <div className="col-lg-12" data-aos="fade-up" data-aos-easing="ease" data-aos-delay="100">
            <div className="subjects_content">
              <h2>Find the Right Course for Your Future</h2>
              <p>
                Find out the leading universities worldwide according to the subjects that are the most important for you. 
                If you want to become a global business leader, an innovative engineer, or a creative artist, our subject-wise 
                listings from the world ranking university database make it easy for you to get on the right academic path for you. 
                Get to know the programs that have been acknowledged for their academic excellence, pioneering research, and 
                international career prospects—just by using one reliable platform that presents the top universities in the world.
              </p>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-12">
            <div className="subjects_accordion">
              {subjects.map((subject, index) => (
                <div 
                  key={index}
                  className="subject_accordion_item"
                >
                  <div 
                    className="accordion_header"
                    onClick={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
                  >
                    <span className="accordion_title">{subject.name}</span>
                    <span className="accordion_icon">
                      {expandedIndex === index ? '' : ''}
                    </span>
                  </div>

                  {expandedIndex === index && (
                    <div className="accordion_content">
                      <p>{subject.description}</p>
                      {subject.link && (
                        <a href="#" className="explore_link">{subject.link}</a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
