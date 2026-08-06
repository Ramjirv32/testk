'use client';

import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  ChartConfiguration,
  PieController,
  CategoryScale,
  LinearScale
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { API_URL, SERPER_API_URL, SCRAPER_API_URL, SERPER_WS_URL } from '@/lib/config';

Chart.register(
  PieController,
  ArcElement,
  Tooltip,
  Legend,
  ChartDataLabels,
  CategoryScale,
  LinearScale
);

interface PieChartSectionProps {
  countries?: any[];
  selectedCountry?: string;
  selectedUniversity?: string;
  onCountryChange?: (countryId: string) => void;
  onUniversityChange?: (universityId: string) => void;
  onCollegeSearch?: (collegeData: any) => void;
  // Live streaming props
  streamingModule?: string;   // e.g. "UG"
  streamingCount?: number;    // e.g. 12
  completedModules?: number;  // 0..13
}

export default forwardRef(function PieChartSection({
  countries: initialCountries = [],
  selectedCountry: initialSelectedCountry = '',
  selectedUniversity: initialSelectedUniversity = '',
  onCountryChange,
  onUniversityChange,
  onCollegeSearch,
  streamingModule: initStreamMod = '',
  streamingCount: initStreamCnt = 0,
  completedModules: initCompleted = 0,
}: PieChartSectionProps, ref) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [countries, setCountries] = useState<any[]>(initialCountries);
  const [universities, setUniversities] = useState<any[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(initialSelectedCountry);
  const [selectedUniversity, setSelectedUniversity] = useState(initialSelectedUniversity);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchedCollege, setSearchedCollege] = useState<any>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);

  // Refs to prevent stale closures in asynchronous callbacks
  const searchModeRef = useRef(isSearchMode);
  const selectedUnivRef = useRef(selectedUniversity);
  const searchedCollegeRef = useRef(searchedCollege);

  useEffect(() => {
    searchModeRef.current = isSearchMode;
  }, [isSearchMode]);

  useEffect(() => {
    selectedUnivRef.current = selectedUniversity;
  }, [selectedUniversity]);

  useEffect(() => {
    searchedCollegeRef.current = searchedCollege;
  }, [searchedCollege]);

  // Live streaming state
  const [liveModule, setLiveModule] = useState('');
  const [liveCount, setLiveCount] = useState(0);
  const [liveCompleted, setLiveCompleted] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);

  const [tooltipData, setTooltipData] = useState<{
    visible: boolean;
    label: string;
    value: number;
    color: string;
    x: number;
    y: number;
    centerX: number;
    centerY: number;
    sliceEdgeX: number;
    sliceEdgeY: number;
  } | null>(null);

  useImperativeHandle(ref, () => ({
    autoSelectCollege: (collegeName: string, country?: string, collegeData?: any) => {
      handleCollegeFromSearch(collegeName, country, collegeData);
    },
    updateStreamingStatus: (module: string, count: number, completed: number, done: boolean) => {
      setLiveModule(module);
      setLiveCount(count);
      setLiveCompleted(completed);
      setIsStreaming(!done);
    },
    setStreamingDone: () => {
      setIsStreaming(false);
      setLiveModule('');
    }
  }));

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch(`${API_URL}/api/countries`);
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          setCountries(data);
        } else {
          // Fallback to SERPER_API_URL
          const resp2 = await fetch(`${SERPER_API_URL}/api/countries`);
          setCountries(await resp2.json());
        }
      } catch (error) {
        console.error('Error fetching countries:', error);
      }
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    if (initialSelectedCountry !== undefined) {
      const matched = countries.find(c =>
        String(c.id).toLowerCase() === String(initialSelectedCountry).toLowerCase() ||
        String(c.name).toLowerCase() === String(initialSelectedCountry).toLowerCase()
      );
      if (matched) {
        setSelectedCountry(String(matched.id));
      } else {
        setSelectedCountry(initialSelectedCountry);
      }
    }
  }, [initialSelectedCountry, countries]);

  useEffect(() => {
    if (initialSelectedUniversity !== undefined) {
      setSelectedUniversity(initialSelectedUniversity);
    }
  }, [initialSelectedUniversity]);

  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const rotationAnimationPlugin = {
      id: 'rotationAnimation',
      afterDatasetsDraw(chart: any) {
        const ctx = chart.ctx;
        const chartArea = chart.chartArea;
        const centerX = (chartArea.left + chartArea.right) / 2;
        const centerY = (chartArea.top + chartArea.bottom) / 2;

        const meta = chart.getDatasetMeta(0);
        if (meta && meta.controller) {
          const animationProgress = chart.animationStatus?.progress || 1;

          if (animationProgress < 1) {
            ctx.save();
            ctx.globalAlpha = animationProgress;

            ctx.shadowColor = 'rgba(154, 49, 151, 0.5)';
            ctx.shadowBlur = 15 * animationProgress;

            ctx.restore();
          }
        }
      }
    };

    const config: ChartConfiguration = {
      type: 'pie',
      data: {
        labels: [
          'Total Students',
          'Staff',
          'Scholarships',
          'Masters Degree',
          'International Students',
          'Female Students'
        ],
        datasets: [{
          label: 'College Statistics',
          data: [100, 50, 30, 25, 40, 45],
          backgroundColor: [
            'rgba(94, 234, 212, 0.8)',
            'rgba(253, 224, 71, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(244, 114, 182, 0.8)',
            'rgba(196, 181, 253, 0.8)',
            'rgba(147, 197, 253, 0.8)'
          ],
          borderColor: [
            'rgba(94, 234, 212, 1)',
            'rgba(253, 224, 71, 1)',
            'rgba(251, 146, 60, 1)',
            'rgba(244, 114, 182, 1)',
            'rgba(196, 181, 253, 1)',
            'rgba(147, 197, 253, 1)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            bottom: 60
          }
        },
        animation: {
          duration: 3000,
          easing: 'easeInOutCubic',
          animateRotate: true,
          animateScale: true,
          delay: (context: any) => {

            return context.dataIndex * 150;
          },
          onComplete: function () {
            console.log(' Pie chart animation completed');
          }
        } as any,
        plugins: {
          legend: {
            display: true,
            position: 'bottom',
            labels: {
              boxWidth: 20,
              padding: 20,
              font: {
                size: 12
              },
              generateLabels: function (chart: any) {
                const data = chart.data;
                if (data.labels && data.labels.length && data.datasets.length) {
                  return data.labels.map((label: string, i: number) => {
                    const value = data.datasets[0].data[i];
                    const bgColor = Array.isArray(data.datasets[0].backgroundColor)
                      ? data.datasets[0].backgroundColor[i]
                      : data.datasets[0].backgroundColor;
                    const bColor = Array.isArray(data.datasets[0].borderColor)
                      ? data.datasets[0].borderColor[i]
                      : data.datasets[0].borderColor;
                    return {
                      text: `${label}: ${value.toLocaleString()}`,
                      fillStyle: bgColor as string,
                      strokeStyle: bColor as string,
                      lineWidth: 2,
                      index: i
                    };
                  });
                }
                return [];
              }
            }
          },
          tooltip: {
            enabled: false,
            external: function (context: any) {
              const { chart, tooltip } = context;

              if (!tooltip || tooltip.opacity === 0) {
                setTooltipData(null);
                return;
              }

              const dataIndex = tooltip.dataPoints[0].dataIndex;
              const dataset = tooltip.dataPoints[0].dataset;
              const label = chart.data.labels[dataIndex];
              const value = dataset.data[dataIndex];
              const color = Array.isArray(dataset.backgroundColor)
                ? dataset.backgroundColor[dataIndex]
                : dataset.backgroundColor;

              const canvas = chart.canvas;
              const rect = canvas.getBoundingClientRect();
              const container = canvas.parentElement;
              const containerRect = container?.getBoundingClientRect();

              if (!containerRect) return;

              const chartArea = chart.chartArea;
              const centerX = (chartArea.left + chartArea.right) / 2;
              const centerY = (chartArea.top + chartArea.bottom) / 2;

              const meta = chart.getDatasetMeta(0);
              const arc = meta.data[dataIndex];

              if (!arc) return;

              const startAngle = arc.startAngle;
              const endAngle = arc.endAngle;
              const midAngle = (startAngle + endAngle) / 2;

              const sliceEdgeRadius = arc.outerRadius;
              const sliceEdgeXCanvas = centerX + Math.cos(midAngle) * sliceEdgeRadius;
              const sliceEdgeYCanvas = centerY + Math.sin(midAngle) * sliceEdgeRadius;

              const tooltipRadius = arc.outerRadius + 120;
              const tooltipXCanvas = centerX + Math.cos(midAngle) * tooltipRadius;
              const tooltipYCanvas = centerY + Math.sin(midAngle) * tooltipRadius;

              const canvasOffsetX = rect.left - containerRect.left;
              const canvasOffsetY = rect.top - containerRect.top;

              setTooltipData({
                visible: true,
                label,
                value,
                color,
                x: tooltipXCanvas + canvasOffsetX,
                y: tooltipYCanvas + canvasOffsetY,
                centerX: centerX + canvasOffsetX,
                centerY: centerY + canvasOffsetY,
                sliceEdgeX: sliceEdgeXCanvas + canvasOffsetX,
                sliceEdgeY: sliceEdgeYCanvas + canvasOffsetY
              });
            }
          },
          datalabels: {
            display: false
          }
        }
      },
      plugins: [ChartDataLabels]
    };

    chartInstanceRef.current = new Chart(ctx, config);

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      const country = countries.find(c => c.id === selectedCountry);
      if (!country) return;

      const fetchUniversities = async () => {
        try {
          setLoading(true);
          let data: any[] = [];
          try {
            const r1 = await fetch(`${API_URL}/api/colleges-by-country?country=${encodeURIComponent(country.name || country.id)}`);
            const d1 = await r1.json();
            if (Array.isArray(d1) && d1.length > 0) data = d1;
          } catch { }
          if (data.length === 0) {
            try {
              const r2 = await fetch(`${SERPER_API_URL}/api/colleges-by-country?country=${encodeURIComponent(country.name)}`);
              data = await r2.json();
            } catch { }
          }

          // If in search mode, make sure the searched college is appended or updated in the list
          const currentUniv = selectedUnivRef.current;
          const currentSearchMode = searchModeRef.current;
          const currentSearchedData = searchedCollegeRef.current;

          if (currentUniv && currentSearchMode) {
            const exists = data.some(u => (u.id || u.name) === currentUniv);
            if (!exists) {
              data.push({
                id: currentUniv,
                name: currentUniv,
                country: country.name || country.id,
                data: currentSearchedData || { _streaming: true }
              });
            } else {
              // If it exists, merge the latest search data so it's not lost
              data = data.map(u => {
                if ((u.id || u.name) === currentUniv) {
                  return { ...u, data: currentSearchedData || u.data };
                }
                return u;
              });
            }
          }

          setUniversities(data);
          setLoading(false);
        } catch (error) {
          console.error('Error fetching universities:', error);
          setLoading(false);
        }
      };

      fetchUniversities();
    } else {
      setUniversities([]);
    }
  }, [selectedCountry, countries]);

  const generateColors = (count: number) => {
    const colorPalette = [
      { bg: 'rgba(94, 234, 212, 0.8)', border: 'rgba(94, 234, 212, 1)' },
      { bg: 'rgba(253, 224, 71, 0.8)', border: 'rgba(253, 224, 71, 1)' },
      { bg: 'rgba(251, 146, 60, 0.8)', border: 'rgba(251, 146, 60, 1)' },
      { bg: 'rgba(244, 114, 182, 0.8)', border: 'rgba(244, 114, 182, 1)' },
      { bg: 'rgba(196, 181, 253, 0.8)', border: 'rgba(196, 181, 253, 1)' },
      { bg: 'rgba(147, 197, 253, 0.8)', border: 'rgba(147, 197, 253, 1)' },
      { bg: 'rgba(134, 239, 172, 0.8)', border: 'rgba(134, 239, 172, 1)' },
      { bg: 'rgba(252, 165, 165, 0.8)', border: 'rgba(252, 165, 165, 1)' }
    ];

    return {
      backgrounds: colorPalette.slice(0, count).map(c => c.bg),
      borders: colorPalette.slice(0, count).map(c => c.border)
    };
  };

  const extractTopStatistics = (data: any) => {
    console.log(' extractTopStatistics called with:', { 
      hasData: !!data, 
      dataType: typeof data, 
      isArray: Array.isArray(data),
      hasFiles: !!data?.files,
      filesKeys: Object.keys(data?.files || {}),
      hasBasicInfo: !!data?.basic_info,
      basicInfoKeys: Object.keys(data?.basic_info || {}),
      dataKeys: Object.keys(data || {})
    });
    
    // Check if data is an object (new structured format) or an array (legacy format)
    if (data && !Array.isArray(data)) {
      // If we received the whole college data object instead of just student_statistics
      // Handle Go backend's nested serper_sections for pending colleges
      const source = data.serper_sections || data;
      const basicInfo = source.basic_info || {};
      const files = data.files || {};
      
      const statsFile = files['student_statistics.json'] || {};
      const scholarshipFile = files['scholarships.json'] || {};

      //  1. Total Students 
      const latestDemo = statsFile.student_demographics_last_3_years?.[0];
      const ugCountFromStats = latestDemo?.undergraduate_students?.total || 0;
      const pgCountFromStats = latestDemo?.postgraduate_students?.total || 0;
      const phdCountFromStats = latestDemo?.phd_students?.total || 0;

      // Go engine flat shape: data.student_statistics_detail
      const goStats = data.student_statistics_detail || source.student_statistics_detail || {};
      // nested basic_info shape (from scraper normalized.json)
      const biStats = basicInfo.student_statistics || {};
      // legacy student_statistics array (picks up total_enrollment from any path)
      const legacyStats = (Array.isArray(source.student_statistics) ? {} : source.student_statistics) || {};

      let total =
        statsFile.total_students ||
        latestDemo?.total_students ||
        (ugCountFromStats + pgCountFromStats + phdCountFromStats) ||
        goStats.total_enrollment ||
        biStats.total_enrollment ||
        legacyStats.total_enrollment ||
        data.total_enrollment ||
        basicInfo.total_students ||
        basicInfo.total_enrollment ||
        0;

      //  2. UG / PG / PhD 
      // Try multiple sources: stats file → go backend → basic_info fields → fallback
      const ug = ugCountFromStats || goStats.ug_students || biStats.ug_students || basicInfo.ug_programs || basicInfo.total_ug || data.ug_programs || 0;
      const pg = pgCountFromStats || goStats.pg_students || biStats.pg_students || basicInfo.pg_programs || basicInfo.total_pg || data.pg_programs || 0;
      const phd = phdCountFromStats || goStats.phd_students || biStats.phd_students || basicInfo.phd_programs || basicInfo.total_phd || data.phd_programs || 0;

      //  3. Staff/Faculty 
      // Go flat: data.faculty_staff_detail.total_faculty
      const goFaculty = data.faculty_staff_detail || source.faculty_staff_detail || {};
      const biFaculty = basicInfo.faculty_staff || {};
      const staff = goFaculty.total_faculty || biFaculty.total_faculty || basicInfo.total_faculty || data.legacy_faculty_count || 0;

      //  4. Scholarships 
      const scholarshipCount =
        scholarshipFile.total_count ||
        scholarshipFile.scholarships?.length ||
        scholarshipFile.data?.length ||
        (Array.isArray(data.scholarships_detail) ? data.scholarships_detail.length : 0) ||
        0;

      //  5. International Students 
      const history = data.student_history || source.student_history || basicInfo.student_history || {};
      const intlObj = history.international_students;
      const international =
        (typeof intlObj === 'object' ? intlObj?.total_count : intlObj) ||
        data.legacy_international_count ||
        goStats.international_students ||
        0;

      //  6. Female Students 
      const genderRatio = history.student_gender_ratio || data.student_gender_ratio || {};
      let femalePercent =
        statsFile.overall_gender_ratio_3_year_average?.female_percentage ||
        goStats.female_percent ||
        genderRatio.female_percent ||
        genderRatio.female_percentage ||
        0;
      let female = genderRatio.total_female || 0;
      if (female === 0 && femalePercent > 0 && total > 0) {
        female = Math.round((femalePercent / 100) * total);
      }

      console.log(' Extracted sources:', { total, staff, scholarshipCount, ug, pg, phd, international, female });

      const labels: string[] = [];
      const values: number[] = [];

      if (total > 0) { labels.push('Total Students'); values.push(total); }
      if (staff > 0) { labels.push('Staff'); values.push(staff); }
      if (scholarshipCount > 0) { labels.push('Scholarships'); values.push(scholarshipCount); }
      if (ug > 0) { labels.push('UG Students'); values.push(ug); }
      if (pg > 0) { labels.push('Masters Degree'); values.push(pg); }
      if (phd > 0) { labels.push('PhD Students'); values.push(phd); }
      if (international > 0) { labels.push('International Students'); values.push(international); }
      if (female > 0) { labels.push('Female Students'); values.push(female); }

      if (labels.length > 0) {
        console.log(' Extracted statistics:', { labels, values });
        return { labels: labels.slice(0, 6), values: values.slice(0, 6) };
      }

      console.warn(' No statistics found in structured format. Trying basic_info fallback...');
      // Fallback: direct top-level fields
      {
        const fallbackLabels: string[] = [];
        const fallbackValues: number[] = [];

        const fbTotal = data.total_students || data.total_enrollment || basicInfo.total_students || basicInfo.total_enrollment || 0;
        const fbFaculty = data.faculty || data.total_faculty || basicInfo.faculty || basicInfo.total_faculty || 0;
        const fbUG = data.ug_students || basicInfo.ug_students || basicInfo.ug_programs || 0;
        const fbPG = data.pg_students || basicInfo.pg_students || basicInfo.pg_programs || 0;

        if (fbTotal > 0) { fallbackLabels.push('Total Students'); fallbackValues.push(fbTotal); }
        if (fbFaculty > 0) { fallbackLabels.push('Staff'); fallbackValues.push(fbFaculty); }
        if (fbUG > 0) { fallbackLabels.push('UG Students'); fallbackValues.push(fbUG); }
        if (fbPG > 0) { fallbackLabels.push('Masters Degree'); fallbackValues.push(fbPG); }

        if (fallbackLabels.length > 0) {
          console.log(' Using direct field fallback:', { fallbackLabels, fallbackValues });
          return { labels: fallbackLabels, values: fallbackValues };
        }
      }

      console.warn(' No statistics found at all for college data');
    }

    // Legacy format (array of {category, value})
    const dataArray = Array.isArray(data) ? data : [];
    
    const preferredFields = [
      { label: 'Total Students', matcher: (cat: string) => cat.toLowerCase().includes('total students') && !cat.toLowerCase().includes('placed') },
      { label: 'Staff', matcher: (cat: string) => cat.toLowerCase().includes('faculty') || cat.toLowerCase().includes('staff') },
      { label: 'Scholarships', matcher: (cat: string) => cat.toLowerCase().includes('scholarship') },
      { label: 'Masters Degree', matcher: (cat: string) => cat.toLowerCase().includes('postgraduate') || cat.toLowerCase().includes('pg students') || cat.toLowerCase().includes('masters') },
      { label: 'International Students', matcher: (cat: string) => cat.toLowerCase().includes('international students') && !cat.toLowerCase().includes('percentage') },
      { label: 'Female Students', matcher: (cat: string) => cat.toLowerCase().includes('female students') },
      { label: 'Students Placed', matcher: (cat: string) => cat.toLowerCase().includes('total students placed') },
      { label: 'Placement Rate %', matcher: (cat: string) => cat.toLowerCase().includes('placement rate') }
    ];

    const result: { labels: string[], values: number[] } = { labels: [], values: [] };

    preferredFields.forEach(field => {
      const item = dataArray.find((d: any) => field.matcher(d.category));
      if (item && item.value && item.value > 0) {
        result.labels.push(field.label);
        result.values.push(typeof item.value === 'string' ? parseInt(item.value) : item.value);
      }
    });

    return {
      labels: result.labels.slice(0, 6),
      values: result.values.slice(0, 6)
    };
  };

  useEffect(() => {
    if (chartInstanceRef.current) {
      let collegeDataToUse = null;
      if (isSearchMode && searchedCollege) {
        collegeDataToUse = searchedCollege;
      } else if (selectedUniversity) {
        const u = universities.find(univ => (univ.id || univ.name) === selectedUniversity);
        if (u) collegeDataToUse = u.data;
      }

      if (collegeDataToUse) {
        const { labels, values } = extractTopStatistics(collegeDataToUse);
        // Skip update when no real stats yet — keeps placeholder visible
        if (labels.length === 0) return;
        const colors = generateColors(labels.length);

        chartInstanceRef.current.data.labels = labels;
        chartInstanceRef.current.data.datasets[0].data = values;
        chartInstanceRef.current.data.datasets[0].backgroundColor = colors.backgrounds;
        chartInstanceRef.current.data.datasets[0].borderColor = colors.borders;
        chartInstanceRef.current.update('active');
      }
    }
  }, [selectedUniversity, universities, isSearchMode, searchedCollege]);

  const handleCollegeSearchData = (collegeData: any) => {
    setSearchedCollege(collegeData);
    setIsSearchMode(true);
    setError('');
    setSelectedCountry('');
    setSelectedUniversity('');

    if (chartInstanceRef.current && collegeData) {
      const { labels, values } = extractTopStatistics(collegeData);
      const colors = generateColors(labels.length);

      chartInstanceRef.current.data.labels = labels;
      chartInstanceRef.current.data.datasets[0].data = values;
      chartInstanceRef.current.data.datasets[0].backgroundColor = colors.backgrounds;
      chartInstanceRef.current.data.datasets[0].borderColor = colors.borders;
      chartInstanceRef.current.update('active');
    }

    if (onCollegeSearch) {
      onCollegeSearch(collegeData);
    }

    setTimeout(() => {
      if (sectionRef.current) {
        sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);

    setTimeout(() => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.update('default');
      }
    }, 1100);
  };

  const handleCountryChange = (countryId: string) => {
    setIsSearchMode(false);
    setSelectedCountry(countryId);
    setSelectedUniversity('');
    if (onCountryChange) onCountryChange(countryId);
  };

  const handleUniversityChange = (universityId: string) => {
    setIsSearchMode(false);
    setSelectedUniversity(universityId);
    if (onUniversityChange) onUniversityChange(universityId);

    if (sectionRef.current) {
      sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCountryFromSearch = (countryName: string) => {
    const country = countries.find(c => c.name === countryName);
    if (country) {
      handleCountryChange(country.id);
    }
  };

  const handleCollegeFromSearch = (collegeName: string, country?: string, collegeData?: any) => {
    console.log(' handleCollegeFromSearch called:', { collegeName, country, hasData: !!collegeData });

    // Check if this is placeholder streaming data
    const isStreamingData = collegeData?._streaming === true;
    setIsStreaming(isStreamingData);

    if (country) {
      let countryObj = countries.find(c =>
        c.name === country ||
        c.name.toLowerCase() === country.toLowerCase()
      );

      if (!countryObj) {
        console.log(' Country not in approved list, adding temporarily:', country);
        const tempCountryId = `temp_${country}`;
        const tempCountry = {
          id: tempCountryId,
          name: country
        };
        setCountries(prev => [...prev, tempCountry]);
        countryObj = tempCountry;
      }

      console.log(' Found/Created country:', countryObj);
      console.log(' Setting university:', { collegeName, country });

      setSelectedCountry(String(countryObj.id));
      if (onCountryChange) onCountryChange(String(countryObj.id));
      setIsSearchMode(true);
      setSearchedCollege(collegeData);

      const tempCollege = {
        id: collegeName,
        name: collegeName,
        country: country,
        data: collegeData // Pass the full college data object
      };
      setUniversities([tempCollege]);
      setSelectedUniversity(collegeName);
      if (onUniversityChange) onUniversityChange(collegeName);

      if (chartInstanceRef.current && collegeData && !isStreamingData) {
        console.log(' Attempting chart update with real data:', { hasChart: !!chartInstanceRef.current, hasData: !!collegeData, isStreaming: isStreamingData });
        const { labels, values } = extractTopStatistics(collegeData);
        console.log(' Chart extraction result:', { labels, values, labelsLen: labels.length });
        if (labels.length > 0) {
          const colors = generateColors(labels.length);
          chartInstanceRef.current.data.labels = labels;
          chartInstanceRef.current.data.datasets[0].data = values;
          chartInstanceRef.current.data.datasets[0].backgroundColor = colors.backgrounds;
          chartInstanceRef.current.data.datasets[0].borderColor = colors.borders;
          chartInstanceRef.current.update('active');
          console.log(' Chart updated successfully');
        } else {
          console.warn(' No labels extracted, chart not updated. College data:', collegeData);
        }
        // If no stats yet (mid-pipeline), keep placeholder — will update via pipeline_done
      }

      setTimeout(() => {
        if (sectionRef.current) {
          sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);

      setTimeout(() => {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.resize();
          chartInstanceRef.current.update('none');
        }
      }, 600);

      return;
    }

    // If the college already exists in universities list (from a prior placeholder call),
    // update its data AND refresh the chart directly instead of delegating to handleUniversityChange
    // (which would reset isSearchMode and use the stale placeholder data).
    const existingIdx = universities.findIndex(u => u.name === collegeName);
    if (existingIdx !== -1 && collegeData) {
      console.log(' Updating existing college in universities list:', { collegeName, isStreaming: isStreamingData });
      const updatedUniversities = [...universities];
      updatedUniversities[existingIdx] = { ...updatedUniversities[existingIdx], data: collegeData };
      setUniversities(updatedUniversities);
      setIsSearchMode(true);
      setSearchedCollege(collegeData);
      setIsStreaming(false); // Real data arrived, stop streaming

      if (chartInstanceRef.current) {
        const { labels, values } = extractTopStatistics(collegeData);
        console.log(' Extracted stats for existing college:', { labels, values, labelsLen: labels.length });
        if (labels.length > 0) {
          const colors = generateColors(labels.length);
          chartInstanceRef.current.data.labels = labels;
          chartInstanceRef.current.data.datasets[0].data = values;
          chartInstanceRef.current.data.datasets[0].backgroundColor = colors.backgrounds;
          chartInstanceRef.current.data.datasets[0].borderColor = colors.borders;
          chartInstanceRef.current.update('active');
          console.log(' Chart updated for existing college');
        } else {
          console.warn(' No labels for existing college, data:', collegeData);
        }
      }
      return;
    }

    const college = universities.find(u => u.name === collegeName);
    if (college) {
      handleUniversityChange(college.id);
    } else {
      console.log(' Creating new college in universities:', { collegeName, hasData: !!collegeData });
      setSelectedUniversity(collegeName);
      if (onUniversityChange) onUniversityChange(collegeName);
      setIsSearchMode(true);
      setSearchedCollege(collegeData);
      if (!isStreamingData) {
        setIsStreaming(false);
      }

      if (chartInstanceRef.current && collegeData && !isStreamingData) {
        const { labels, values } = extractTopStatistics(collegeData);
        console.log(' Extracted stats for new college:', { labels, values, labelsLen: labels.length });
        const colors = generateColors(labels.length);

        chartInstanceRef.current.data.labels = labels;
        chartInstanceRef.current.data.datasets[0].data = values;
        chartInstanceRef.current.data.datasets[0].backgroundColor = colors.backgrounds;
        chartInstanceRef.current.data.datasets[0].borderColor = colors.borders;
        chartInstanceRef.current.update('active');
        console.log(' Chart updated for new college');
      }

      setTimeout(() => {
        if (sectionRef.current) {
          sectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 300);

      setTimeout(() => {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.update('active');
        }
      }, 1100);
    }
  };

  // Determine if we have real stats to display
  const getHasStats = () => {
    let collegeDataToUse = null;
    if (isSearchMode && searchedCollege) {
      collegeDataToUse = searchedCollege;
    } else if (selectedUniversity) {
      const u = universities.find(univ => (univ.id || univ.name) === selectedUniversity);
      if (u) collegeDataToUse = u.data;
    }
    if (!collegeDataToUse) return false;
    const { labels } = extractTopStatistics(collegeDataToUse);
    return labels && labels.length > 0;
  };
  const hasStats = getHasStats();
  const searchError = searchedCollege?.error || searchedCollege?.basic_info?.error || error;
  const showChartLoader = false;

  return (
    <section className="section2" id="pieChartSection" ref={sectionRef}>
      <div className="container-fluid p-0">
        <div className="row p-0 align-items-center">
          <div
            className="col-lg-6 col-md-6 gallery_img_section gallery-1 px-5"
            data-aos="fade-up"
            data-aos-easing="ease"
            data-aos-delay="300"
          >
            <div className="section_2_content">
              <h3>One Click. One Pie. All Clarity.</h3>

              { }
              <div className="text-center py-3">
                <span className="text-muted">Select by Country or Search via Modal</span>
              </div>

              { }
              <div className="select_block">
                <div className="select_area" style={{ display: 'flex', gap: '20px', width: '100%' }}>
                  <select
                    id="countrySelect"
                    className="country-select form-control"
                    value={selectedCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    style={{ flex: 1 }}
                  >
                    <option value="">Select Country</option>
                    {countries.map((country) => (
                      <option key={country.id} value={country.id}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                  <select
                    id="universitySelect"
                    className="university-select form-control"
                    value={selectedUniversity}
                    onChange={(e) => handleUniversityChange(e.target.value)}
                    disabled={!selectedCountry || universities.length === 0 || loading}
                    style={{ flex: 1 }}
                  >
                    <option value="">
                      {loading ? 'Loading colleges...' : 'Select College'}
                    </option>
                    {universities.map((university, index) => (
                      <option key={index} value={university.id || university.name}>
                        {university.name}
                      </option>
                    ))}
                    {isSearchMode && selectedUniversity && !universities.find(u => (u.id || u.name) === selectedUniversity) && (
                      <option value={selectedUniversity}>
                        {selectedUniversity} (Searched)
                      </option>
                    )}
                  </select>
                </div>
              </div>

              {/* Live streaming badge */}
              {isStreaming && (
                <div style={{ marginTop: '16px', padding: '10px 14px', borderRadius: '10px', background: 'linear-gradient(135deg,rgba(72,52,212,0.06),rgba(154,49,151,0.06))', border: '1px solid rgba(72,52,212,0.2)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4834d4', animation: 'piePulse 1s infinite' }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#4834d4' }}>
                      Live Scraping{liveModule ? ` — ${liveModule}` : ''}
                      {liveCount > 0 && <span style={{ color: '#9a3197', marginLeft: '4px' }}>({liveCount} items so far)</span>}
                    </span>
                  </div>
                  <div style={{ background: 'rgba(72,52,212,0.1)', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: 'linear-gradient(90deg,#4834d4,#9a3197)', width: `${Math.round((liveCompleted / 13) * 100)}%`, transition: 'width 0.5s ease' }} />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>{liveCompleted}/13 modules</div>
                  <style>{`@keyframes piePulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
                </div>
              )}
            </div>
          </div>
          <div
            className="col-lg-6 col-md-6 col-sm-12"
            data-aos="fade-up"
            data-aos-easing="ease"
            data-aos-delay="300"
          >
            <div className="section_2_content">
              <div style={{
                height: '500px',
                position: 'relative',
                opacity: 1,
                animation: 'fadeInScale 0.8s ease-in-out forwards',
                animationDelay: '0.3s'
              }}>
                <style>{`
                  @keyframes fadeInScale {
                    from {
                      opacity: 0;
                      transform: scale(0.95);
                    }
                    to {
                      opacity: 1;
                      transform: scale(1);
                    }
                  }
                  
                  .custom-pie-tooltip {
                    position: absolute;
                    background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.98));
                    border: 2px solid;
                    border-radius: 12px;
                    padding: 12px 16px;
                    pointer-events: none;
                    z-index: 1000;
                    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18), 0 6px 12px rgba(0, 0, 0, 0.12);
                    min-width: 190px;
                    backdrop-filter: blur(12px);
                    transition: all 0.2s ease-in-out;
                    white-space: nowrap;
                  }
                  
                  .tooltip-label {
                    font-weight: 600;
                    font-size: 14px;
                    color: #1e293b;
                    margin-bottom: 4px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                  }
                  
                  .tooltip-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #0f172a;
                    letter-spacing: -0.5px;
                  }
                  
                  .color-indicator {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                    display: inline-block;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                  }
                `}</style>
                <canvas ref={chartRef} id="universityPieChart" style={{ display: showChartLoader ? 'none' : 'block' }}></canvas>

                 {showChartLoader && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    zIndex: 10
                  }}>
                    {searchError ? (
                      <>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}></div>
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#e11d48', marginBottom: '6px', textAlign: 'center', padding: '0 16px' }}>
                          Analysis Error
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', maxWidth: '300px', lineHeight: '1.4', marginBottom: '16px', padding: '0 16px' }}>
                          {searchError}
                        </div>
                        <button
                          onClick={() => {
                            setSearchedCollege(null);
                            setIsSearchMode(false);
                            setSelectedUniversity('');
                            setError('');
                          }}
                          style={{
                            padding: '8px 16px',
                            background: '#e11d48',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: 'pointer'
                          }}
                        >
                          Clear Search
                        </button>
                      </>
                    ) : (
                      <>
                        <span style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '50%',
                          border: '4px solid rgba(154, 49, 151, 0.1)',
                          borderTopColor: '#9a3197',
                          animation: 'modalSpin 1s linear infinite',
                          display: 'inline-block',
                          marginBottom: '16px'
                        }} />
                        <div style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a2e', marginBottom: '6px' }}>
                          Fetching College Details...
                        </div>
                        <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', maxWidth: '280px', lineHeight: '1.4' }}>
                          Gathering initial data from SerpApi. This will update the chart automatically.
                        </div>
                      </>
                    )}
                  </div>
                )}

                { }
                {tooltipData && tooltipData.visible && (
                  <>
                    <svg
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        pointerEvents: 'none',
                        zIndex: 999
                      }}
                    >
                      { }
                      <line
                        x1={tooltipData.sliceEdgeX}
                        y1={tooltipData.sliceEdgeY}
                        x2={tooltipData.x}
                        y2={tooltipData.y}
                        stroke="#000000"
                        strokeWidth="6"
                        opacity="0.1"
                        filter="blur(4px)"
                      />
                      { }
                      <line
                        x1={tooltipData.sliceEdgeX}
                        y1={tooltipData.sliceEdgeY}
                        x2={tooltipData.x}
                        y2={tooltipData.y}
                        stroke="#64748b"
                        strokeWidth="2"
                        opacity="0.7"
                        strokeDasharray="4,4"
                      />
                      { }
                      <circle
                        cx={tooltipData.sliceEdgeX}
                        cy={tooltipData.sliceEdgeY}
                        r="4"
                        fill={tooltipData.color}
                        opacity="0.9"
                      />
                      { }
                      <circle
                        cx={tooltipData.x}
                        cy={tooltipData.y}
                        r="5"
                        fill={tooltipData.color}
                        opacity="0.9"
                        stroke="white"
                        strokeWidth="2"
                      />
                    </svg>

                    { }
                    <div
                      className="custom-pie-tooltip"
                      style={{
                        left: `${tooltipData.x}px`,
                        top: `${tooltipData.y}px`,
                        borderColor: tooltipData.color,
                        opacity: 1,
                        animation: 'tooltipFadeIn 0.2s ease-in-out',
                        transform: 'translate(-50%, -50%)'
                      }}
                    >
                      <div className="tooltip-label">
                        <span className="color-indicator" style={{ backgroundColor: tooltipData.color }}></span>
                        {tooltipData.label}
                      </div>
                      <div className="tooltip-value">
                        {tooltipData.value.toLocaleString()}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {selectedUniversity && (
                <div style={{ textAlign: 'center', marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  {/* Streaming badge — shown when pipeline is running in background */}
                  {(isStreaming || searchedCollege?._streaming) && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: '6px',
                      padding: '6px 14px', borderRadius: '20px',
                      background: 'rgba(154,49,151,0.12)', border: '1px solid rgba(154,49,151,0.35)',
                      fontSize: '13px', color: '#c45dc0', fontWeight: 500,
                      animation: 'pulse 2s infinite',
                    }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c45dc0', display: 'inline-block', animation: 'pulse 1.2s infinite' }} />
                      Updating data in background…
                    </div>
                  )}
                  <button
                    id="view-details-btn"
                    disabled={showChartLoader}
                    onClick={() => {
                      const collegeName = isSearchMode && searchedCollege
                        ? (searchedCollege.college_name || searchedCollege.name || selectedUniversity)
                        : universities.find(u => (u.id || u.name) === selectedUniversity)?.name || selectedUniversity;
                      const slug = collegeName.toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');
                      router.push(`/college-details/${encodeURIComponent(slug)}`);
                    }}
                    style={{
                      background: showChartLoader 
                        ? '#cbd5e1' 
                        : 'linear-gradient(to right, #9a3197, #e084cd)',
                      color: showChartLoader ? '#64748b' : 'white',
                      border: 'none',
                      padding: '12px 30px',
                      borderRadius: '25px',
                      fontSize: '16px',
                      fontWeight: '500',
                      cursor: showChartLoader ? 'not-allowed' : 'pointer',
                      boxShadow: showChartLoader ? 'none' : '0 4px 15px rgba(154, 49, 151, 0.3)',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      if (showChartLoader) return;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(154, 49, 151, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      if (showChartLoader) return;
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(154, 49, 151, 0.3)';
                    }}
                  >
                     View Full College Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section >
  );
});
