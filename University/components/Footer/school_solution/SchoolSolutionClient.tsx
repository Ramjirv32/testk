'use client';

import Image from "next/image";
import { useEffect, useState } from "react";
import styles from "./schoolSolution.module.css";

const faqBlocks = [
  {
    title: "Why Select Our Education Solutions?",
    points: [
      "Comprehensive support tailored for students, teachers, and parents.",
      "Psychometric assessments, global education insights, and expert-led training.",
      "Structured programs designed to elevate academic performance and student development.",
      "Provides the best school solution for sustainable long-term academic progress."
    ]
  },
  {
    title: "What Differentiates TRU School Solutions?",
    points: [
      "Professional development workshops and next-generation skill-building sessions.",
      "Effective parent involvement and teacher skill enhancement.",
      "Leadership frameworks that prepare students for elite global universities.",
      "Built on a proven, research-backed best school solution methodology.",
      "Supports institutions in achieving growth through a modern, scalable best school solution strategy."
    ]
  },
  {
    title: "TRU Support Features",
    points: [
      "End-to-End School Partnership: A full academic growth model for Best school solution.",
      "Expert-Led Workshops: Conducted by international educators and certified trainers.",
      "Future-Skill Development: Builds competencies needed for global opportunities.",
      "International Collaboration: Exposure to global faculty and university insights.",
      "Customized Training Modules: Tailored for students, teachers, and parents.",
      "Real-Time Progress Tracking: Ensures measurable academic outcomes.",
      "Seamless Implementation Support: On-ground and virtual assistance for all programs."
    ]
  }
];

export default function SchoolSolutionClient() {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    const containers = document.querySelectorAll(`.${styles.imageContainer}`);
    

    if (containers.length > 0) {
      containers[0].classList.add(styles.active);
    }

    containers.forEach((container) => {
      container.addEventListener("mouseenter", function() {
        containers.forEach((c) => c.classList.remove(styles.active));
        container.classList.add(styles.active);
      });
    });

    return () => {
      containers.forEach((container) => {
        container.removeEventListener("mouseenter", () => {});
      });
    };
  }, []);

  return (
    <div>
      <section className="section1">
        <div className="container">
          <div className="row">
            <div className="col-12 subpage_coloum">
              <div className="subpage_heading">
                <h1>SCHOOL SOLUTIONS</h1>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.whoareSection}>
        <div className="container">
          <div className="row d-flex align-items-center justify-content-center">
            <div className="col-lg-5 col-md-5 col-sm-12">
              <div className={`${styles.imageContainer} ${styles.active}`}>
                <div className={styles.schoolImgAbsolute}></div>
                <Image 
                  className={styles.schoolMainImg} 
                  src="/images/student.png" 
                  alt="School Student"
                  width={500}
                  height={500}
                />
                <h4>School Student</h4>

                <div className={`${styles.feature} ${styles.feature1} ${styles.vertMove}`}>
                  <Image src="/images/psychometric.png" alt="Psychometric Test" width={60} height={60} />
                  <a href="/psychometric">
                    <h6>Psychometric<br /> Test</h6>
                  </a>
                </div>
                <div className={`${styles.feature} ${styles.feature2} ${styles.vertMove}`}>
                  <Image src="/images/language.png" alt="Language Training" width={60} height={60} />
                  <a href="/learning_hub">
                    <h6>Language, <br />Training</h6>
                  </a>
                </div>
                <div className={`${styles.feature} ${styles.feature3} ${styles.vertMove}`}>
                  <Image src="/images/sat.png" alt="SAT Training" width={60} height={60} />
                  <a href="/learning_hub">
                    <h6>SAT Training</h6>
                  </a>
                </div>
                <div className={`${styles.feature} ${styles.feature4} ${styles.vertMove}`}>
                  <Image src="/images/industry.png" alt="Industry Knowledge" width={60} height={60} />
                  <a href="/all-blogs">
                    <h6>Industry <br />Knowledge</h6>
                  </a>
                </div>
                <div className={`${styles.feature} ${styles.feature5} ${styles.vertMove}`}>
                  <Image src="/images/technology.png" alt="Talk on New Tech" width={60} height={60} />
                  <a href="/all-blogs">
                    <h6>Talk on <br />New Tech</h6>
                  </a>
                </div>
              </div>
            </div>

            <div className="col-lg-5 col-md-5 col-sm-12">
              <div className={styles.imageContainer}>
                <div className={styles.schoolImgAbsolute}></div>
                <Image 
                  className={styles.schoolMainImg} 
                  src="/images/parents.png" 
                  alt="Parents"
                  width={500}
                  height={500}
                />
                <h4>Parents</h4>

                <div className={`${styles.feature} ${styles.feature12} ${styles.vertMove}`}>
                  <Image src="/images/technology.png" alt="Talk on New Tech" width={60} height={60} />
                  <a href="/all-blogs">
                    <h6>Talk on <br />New Tech</h6>
                  </a>
                </div>
                <div className={`${styles.feature} ${styles.feature6} ${styles.vertMove}`}>
                  <Image src="/images/ranking.png" alt="How to get Admission" width={60} height={60} />
                  <a href="/all-university">
                    <h6>How to get <br />Admission in <br /> Top Ranking University</h6>
                  </a>
                </div>
                <div className={`${styles.feature} ${styles.feature7} ${styles.vertMove}`}>
                  <Image src="/images/industry.png" alt="Industry Knowledge" width={60} height={60} />
                  <a href="/all-blogs">
                    <h6>Industry <br />Knowledge</h6>
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="row d-flex align-items-center justify-content-center">
            <div className="col-lg-5 col-md-5 col-sm-12">
              <div className={styles.imageContainer}>
                <div className={styles.schoolImgAbsolute}></div>
                <Image 
                  className={styles.schoolMainImg} 
                  src="/images/staff.png" 
                  alt="Teacher / School Management"
                  width={500}
                  height={500}
                />
                <h4>Teacher / School Management</h4>

                <div className={`${styles.feature} ${styles.feature8} ${styles.vertMove}`}>
                  <Image src="/images/children.png" alt="Awareness on Future Tech" width={60} height={60} />
                  <a href="/all-blogs">
                    <h6> Awarness on Future <br /> Tech for School Kids</h6>
                  </a>
                </div>
                <div className={`${styles.feature} ${styles.feature9} ${styles.vertMove}`}>
                  <Image src="/images/ranking.png" alt="Getting Admission" width={60} height={60} />
                  <a href="/all-university">
                    <h6>Getting Admission <br /> in Top Ranking <br /> University<br /> for School Children</h6>
                  </a>
                </div>
                <div className={`${styles.feature} ${styles.feature10} ${styles.vertMove}`}>
                  <Image src="/images/connecting-people.png" alt="Connecting with International" width={60} height={60} />
                  <a href="/learning_hub">
                    <h6>Connecting with <br /> International <br /> Professor / Teacher</h6>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className="container">
          <div className={styles.faqWrapper}>
            {faqBlocks.map((block, index) => (
              <details
                key={block.title}
                className={styles.faqCard}
                open={index === activeIndex}
              >
                <summary
                  onClick={(event) => {
                    event.preventDefault();
                    setActiveIndex((current) =>
                      current === index ? -1 : index
                    );
                  }}
                >
                  <span>{block.title}</span>
                  <span className={styles.chevron} aria-hidden="true">
                    
                  </span>
                </summary>
                <ul>
                  {block.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
