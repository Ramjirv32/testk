'use client';

import { useState, useEffect, useRef } from 'react';
import BannerSection from '@/components/home/BannerSection';
import SearchModal from '@/components/home/SearchModal';
import PieChartSection from '@/components/home/PieChartSection';
import FindYourFitSection from '@/components/home/FindYourFitSection';
import BlogsSection from '@/components/home/BlogsSection';
import DontSettleSection from '@/components/home/DontSettleSection';
import RankingSection from '@/components/home/RankingSection';
import AboutSection from '@/components/home/AboutSection';
import SubjectsSection from '@/components/home/SubjectsSection';
import { API_URL, SCRAPER_API_URL, SERPER_API_URL } from '@/lib/config';

export default function Home() {
  const PIPELINE_SECTION_TOTAL = 13;
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [universitySearchQuery, setUniversitySearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [countries, setCountries] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const pieChartRef = useRef<any>(null);
  const esRef = useRef<EventSource | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [scrapingProgress, setScrapingProgress] = useState<{
    active: boolean;
    section: string;
    completed: number;
    total: number;
  }>({
    active: false,
    section: '',
    completed: 0,
    total: PIPELINE_SECTION_TOTAL,
  });

  const getBasicInfoFromFiles = (files: Record<string, any> = {}) => {
    const normalized = files['normalized.json'] || files['serper.json'] || {};
    const raw = files['raw.json'] || {};
    return normalized.basic_info || raw.basic_info || normalized || raw || {};
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(`${API_URL}/api/countries`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setCountries(data);
        } else {
          const resp2 = await fetch(`${SERPER_API_URL}/api/countries`);
          const data2 = await resp2.json();
          setCountries(data2);
        }
      } catch (error) {
        console.error('Error fetching countries in Home:', error);
        // Fallback
        setCountries([
          { id: 'united-states', name: 'United States' },
          { id: 'united-kingdom', name: 'United Kingdom' },
          { id: 'canada', name: 'Canada' },
          { id: 'australia', name: 'Australia' },
          { id: 'india', name: 'India' },
        ]);
      }
    };

    fetchCountries();

    setBlogs([
      {
        id: 1,
        slug: 'university-rankings-influence-study-abroad',
        title: 'Top Universities in the World 2025 | Study Abroad Guide',
        description: 'Discover the best universities around the world',
        image: '/images/blog-1.jpg',
      },
      {
        id: 2,
        slug: 'ai-machine-learning-transforming-education',
        title: 'Popular Universities in the World 2025 | Study Abroad Tips',
        description: 'Everything you need to know about studying abroad',
        image: '/images/blog-2.jpg',
      },
      {
        id: 3,
        slug: 'best-medical-colleges-world-admission',
        title: 'Best Medical Colleges in the World | Admission Info',
        description: 'Plan your career with expert guidance',
        image: '/images/blog-3.jpg',
      },
      {
        id: 4,
        slug: 'top-engineering-universities-worldwide',
        title: 'Engineering Universities for International Students 2025',
        description: 'Explore top engineering programs globally',
        image: '/images/blog-1.jpg',
      },
      {
        id: 5,
        slug: 'business-schools-global-mba-rankings',
        title: 'Business School Rankings & MBA Programs Worldwide',
        description: 'Find the perfect MBA program for your career',
        image: '/images/blog-2.jpg',
      },
      {
        id: 6,
        slug: 'computer-science-best-universities',
        title: 'Study Abroad Scholarships & Financial Aid Guide',
        description: 'Complete guide to funding your international education',
        image: '/images/blog-3.jpg',
      },
      {
        id: 7,
        slug: 'law-schools-excellence-international',
        title: 'IELTS & TOEFL Preparation Tips for University Admission',
        description: 'Master English language exams for university entry',
        image: '/images/blog-1.jpg',
      },
      {
        id: 8,
        slug: 'psychology-social-sciences-programs',
        title: 'Student Visa Requirements for Popular Destinations',
        description: 'Complete visa documentation guide by country',
        image: '/images/blog-2.jpg',
      },
      {
        id: 9,
        slug: 'global-education-trends-2025',
        title: 'Campus Life & Student Experience at World Universities',
        description: 'What to expect as an international student',
        image: '/images/blog-3.jpg',
      },
    ]);
  }, []);

  const handleSearchModal = () => {
    setShowSearchModal(true);
  };

  const closeSearchModal = () => {
    setShowSearchModal(false);
    setUniversitySearchQuery('');
    setSearchResults([]);
  };

  const handleCollegeSearch = (collegeData: any) => {
    console.log('College searched:', collegeData);
  };

  const handleCountrySelected = (countryName: string) => {
    if (!countryName) return;
    let country = countries.find(c => c.name.toLowerCase() === countryName.toLowerCase());
    if (!country) {
      const tempId = countryName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      country = { id: tempId, name: countryName };
      setCountries(prev => [...prev, country]);
    }
    setSelectedCountry(country.id.toString());
  };

  // Poll /api/find-college every 4 s to load serp data reliably,
  // even if the SSE serp_ready event is delayed or missed.
  const startSerpPoll = (collegeName: string, countryName: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let attempts = 0;
    const maxAttempts = 75; // up to 5 minutes
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > maxAttempts) {
        clearInterval(pollRef.current!);
        pollRef.current = null;
        return;
      }
      try {
        const slug = collegeName.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
        const res = await fetch(`${SCRAPER_API_URL}/api/find-college?name=${encodeURIComponent(slug)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.found && data.files) {
          const basicInfo = getBasicInfoFromFiles(data.files);
          if (basicInfo.college_name || basicInfo.about || basicInfo.established) {
            // Real data found — update the chart and stop polling (don't pass _streaming: true)
            if (pieChartRef.current) {
              pieChartRef.current.autoSelectCollege(collegeName, countryName, {
                ...basicInfo,
                files: data.files,
                country: countryName,
              });
            }
            clearInterval(pollRef.current!);
            pollRef.current = null;

            // Close the modal and scroll to the pie chart now that we have initial data
            setShowSearchModal(false);
            setTimeout(() => {
              document.getElementById('pieChartSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
          }
        }
      } catch { /* ignore network errors in poll */ }
    }, 4000);
  };

  const wsRef = useRef<WebSocket | null>(null);

  const handlePipelineStarted = (streamUrl: string, collegeName: string, countryName: string) => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setScrapingProgress({
      active: true,
      section: 'Initializing...',
      completed: 0,
      total: PIPELINE_SECTION_TOTAL,
    });
    startSerpPoll(collegeName, countryName);

    const ws = new WebSocket(streamUrl);
    wsRef.current = ws;
    const expectedPipelineId = sessionStorage.getItem('_streaming_pipeline_id') || '';

    let doneCount = 0;
    let completeCalled = false;
    const completedFiles = new Set<string>();

    if (pieChartRef.current) {
      pieChartRef.current.updateStreamingStatus('Connecting...', 0, 0, false);
    }

    const handleComplete = async () => {
      if (completeCalled) return;
      completeCalled = true;
      console.log(" Frontend Ingestion Complete for:", collegeName);
      
      try {
        const goRes = await fetch(`${API_URL}/api/college-statistics?college_name=${encodeURIComponent(collegeName)}`);
        if (goRes.ok) {
          const freshData = await goRes.json();
          handleCollegeSelected(collegeName, countryName, freshData);
        }
      } catch (err) {
        console.error("Error fetching final details:", err);
      }

      if (pieChartRef.current) {
        pieChartRef.current.setStreamingDone();
      }

      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }

      ws.close();
      sessionStorage.removeItem('_streaming_pipeline_id');
      setScrapingProgress({ active: false, section: '', completed: 0, total: PIPELINE_SECTION_TOTAL });
      setShowSearchModal(false);
      setTimeout(() => {
        document.getElementById('pieChartSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 500);
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(" Live WebSocket Data:", data);

        const eventPipelineId = data.pipeline_id || data.data?.pipeline_id || '';
        if (expectedPipelineId && eventPipelineId && eventPipelineId !== expectedPipelineId) return;

        if (data.type === "initial_data") {
          console.log(" Initial Data loaded from WebSocket for:", collegeName);
          setShowSearchModal(false);
          setScrapingProgress(prev => ({ ...prev, active: true, section: 'Detailed sections running...' }));
          
          if (data.data) {
            handleCollegeSelected(collegeName, countryName, data.data);
          }
          
          setTimeout(() => {
            document.getElementById('pieChartSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 300);
        } else if (data.type === "scraping_update") {
          if (data.update_type === "section_complete") {
            const sectionName = data.data?.section || "Update";
            const updateKey = data.data?.filename || sectionName;
            completedFiles.add(updateKey);
            doneCount = Math.min(completedFiles.size, PIPELINE_SECTION_TOTAL);
            setScrapingProgress(prev => ({
              ...prev,
              section: sectionName,
              completed: doneCount,
            }));

            if (pieChartRef.current) {
              pieChartRef.current.updateStreamingStatus(sectionName, 1, doneCount, false);
            }

          } else if (data.update_type === "phase1_complete") {
            console.log(" Phase 1 Ingestion Complete (Serper data ready) for:", collegeName);
            
            // Hide the search modal immediately
            setShowSearchModal(false);
            setScrapingProgress(prev => ({ ...prev, active: true, section: 'Detailed sections running...' }));
            
            // Render the pie chart with the initial statistics
            if (data.data) {
              handleCollegeSelected(collegeName, countryName, data.data);
            }

            // Show streaming status on the pie chart ref for background verification updates
            if (pieChartRef.current) {
              pieChartRef.current.updateStreamingStatus("Phase 1 Complete", 1, 0, false);
            }
            
            // Scroll to pie chart
            setTimeout(() => {
              document.getElementById('pieChartSection')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 300);
          } else if (data.update_type === "pipeline_complete") {
            await handleComplete();
          } else if (data.update_type === "pipeline_error") {
            const message = data.data?.error || "Detailed scraping stopped";
            setScrapingProgress(prev => ({ ...prev, active: false, section: message }));
            if (pieChartRef.current) pieChartRef.current.setStreamingDone();
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      if (pieChartRef.current) {
        pieChartRef.current.setStreamingDone();
      }
      // Clean up progress on close if it wasn't completed
      setTimeout(() => {
        setScrapingProgress(prev => {
          if (prev.active) {
            return { active: false, section: '', completed: 0, total: PIPELINE_SECTION_TOTAL };
          }
          return prev;
        });
      }, 2000);
    };

    ws.onerror = () => {
      if (pieChartRef.current) {
        pieChartRef.current.setStreamingDone();
      }
    };
  };

  const handleCollegeSelected = (collegeName: string, country?: string, collegeData?: any) => {
    setSelectedUniversity(collegeName);
    if (country) {
      handleCountrySelected(country);
    }
    if (pieChartRef.current) {
      // If this is a streaming placeholder, show loading immediately
      if (collegeData?._streaming && !collegeData?.college_name && !collegeData?.about) {
        pieChartRef.current.updateStreamingStatus('Fetching...', 0, 0, false);
      }
      pieChartRef.current.autoSelectCollege(collegeName, country, collegeData);
    }
  };

  return (
    <>
      <BannerSection onSearchClick={handleSearchModal} />

      <SearchModal
        showModal={showSearchModal}
        onClose={closeSearchModal}
        onCountrySelected={handleCountrySelected}
        onCollegeSelected={handleCollegeSelected}
        onPipelineStarted={handlePipelineStarted}
        scrapingProgress={scrapingProgress}
      />

      <PieChartSection
        ref={pieChartRef}
        countries={countries}
        selectedCountry={selectedCountry}
        selectedUniversity={selectedUniversity}
        onCountryChange={setSelectedCountry}
        onUniversityChange={setSelectedUniversity}
      />

      <FindYourFitSection />

      <BlogsSection blogs={blogs} />

      <DontSettleSection />

      <RankingSection />

      <AboutSection />

      <SubjectsSection />
    </>
  );
}
