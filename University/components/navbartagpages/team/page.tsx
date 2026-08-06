"use client"

import { useState, useEffect } from "react"

interface TeamMember {
  name: string
  role: string
  shortBio: string
  fullBio: string
}

const teamData: TeamMember[] = [
  {
    name: "Srinivas",
    role: "Visionary Founder & Serial Entrepreneur",
    shortBio:
      "Srinivas is a first-generation entrepreneur with 17+ years of experience in the study abroad space. As the founder of Galaxy Education and multiple other ventures, his leadership bridges education, technology, and entrepreneurship.",
    fullBio:
      "Srinivas has successfully built Galaxy Education into a trusted name, leading a team of 17+ seasoned counsellours and consultants. His entrepreneurial ventures span across civil engineering (Galaxy Civil Solutions), film production (Galaxy Pictures), and skill-based learning (Galaxy Training Academy). His leadership journey also includes serving as the Country Business School Manager for Audencia. With deep roots in the study abroad industry, he is known for his strategic vision and cross-sectorial innovation. His expertise lies in scaling operations, developing institutional consulting, and delivering innovative education solutions globally.",
  },
  {
    name: "Milind",
    role: "Strategy & Global Student Recruitment",
    shortBio:
      "Milind is a distinguished higher education strategist with over 14 years of comprehensive global experience spanning international admissions, student recruitment, and enrolment management across Asian and European markets.",
    fullBio:
      "Milind is a strategic leader passionate about transforming enrollment through data-driven marketing approaches, educational technology, and startup innovations. A visionary in higher education, Milind has spearheaded business development initiatives for premier Business Schools, Exchange Programs, and Pathway curricula across Asia and Europe, consistently delivering exceptional results with sustainable revenue growth, also with the Indian Business School, and with global digital giants like Info Edge and Times Internet. CRM-driven engagement strategies, navigating complex visa processes, and executing precision marketing campaigns through advanced platforms like HubSpot and Salesforce. Milind remains deeply engaged with emerging trends in the educational technology landscape and actively monitors developments within the startup ecosystem, positioning him at the forefront and the cutting edge of innovation in global higher education.",
  },
  {
    name: "Vasantha Seelan",
    role: "Academic Strategist & Global Ranking Expert",
    shortBio:
      "Vasantha brings unmatched expertise in academic quality assurance, international accreditations, and institutional rankings like THE Impact Rankings and QS Certifications.",
    fullBio:
      "With a strong focus on aligning local priorities with global benchmarks, Vasantha has helped institutions build scalable, SDG-aligned strategies and performance frameworks. Her contributions to the TRU Ranking initiative ensure data-backed, transparent, and contextually relevant outcomes. Her work empowers universities to go beyond compliance and build sustainable academic excellence with strategic foresight and measurable impact.",
  },
  {
    name: "Jaykumar Srinivasan",
    role: "Test Prep & Training Specialist",
    shortBio:
      "Jaykumar is a Certified Master Trainer and Director of Galaxy Training Academy, with 14+ years of experience in IELTS, CELPIP, TOEFL coaching, and international admissions consulting.",
    fullBio:
      "He has mentored thousands of students and professionals, consistently enabling them to achieve top scores through strategic, personalised methodologies. A British Council Certified IELTS Trainer, Level 2 CELPIP Trainer, and ETS-Certified TOEFL expert, Jaykumar seamlessly integrates test prep with overseas admissions guidance. As Academic Head at Galaxy Education Group, he plays a pivotal role in shaping global education journeys for aspirants across the world.",
  },
  {
    name: "Magdalene Clipitha DOMINIC",
    role: "Language Mentor & Cultural Educator",
    shortBio:
      "Magdalene is a French language expert and cross-cultural educator with over a decade of impactful teaching, translation, and mentorship experience.",
    fullBio:
      "As Faculty of French at Kumaraguru College of Liberal Arts and Science, Coimbatore, and Chief Mentor at Clément Foundation, she champions immersive and inclusive language learning. From corporate training to international collaborations with Cambridge University and EEPC India, Magdalene promotes global fluency through real-world application, social advocacy, and educational technology.",
  },
]

export default function TeamTimeline() {
  return (
    <section
      className="min-h-screen bg-[#faf4ec] py-16 px-4 sm:px-6 lg:px-8 font-sans"
      style={{ fontFamily: "var(--font-sans), system-ui, sans-serif" }}
    >
      <style>{`
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-on-scroll {
          opacity: 0;
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .slide-left {
          animation: slideInFromLeft 0.8s ease-out forwards;
        }

        .slide-right {
          animation: slideInFromRight 0.8s ease-out forwards;
        }

        .expand-slow {
          max-height: 0;
          overflow: hidden;
          transition: max-height 1.2s ease-in-out;
        }

        .expand-slow.expanded {
          max-height: 1000px;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center text-[#2d2d2d] mb-4 tracking-wide uppercase">
          Meet the Core Team
        </h2>
        <p className="text-center text-[#5a5a5a] mb-16 text-lg">
          Meet the visionary leaders driving TRU's mission to transform global higher education
        </p>

        <div className="relative">
          {}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-1 bg-black md:-translate-x-1/2 transform" />

          <div className="space-y-16">
            {teamData.map((member, index) => (
              <TimelineItem key={index} member={member} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function TimelineItem({ member, index }: { member: TeamMember; index: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const isEven = index % 2 === 0

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {

        setIsVisible(entry.isIntersecting)
      },
      { threshold: 0.2 }
    )

    const element = document.getElementById(`team-item-${index}`)
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [index])

  return (
    <div
      id={`team-item-${index}`}
      className={`relative flex flex-col md:flex-row items-center ${
        isEven ? "md:flex-row-reverse" : "md:flex-row"
      } ${isVisible ? (isEven ? "slide-right" : "slide-left") : "animate-on-scroll"}`}
    >
      {}
      <div className="hidden md:block md:w-1/2" />

      {}
      <div className="absolute left-4 md:left-1/2 w-6 h-6 rounded-full bg-[#e084cd] border-4 border-[#faf4ec] md:-translate-x-1/2 transform z-10 shadow-md box-content text-foreground hover:w-8 hover:h-8 hover:shadow-lg transition-all duration-300 cursor-pointer" />

      {}
      <div
        className={`w-full md:w-1/2 pl-12 md:pl-0 text-card text-card ${
          isEven ? "md:pr-12" : "md:pl-12"
        }`}
      >
        <div
          className={`relative bg-white rounded-xl shadow-md transition-all duration-500 ease-out overflow-hidden
            ${isExpanded 
              ? "shadow-2xl" 
              : "hover:shadow-xl"
            }
          `}
          style={{
            padding: "28px",
            borderLeft: isEven ? "none" : "5px solid #9a3197",
            borderRight: isEven ? "5px solid #e084cd" : "none",
          }}
        >
          {}
          <div
            className={`absolute top-8 w-0 h-0 border-y-[10px] border-y-transparent hidden md:block ${
              isEven
                ? "right-[-10px] border-l-[10px] border-l-white"
                : "left-[-10px] border-r-[10px] border-r-white"
            }`}
          />
          {}
          <div className="absolute top-8 left-[-10px] w-0 h-0 border-y-[10px] border-y-transparent border-r-[10px] border-r-white md:hidden" />

          {}
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-bold text-[#2d2d2d] mb-2">
              {member.name}
            </h3>
            <h4 
              className="text-base md:text-lg font-semibold mb-4 transition-all duration-300"
              style={{
                background: "linear-gradient(to right, #9a3197, #e084cd)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {member.role}
            </h4>

            <div className="text-[#5a5a5a] leading-relaxed space-y-4 text-base">
              <p className="transition-all duration-300">{member.shortBio}</p>
              <div className={`expand-slow ${isExpanded ? "expanded" : ""}`}>
                <div className="space-y-4 pt-4 border-t border-[#ede9e4]">
                  <p className="text-justify">{member.fullBio}</p>
                  <div className="mt-6 pt-4 border-t border-[#ede9e4] flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#9a3197]"></div>
                    <span className="text-sm font-semibold text-[#9a3197]">
                      Core Team Member
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-6 inline-flex items-center gap-2 px-6 py-2 rounded-lg transition-all duration-300 font-semibold text-sm md:text-base"
              style={{
                background: isExpanded 
                  ? "linear-gradient(to right, #9a3197, #e084cd)" 
                  : "transparent",
                color: isExpanded ? "#fff" : "#9a3197",
                border: isExpanded ? "none" : "2px solid #9a3197",
              }}
              onMouseEnter={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.background = "linear-gradient(to right, #9a3197, #e084cd)";
                  e.currentTarget.style.color = "#fff";
                }
              }}
              onMouseLeave={(e) => {
                if (!isExpanded) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#9a3197";
                }
              }}
            >
              {isExpanded ? (
                <>
                  <span>Show Less</span>
                  <span>↑</span>
                </>
              ) : (
                <>
                  <span>Read More</span>
                  <span>↓</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
