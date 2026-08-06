/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Chart,
  ArcElement,
  DoughnutController,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import Link from "next/link";
import "./styles.css";
import { SCRAPER_API_URL, SERPER_API_URL, API_URL, WS_URL } from "@/lib/config";
import StudentStatistics from "./components/StudentStatistics";
import ProgramDistribution from "./components/ProgramDistribution";
import StatisticsOfCollege from "./components/StatisticsOfCollege";
import FeeStructure from "./components/FeeStructure";
import PlacementStatistics from "./components/PlacementStatistics";
import Scholarships from "./components/Scholarships";
import Departments from "./components/Departments";
import ProgramsTab from "./tabs/ProgramsTab";
import AdmissionsTab from "./tabs/AdmissionsTab";
import DepartmentsTab from "./tabs/DepartmentsTab";
import { getCurrencySymbol } from "./types";
import {
  Trophy,
  Award,
  TrendingUp,
  ShieldCheck,
  Flame,
  Medal,
  Star,
} from "lucide-react";

const RankingComparisonChart = dynamic(
  () => import("./charts/RankingComparisonChart"),
  { ssr: false },
);

Chart.register(
  ArcElement,
  DoughnutController,
  BarController,
  BarElement,
  LineController,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
);

// 
// Legacy CollegeData interfaces (kept for backward-compat with sub-components)
// 

interface FeeGroup {
  per_year: string;
  total_course: string;
  currency: string;
}

interface FeesInfo {
  UG: FeeGroup;
  PG: FeeGroup;
  PhD: FeeGroup;
  hostel_per_year: string;
  ug_yearly_min?: number;
  ug_yearly_max?: number;
  pg_yearly_min?: number;
  pg_yearly_max?: number;
  phd_yearly_min?: number;
  phd_yearly_max?: number;
}

interface FeesYearInfo {
  year: number;
  UG: FeeGroup;
  PG: FeeGroup;
  PhD: FeeGroup;
  hostel_per_year: number;
}

interface GenderRatio {
  male_percentage: number;
  female_percentage: number;
}

interface GenderRatioDetail {
  total_male: number;
  total_female: number;
  male_percent: number;
  female_percent: number;
}

interface StatisticItem {
  category: string;
  value: any;
}

interface CollegeRankings {
  nirf_2025?: any;
  nirf_2024?: any;
  nirf_rank?: any;
  qs_world?: any;
  qs_asia?: any;
  the_world?: any;
  national_rank?: any;
  state_rank?: any;
  nirf_latest?: any;
  nirf_previous?: any;
  [key: string]: any;
}

interface StudentStatsDetail {
  total_enrollment: number;
  ug_students: number;
  pg_students: number;
  phd_students: number;
  annual_intake?: number;
  male_percent?: number;
  female_percent?: number;
  total_ug_courses?: number;
  total_pg_courses?: number;
  total_phd_courses?: number;
  total_faculty_count?: number;
  total_departments_count?: number;
  male_students?: number;
  female_students?: number;
  [key: string]: any;
}

interface FacultyStaffDetail {
  total_faculty: number;
  student_faculty_ratio: number;
  phd_faculty_percent: number;
}

interface PlacementInfo {
  year: number;
  highest_package: number;
  average_package: number;
  median_package: number;
  package_currency: string;
  placement_rate_percent: number;
  total_students_placed: number;
  total_companies_visited: number;
  graduate_outcomes_note: string;
}

interface PlacementComp {
  year: number;
  average_package: number;
  employment_rate_percent: number;
  package_currency: string;
}

interface GenderPlacement {
  year: number;
  male_placed: any;
  female_placed: any;
  male_percent: any;
  female_percent: any;
}

interface SectorPlacement {
  year: number;
  sector: string;
  companies: string;
  percent: any;
}

interface ScholarshipItem {
  name: string;
  amount: number;
  currency_type: string;
  eligibility: string;
  provider: string;
  type?: string;
  application_deadline?: string;
}

interface InfraItem {
  facility: string;
  details: string;
}

interface HostelDetails {
  available: boolean;
  boys_capacity: any;
  girls_capacity: any;
  total_capacity: any;
  type: string;
}

interface LibraryDetails {
  total_books: string;
  journals: string;
  e_resources: string;
  area_sqft: string;
}

interface TransportDetails {
  buses: string;
  routes: string;
}

interface StudentCountEntry {
  year: number;
  total_enrolled: number;
  ug: number;
  pg: number;
  phd: number;
}

interface StudentHistory {
  student_count_comparison_last_3_years: StudentCountEntry[];
  student_gender_ratio: GenderRatioDetail;
  international_students: {
    total_count: number;
    countries_represented: string[];
    international_percent: number;
  };
  notable_faculty: {
    name: string;
    designation: string;
    specialization: string;
  }[];
  faculty_achievements: string;
}

interface Accreditation {
  body: string;
  grade: any;
  year: any;
}

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
}

interface CollegeData {
  college_name: string;
  short_name?: string;
  established?: number;
  institution_type?: string;
  country: string;
  about: string;
  location: string;
  website?: string;
  summary: string;
  ug_programs: string[];
  pg_programs: string[];
  phd_programs: string[];

  rankings?: CollegeRankings;
  student_statistics_detail?: StudentStatsDetail;
  faculty_staff_detail?: FacultyStaffDetail;
  placements?: PlacementInfo;
  placement_comparison_last_3_years?: PlacementComp[];
  gender_based_placement_last_3_years?: GenderPlacement[];
  sector_wise_placement_last_3_years?: SectorPlacement[];
  top_recruiters?: string[];
  placement_highlights?: string;

  fees: FeesInfo;
  fees_by_year?: FeesYearInfo[];
  fees_note?: string;
  scholarships_detail?: ScholarshipItem[];

  infrastructure?: InfraItem[];
  hostel_details?: HostelDetails;
  library_details?: LibraryDetails;
  transport_details?: TransportDetails;

  student_history?: StudentHistory;
  accreditations?: Accreditation[];
  affiliations?: string[];
  recognition?: string;
  campus_area?: string;
  contact_info?: ContactInfo;

  // Legacy/compat
  scholarships?: string[];
  student_gender_ratio: GenderRatio;
  faculty_staff: number;
  international_students: number;
  global_ranking:
    | string
    | {
        qs_world?: any;
        the_world?: any;
        us_news_global?: any;
        arwu?: any;
        webometrics?: any;
      };
  departments: string[];
  student_statistics: StatisticItem[];
  additional_details: StatisticItem[];
  sources: string[];
  approval_status: string;
}

// 
// New rich-data interfaces (from per-college JSON files)
// 

interface TuitionFee {
  amount: number;
  currency: string;
  fee_cycle: string;
}

interface Course {
  course_id: string;
  college_id: string;
  collection_name: string;
  level: string;
  level_keywords: string[];
  title: string;
  department: string;
  mode: string;
  duration_months: number;
  intake: string[];
  deadline: string;
  tuition_fee: TuitionFee;
  curriculum_link: string;
}

interface Admission {
  admission_id: string;
  college_id: string;
  collection_name: string;
  general_requirements: string;
  english_proficiency: {
    ielts_min: number;
    toefl_min: number;
    duolingo_min: number;
  };
  standardized_tests: {
    undergraduate: string[];
    postgraduate: string[];
  };
  application_fee_usd?: number;
  application_fee_gbp?: number;
  keywords: string[];
}

interface ScholarshipEntry {
  scholarship_id: string;
  college_id: string;
  collection_name: string;
  name: string;
  amount: number | null;
  currency: string;
  type: "merit" | "need" | "specific" | string;
  coverage: string;
  eligibility: string;
  keywords: string[];
}

interface CollegeEvent {
  event_id: string;
  college_id: string;
  collection_name: string;
  name: string;
  type: string;
  month_or_date: string;
  description: string;
  start_date?: string;
  title?: string;
  start_time?: string;
  registration_link?: string;
}

const filterRealEvents = (list: any[]): CollegeEvent[] => {
  if (!list || !Array.isArray(list)) return [];
  return list.filter((ev) => {
    if (!ev) return false;
    const title = (ev.title || ev.name || "").toLowerCase().trim();
    if (title === "" || title === "string" || title === "not_available" || title === "not available") {
      return false;
    }
    return true;
  });
};

interface RichDepartment {
  unit_id: string;
  institution_id: string;
  collection_name: string;
  name: string;
  slug: string;
  tier: "DEPARTMENT" | "FACULTY" | string;
  parent_id: string | null;
}

interface CurrentRanking {
  ranking_body: string;
  ranking_category: string;
  year: number;
  rank: number | null;
  score: number | null;
  rank_band: string | null;
  status: string;
}

interface HistoricalRanking {
  ranking_body: string;
  ranking_category: string;
  year: number;
  rank: number | null;
  score: number | null;
}

interface RankingMetadata {
  best_ever_rank: number | null;
  best_ever_year: number | null;
  average_rank_last_5_years: number | null;
  rank_trend: string | null;
  years_ranked: number;
}

interface YearlyDemographics {
  year: number;
  undergraduate_students: { total: number; male: number; female: number };
  postgraduate_students: { total: number; male: number; female: number };
  phd_students: { total: number; male: number; female: number };
  total_students: number;
}

interface PlacementYearStat {
  year: number;
  median_package?: number;
  median_package_inr?: number;
  average_package?: number;
  average_package_inr?: number;
  currency?: string;
  students_placed: number;
  total_graduating_students: number;
}

interface HostelEntry {
  name: string;
  type?: string;
  capacity?: number;
  fee?: { amount: number; currency: string; fee_cycle: string };
  room_types?: string[];
  facilities?: string[];
  fees_per_year_gbp?: number;
  amenities?: string[];
}

interface InfraFacility {
  facility_id: string;
  college_id: string;
  collection_name: string;
  libraries: string[];
  labs: string[];
  sports_facilities: string[];
  hostels: HostelEntry[];
  dining_options: string[];
  keywords: string[];
  campus_essential_services?: string[];
  student_visa_and_residency_requirements?: {
    mandatory_medical_insurance_annual_usd?: number;
    student_visa_processing_fee_usd?: number;
    refundable_housing_security_deposit_usd?: number;
    required_documentation?: string[];
  };
}

// 
// Component
// 

export default function CollegeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const collegeName = decodeURIComponent(params.name as string);

  // Legacy state
  const [collegeData, setCollegeData] = useState<CollegeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(
    null,
  );
  const [selectedStatCategory, setSelectedStatCategory] = useState<
    string | null
  >(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [scrapingStatus, setScrapingStatus] = useState<string | null>(null);
  const [lastUpdatedSection, setLastUpdatedSection] = useState<string | null>(
    null,
  );

  // New rich-data state
  const [ugCourses, setUgCourses] = useState<Course[]>([]);
  const [pgCourses, setPgCourses] = useState<Course[]>([]);
  const [phdCourses, setPhdCourses] = useState<Course[]>([]);
  const [onlineCourses, setOnlineCourses] = useState<Course[]>([]);
  const [additionalCourses, setAdditionalCourses] = useState<Course[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState<any>(null);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [scholarshipItems, setScholarshipItems] = useState<ScholarshipEntry[]>(
    [],
  );
  const [eventsList, setEventsList] = useState<CollegeEvent[]>([]);
  const [richDepartments, setRichDepartments] = useState<RichDepartment[]>([]);
  const [currentRankings, setCurrentRankings] = useState<CurrentRanking[]>([]);
  const [historicalRankings, setHistoricalRankings] = useState<
    HistoricalRanking[]
  >([]);
  const [rankingMetadata, setRankingMetadata] =
    useState<RankingMetadata | null>(null);
  const [rankingBodies, setRankingBodies] = useState<any[]>([]);
  const [rankingHistory5Year, setRankingHistory5Year] = useState<any[]>([]);
  const [rankingBreakdown, setRankingBreakdown] = useState<any>(null);
  const [departmentRankings, setDepartmentRankings] = useState<any[]>([]);
  const [researchContribution, setResearchContribution] = useState<any[]>([]);
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [studentDemographics, setStudentDemographics] = useState<
    YearlyDemographics[]
  >([]);
  const [genderRatio3Yr, setGenderRatio3Yr] = useState<{
    male_percentage: number;
    female_percentage: number;
  } | null>(null);
  const [newPlacementStats, setNewPlacementStats] = useState<
    PlacementYearStat[]
  >([]);
  const [infraFacility, setInfraFacility] = useState<InfraFacility | null>(
    null,
  );
  const [reviewsList, setReviewsList] = useState<any[]>([]);
  const [alumniList, setAlumniList] = useState<any[]>([]);
  const [faqList, setFaqList] = useState<any[]>([]);
  const [dataSource, setDataSource] = useState<"scraper" | "scraper-phase1" | "go-engine" | null>(
    null,
  );
  const [isUpdatingBackground, setIsUpdatingBackground] = useState(false);
  const [backgroundUpdateDone, setBackgroundUpdateDone] = useState(false);
  const [pipelineWatchVersion, setPipelineWatchVersion] = useState(0);

  // Find primary category dynamically (preferring Medical, then Engineering, then University/Overall)
  const primaryCategory = (() => {
    const categories = (currentRankings || []).map(
      (r: any) => r.ranking_category,
    );
    if (categories.includes("Medical")) return "Medical";
    if (categories.includes("Dental")) return "Dental";
    if (categories.includes("Pharmacy")) return "Pharmacy";
    if (categories.includes("Engineering")) return "Engineering";
    if (categories.includes("University")) return "University";
    return categories[0] || "Overall";
  })();

  const parseRankToNumber = (r: any): number => {
    if (typeof r.rank === "number") return r.rank;
    if (typeof r.rank === "string" && !isNaN(Number(r.rank)))
      return Number(r.rank);
    if (r.rank_band) {
      const parts = String(r.rank_band).split("-");
      if (parts.length === 2) {
        const start = parseInt(parts[0]);
        const end = parseInt(parts[1]);
        if (!isNaN(start) && !isNaN(end)) return Math.round((start + end) / 2);
      }
      const val = parseInt(r.rank_band);
      if (!isNaN(val)) return val;
    }
    return 0;
  };

  const nirfTrendCurrent = (currentRankings || [])
    .filter(
      (r: any) =>
        r.ranking_body === "NIRF" && r.ranking_category === primaryCategory,
    )
    .map((r: any) => ({ year: r.year, rank: parseRankToNumber(r) }))
    .filter((x) => x.rank > 0);
  const nirfTrendHistorical = (historicalRankings || [])
    .filter(
      (r: any) =>
        r.ranking_body === "NIRF" && r.ranking_category === primaryCategory,
    )
    .map((r: any) => ({ year: r.year, rank: parseRankToNumber(r) }))
    .filter((x) => x.rank > 0);
  const allNirfTrend = [...nirfTrendHistorical, ...nirfTrendCurrent]
    .reduce((acc: any[], cur) => {
      if (!acc.find((x) => x.year === cur.year)) acc.push(cur);
      return acc;
    }, [])
    .sort((a, b) => a.year - b.year);

  // Derived 5-Year Ranking History
  const derivedRankingHistory5Year = (() => {
    if (rankingHistory5Year && rankingHistory5Year.length > 0) {
      return rankingHistory5Year;
    }
    const all = [...(historicalRankings || []), ...(currentRankings || [])];
    return all.sort((a, b) => b.year - a.year);
  })();

  // Derived Ranking Breakdown (2025)
  const derivedRankingBreakdown = (() => {
    if (rankingBreakdown && Object.keys(rankingBreakdown).length > 0) {
      return rankingBreakdown;
    }
    if (!currentRankings || currentRankings.length === 0) {
      return null;
    }
    const nirf = currentRankings.find((r: any) => r.ranking_body === "NIRF");
    const iirf = currentRankings.find((r: any) => r.ranking_body === "IIRF");
    const qs = currentRankings.find(
      (r: any) => r.ranking_body === "QS" || r.ranking_body?.includes("QS"),
    );

    const nirf_rank_card = nirf
      ? `NIRF Rank: ${nirf.rank || nirf.rank_band || "Ranked"}`
      : undefined;
    const nirf_desc = nirf ? `${nirf.ranking_category} Standing` : undefined;

    const naac = (rankingBodies || []).find(
      (b: any) => b.name === "NAAC" || b.name?.includes("NAAC"),
    );
    const naac_grade_card = naac ? `Grade: A++` : undefined;

    const top_institution_card = iirf
      ? `IIRF: #${iirf.rank || iirf.rank_band}`
      : qs
        ? `QS: #${qs.rank || qs.rank_band}`
        : undefined;

    const subject_rankings = currentRankings.map((r: any) => ({
      subject: `${r.ranking_body} (${r.ranking_category})`,
      rank: r.rank || r.rank_band || "Ranked",
    }));

    return {
      nirf_rank_card,
      nirf_desc,
      naac_grade_card,
      top_institution_card,
      subject_rankings,
    };
  })();

  const bodyColorMap: Record<string, string> = {
    NIRF: "#1e3a8a",
    NAAC: "#047857",
    QS: "#ea580c",
    "QS World University Rankings": "#ea580c",
    THE: "#be185d",
    NBA: "#4338ca",
    AICTE: "#0369a1",
  };
  const liveAccredBodies =
    (rankingBodies || []).length > 0
      ? (rankingBodies || []).map((b: any) => ({
          name: b.name,
          label: b.scope === "National" ? "National Body" : "Global Ranking",
          desc: (() => {
            const match = (currentRankings || []).find(
              (r: any) =>
                r.ranking_body === b.name ||
                r.ranking_body?.startsWith(b.name.split(" ")[0]),
            );
            if (!match) return b.scope + " · " + b.country;
            return match.rank_band
              ? `Band: ${match.rank_band}`
              : `Rank #${match.rank}`;
          })(),
          color: bodyColorMap[b.name] || "#6366f1",
        }))
      : [];

  const genderChartRef = useRef<Chart | null>(null);

  //  Helpers 

  const formatValue = (val: any): string => {
    if (val === null || val === undefined || val === "" || val === 0)
      return "-";
    if (val === -1) return "Not Available";
    if (typeof val === "object") return JSON.stringify(val);
    if (typeof val === "number") return val.toLocaleString();
    return String(val);
  };

  const formatPackage = (amount: number, currency: string = "INR"): string => {
    if (!amount || amount === -1) return "Not Available";
    const upper = currency.toUpperCase().trim();
    const sym = getCurrencySymbol(upper);
    if (upper === "INR") {
      if (amount >= 100000) return `${sym}${(amount / 100000).toFixed(2)} LPA`;
      return `${sym}${amount.toLocaleString()}`;
    }
    return `${sym}${amount.toLocaleString()}`;
  };

  const formatCurrency = (amount: any, currency: string = "INR"): string => {
    if (!amount || amount === -1) return "Not Available";
    if (typeof amount === "string") return amount;
    if (typeof amount === "number") {
      const upper = currency.toUpperCase().trim();
      const sym = getCurrencySymbol(upper);
      if (upper === "INR") {
        if (amount >= 100000) return `${sym}${(amount / 100000).toFixed(1)}L`;
      }
      return `${sym}${amount.toLocaleString()}`;
    }
    return String(amount);
  };

  const fmtFee = (amount: number, currency: string): string => {
    if (!amount || amount <= 0) return "N/A";
    const upper = currency.toUpperCase().trim();
    const sym = getCurrencySymbol(upper);
    if (upper === "INR") {
      if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
      return `₹${amount.toLocaleString()}`;
    }
    return `${sym}${amount.toLocaleString()}`;
  };

  const getBasicInfoFromFiles = (files: Record<string, any> = {}) => {
    const normalized = files["normalized.json"] || files["serper.json"] || {};
    const raw = files["raw.json"] || {};
    return {
      normalized,
      raw,
      basicInfo: normalized.basic_info || raw.basic_info || normalized || raw || {},
      rawBasicInfo: raw.basic_info || {},
    };
  };

  const getStat = (category: string) => {
    if (!Array.isArray(collegeData?.student_statistics)) return 0;
    const stat = collegeData?.student_statistics?.find((s) =>
      s.category.toLowerCase().includes(category.toLowerCase()),
    );
    const val = stat?.value;
    if (val === null || val === undefined) return 0;
    if (typeof val === "object") return JSON.stringify(val);
    return val;
  };

  const getDetail = (keyword: string): any => {
    if (!Array.isArray(collegeData?.additional_details)) return "-";
    const detail = collegeData?.additional_details?.find((d) =>
      d.category.toLowerCase().includes(keyword.toLowerCase()),
    );
    const val = detail?.value;
    if (val === null || val === undefined) return "-";
    if (typeof val === "object") return JSON.stringify(val);
    return val;
  };

  //  Fetch 

  const fetchCollegeDetails = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      console.log(" Fetching college details for:", collegeName);

      //  1. Try scraper API (rich per-college JSON files) 
      let usedScraper = false;
      try {
        const scraperRes = await fetch(
          `${SCRAPER_API_URL}/api/find-college?name=${encodeURIComponent(collegeName)}`,
        );
        if (scraperRes.ok) {
          const scraperData = await scraperRes.json();
          if (scraperData.found && scraperData.files) {
            const files = scraperData.files;
            const hasRichScraperFiles = Object.keys(files).some(
              (key) => key.endsWith("_all.json") || key === "raw.json",
            );
            usedScraper = hasRichScraperFiles;
            setDataSource(hasRichScraperFiles ? "scraper" : "scraper-phase1");

            //  normalized.json 
            const { normalized: norm, raw, basicInfo: bi, rawBasicInfo: rawBi } =
              getBasicInfoFromFiles(files);
            const metadata = norm._metadata || raw._metadata || {};

            const flattenedData: Partial<CollegeData> = {
              college_name:
                bi.college_name ||
                rawBi.college_name ||
                metadata.college_name ||
                scraperData.college_name ||
                collegeName,
              short_name: bi.short_name || rawBi.short_name,
              established:
                bi.established !== -1 && bi.established !== undefined
                  ? bi.established
                  : rawBi.established !== -1 && rawBi.established !== undefined
                    ? rawBi.established
                    : 0,
              institution_type: bi.institution_type || rawBi.institution_type,
              country:
                bi.country ||
                rawBi.country ||
                metadata.country ||
                scraperData.country ||
                "",
              location: bi.location || rawBi.location || "",
              website: bi.website || rawBi.website,
              about:
                bi.about || bi.summary || rawBi.about || rawBi.summary || "",
              summary:
                bi.summary || bi.about || rawBi.summary || rawBi.about || "",
              recognition: bi.recognition || rawBi.recognition,
              campus_area: bi.campus_area || rawBi.campus_area,
              contact_info: bi.contact_info || rawBi.contact_info,
              accreditations: bi.accreditations || rawBi.accreditations || [],
              affiliations: bi.affiliations || rawBi.affiliations || [],
              sources: bi.sources_verified || rawBi.sources_verified || [],
              student_statistics: [],
              additional_details: [],
              departments:
                norm.programs?.departments || raw.programs?.departments || [],
              ug_programs:
                norm.programs?.ug_programs || raw.programs?.ug_programs || [],
              pg_programs:
                norm.programs?.pg_programs || raw.programs?.pg_programs || [],
              phd_programs:
                norm.programs?.phd_programs || raw.programs?.phd_programs || [],
              approval_status: "approved",
              faculty_staff: 0,
              international_students:
                bi.student_history?.international_students ||
                rawBi.student_history?.international_students ||
                0,
              global_ranking: "",
              student_gender_ratio: {
                male_percentage:
                  bi.student_statistics?.male_percent ||
                  rawBi.student_statistics?.male_percent ||
                  0,
                female_percentage:
                  bi.student_statistics?.female_percent ||
                  rawBi.student_statistics?.female_percent ||
                  0,
              },
            };

            // Rankings
            const rankingSource = bi.rankings || rawBi.rankings;
            if (rankingSource) {
              flattenedData.rankings = {
                nirf_latest: rankingSource.nirf_latest,
                nirf_previous: rankingSource.nirf_previous,
                qs_world: rankingSource.qs_world,
                national_rank: rankingSource.national_rank,
                state_rank: rankingSource.state_rank,
              };
            }

            // Student statistics detail
            const statsSource =
              bi.student_statistics || rawBi.student_statistics;
            if (statsSource) {
              flattenedData.student_statistics_detail = statsSource;
            }

            // Faculty/staff
            const facultySource = bi.faculty_staff || rawBi.faculty_staff;
            if (facultySource) {
              flattenedData.faculty_staff_detail = facultySource;
            }

            // Student history → map categorywise to StudentCountEntry[]
            const historySource = bi.student_history || rawBi.student_history;
            if (historySource) {
              const comparisonList =
                historySource.student_count_comparison_last_3_years ||
                historySource.categorywise_student_comparison_last_3_years ||
                [];
              const catwise: StudentCountEntry[] = (
                Array.isArray(comparisonList) ? comparisonList : []
              ).map((e: any) => {
                const ugVal = e.ug !== undefined ? e.ug : (e.ug_students || 0);
                const pgVal = e.pg !== undefined ? e.pg : (e.pg_students || 0);
                const phdVal = e.phd !== undefined ? e.phd : (e.phd_students || 0);
                return {
                  year: parseInt(e.year) || e.year,
                  total_enrolled:
                    e.total_enrolled ||
                    (ugVal + pgVal + phdVal) ||
                    0,
                  ug: ugVal,
                  pg: pgVal,
                  phd: phdVal,
                };
              });
              flattenedData.student_history = {
                student_count_comparison_last_3_years: catwise,
                student_gender_ratio: {
                  total_male: 0,
                  total_female: 0,
                  male_percent: statsSource?.male_percent || 0,
                  female_percent: statsSource?.female_percent || 0,
                },
                international_students: {
                  total_count: historySource.international_students || 0,
                  countries_represented: [],
                  international_percent: 0,
                },
                notable_faculty: [],
                faculty_achievements: "",
              };
            }

            // Placements
            const normPlacements = norm.placements || {};
            if (normPlacements.placements) {
              flattenedData.placements = normPlacements.placements;
            }
            if (normPlacements.placement_comparison_last_3_years) {
              flattenedData.placement_comparison_last_3_years =
                normPlacements.placement_comparison_last_3_years;
            }
            if (normPlacements.gender_based_placement_last_3_years) {
              flattenedData.gender_based_placement_last_3_years =
                normPlacements.gender_based_placement_last_3_years;
            }
            if (normPlacements.sector_wise_placement_last_3_years) {
              flattenedData.sector_wise_placement_last_3_years =
                normPlacements.sector_wise_placement_last_3_years;
            }
            if (normPlacements.top_recruiters) {
              flattenedData.top_recruiters = normPlacements.top_recruiters;
            }
            if (normPlacements.placement_highlights) {
              flattenedData.placement_highlights =
                normPlacements.placement_highlights;
            }

            // Fees
            const normFees = norm.fees || {};
            if (normFees.fees) flattenedData.fees = normFees.fees;
            if (normFees.fees_by_year)
              flattenedData.fees_by_year = normFees.fees_by_year;
            if (normFees.fees_note)
              flattenedData.fees_note = normFees.fees_note;
            if (normFees.scholarships_detail)
              flattenedData.scholarships_detail = normFees.scholarships_detail;

            // Infrastructure
            const normInfra = norm.infrastructure || {};
            if (normInfra.infrastructure)
              flattenedData.infrastructure = normInfra.infrastructure;
            if (normInfra.hostel_details)
              flattenedData.hostel_details = normInfra.hostel_details;
            if (normInfra.library_details)
              flattenedData.library_details = normInfra.library_details;
            if (normInfra.transport_details)
              flattenedData.transport_details = normInfra.transport_details;

            //  ug.json / pg.json / phd.json / online.json 
            setUgCourses(files["ug.json"]?.courses || []);
            setPgCourses(files["pg.json"]?.courses || []);
            setPhdCourses(files["phd.json"]?.courses || []);
            setOnlineCourses(files["online.json"]?.courses || []);
            setAdditionalCourses(files["additional.json"]?.courses || []);
            setAdditionalInfo(files["additional.json"] || null);

            //  admissions.json 
            const admRaw = files["admissions.json"];
            setAdmissions(
              admRaw?.data ||
                (Array.isArray(admRaw) ? admRaw : admRaw ? [admRaw] : []),
            );

            //  scholarships.json 
            setScholarshipItems(files["scholarships.json"]?.data || []);

            //  events.json 
            setEventsList(
              filterRealEvents(files["events.json"]?.events || files["events.json"]?.data || []),
            );

            //  departments.json 
            setRichDepartments(files["departments.json"]?.departments || []);

            //  ranking.json 
            const rankingFile = files["ranking.json"] || {};
            setCurrentRankings(rankingFile.current_rankings || []);
            setHistoricalRankings(rankingFile.historical_rankings || []);
            setRankingMetadata(rankingFile.ranking_metadata || null);
            setRankingBodies(rankingFile.ranking_bodies || []);
            setRankingHistory5Year(rankingFile.ranking_history_5_year || []);
            setRankingBreakdown(rankingFile.ranking_breakdown || null);
            setDepartmentRankings(rankingFile.department_rankings || []);
            setResearchContribution(rankingFile.research_contribution || []);
            setDataSources(rankingFile.data_sources || []);

            //  student_statistics.json 
            const sStats = files["student_statistics.json"];
            const demographics =
              sStats?.student_demographics_last_3_years || [];
            setStudentDemographics(demographics);
            setGenderRatio3Yr(
              sStats?.overall_gender_ratio_3_year_average || null,
            );

            if (demographics.length > 0) {
              const catwise: StudentCountEntry[] = demographics.map(
                (e: any) => ({
                  year: parseInt(e.year) || e.year,
                  total_enrolled: Number(e.total_students) || 0,
                  ug: Number(e.undergraduate_students?.total) || 0,
                  pg: Number(e.postgraduate_students?.total) || 0,
                  phd: Number(e.phd_students?.total) || 0,
                }),
              );
              // Always populate with actual student stats data (overwrite any placeholder data)
              flattenedData.student_history = {
                student_count_comparison_last_3_years: catwise,
                student_gender_ratio: {
                  total_male: 0,
                  total_female: 0,
                  male_percent:
                    sStats?.overall_gender_ratio_3_year_average
                      ?.male_percentage || 0,
                  female_percent:
                    sStats?.overall_gender_ratio_3_year_average
                      ?.female_percentage || 0,
                },
                international_students: {
                  total_count: demographics[0]?.international_students || 0,
                  countries_represented: [],
                  international_percent: 0,
                },
                notable_faculty: [],
                faculty_achievements: "",
              };
            }

            //  placements_statistics.json 
            const pStats = files["placements_statistics.json"] || {};
            const compStats = pStats.placement_comparison_last_3_years || [];
            setNewPlacementStats(compStats);

            if (pStats) {
              let latestYearComp = null;
              if (compStats.length > 0) {
                latestYearComp = compStats[0];
                for (const comp of compStats) {
                  const curYear = comp.year_string || comp.year || "";
                  const bestYear =
                    latestYearComp?.year_string || latestYearComp?.year || "";
                  if (String(curYear) > String(bestYear)) {
                    latestYearComp = comp;
                  }
                }
              }

              const plObj = pStats.placements || {};
              // Always populate/overwrite placements from placements_statistics.json
              // so placement summary, comparison chart and table always show real data
              if (
                !flattenedData.placements ||
                Object.keys(flattenedData.placements).length === 0
              ) {
                flattenedData.placements = {
                  year:
                    plObj.year ||
                    latestYearComp?.year_string ||
                    latestYearComp?.year ||
                    "2025-26",
                  highest_package:
                    plObj.highest_package ||
                    latestYearComp?.highest_package ||
                    0,
                  average_package:
                    plObj.average_package ||
                    latestYearComp?.average_package ||
                    latestYearComp?.median_package ||
                    0,
                  median_package:
                    plObj.median_package || latestYearComp?.median_package || 0,
                  package_currency:
                    plObj.package_currency ||
                    latestYearComp?.package_currency ||
                    "INR",
                  placement_rate_percent:
                    plObj.placement_rate_percent ||
                    latestYearComp?.employment_rate_percent ||
                    0,
                  total_students_placed:
                    plObj.total_students_placed ||
                    latestYearComp?.students_placed ||
                    0,
                  total_companies_visited: plObj.total_companies_visited || 0,
                  graduate_outcomes_note: plObj.graduate_outcomes_note || "",
                };
              }
              // Always overwrite comparison/breakdown from placements_statistics.json
              // (this data lives there, not in the basic_info response)
              flattenedData.placement_comparison_last_3_years = compStats;
              flattenedData.gender_based_placement_last_3_years =
                pStats.gender_based_placement_last_3_years || [];
              flattenedData.sector_wise_placement_last_3_years =
                pStats.sector_wise_placement_last_3_years || [];
              flattenedData.top_recruiters = pStats.top_recruiters || [];
              flattenedData.placement_highlights =
                pStats.placement_highlights || "";
            }

            //  infrastructure_accommodations.json 
            setInfraFacility(
              files["infrastructure_accommodations.json"]?.data?.[0] || null,
            );

            //  reviews.json 
            setReviewsList(files["reviews.json"]?.data || []);

            //  alumni.json 
            const alumniData = files["alumni.json"];
            setAlumniList(
              alumniData?.data ||
                (Array.isArray(alumniData)
                  ? alumniData
                  : alumniData
                    ? [alumniData]
                    : []),
            );

            //  faqs.json 
            const faqsData = files["faqs.json"] || files["faq.json"];
            setFaqList(
              faqsData?.data ||
                (Array.isArray(faqsData)
                  ? faqsData
                  : faqsData
                    ? [faqsData]
                    : []),
            );

            if (
              flattenedData.departments &&
              flattenedData.departments.length > 0
            ) {
              setSelectedDepartment(flattenedData.departments[0]);
            }

            setCollegeData(flattenedData as CollegeData);
          }
        }
      } catch (scraperErr) {
        console.warn(
          " Scraper API failed, falling back to Go engine:",
          scraperErr,
        );
      }

      //  2. Fall back to Go engine if scraper didn't work 
      if (!usedScraper) {
        try {
          setDataSource("go-engine");
          const response = await fetch(
            `${API_URL}/api/college-statistics?college_name=${encodeURIComponent(collegeName)}`,
          );
          if (!response.ok)
            throw new Error(`Go Engine returned ${response.status}`);
          const data = await response.json();

          if (data.error) {
            setError(data.error);
          } else {
            const flattenedData = { ...data };
            const source = data.serper_sections || data;

            // Programs
            const progSource = source.programs || data.programs_data || {};
            if (progSource) {
              if (progSource.ug_programs?.length)
                flattenedData.ug_programs = progSource.ug_programs;
              if (progSource.pg_programs?.length)
                flattenedData.pg_programs = progSource.pg_programs;
              if (progSource.phd_programs?.length)
                flattenedData.phd_programs = progSource.phd_programs;
              if (progSource.departments?.length)
                flattenedData.departments = progSource.departments;
            }

            // Placements
            const placeSource = source.placements || data.placements_data || {};
            if (placeSource) {
              if (placeSource.placements) {
                flattenedData.placements = placeSource.placements;
              } else if (
                source.placements &&
                typeof source.placements === "object"
              ) {
                flattenedData.placements = source.placements;
              }

              const compList =
                placeSource.placement_comparison_last_3_years ||
                source.placement_comparison_last_3_years ||
                data.placement_comparison_last_3_years;
              if (compList?.length) {
                flattenedData.placement_comparison_last_3_years = compList;
              }

              const genderList =
                placeSource.gender_based_placement_last_3_years ||
                source.gender_based_placement_last_3_years ||
                data.gender_based_placement_last_3_years;
              if (genderList?.length) {
                flattenedData.gender_based_placement_last_3_years = genderList;
              }

              const sectorList =
                placeSource.sector_wise_placement_last_3_years ||
                source.sector_wise_placement_last_3_years ||
                data.sector_wise_placement_last_3_years;
              if (sectorList?.length) {
                flattenedData.sector_wise_placement_last_3_years = sectorList;
              }

              const recruiters =
                placeSource.top_recruiters ||
                source.top_recruiters ||
                data.top_recruiters;
              if (recruiters?.length) {
                flattenedData.top_recruiters = recruiters;
              }

              const highlights =
                placeSource.placement_highlights ||
                source.placement_highlights ||
                data.placement_highlights;
              if (highlights) {
                flattenedData.placement_highlights = highlights;
              }
            }

            // Fees
            const feeSource = source.fees || data.fees_data || {};
            if (feeSource) {
              if (feeSource.fees) flattenedData.fees = feeSource.fees;
              if (feeSource.fees_by_year?.length)
                flattenedData.fees_by_year = feeSource.fees_by_year;
              if (feeSource.fees_note)
                flattenedData.fees_note = feeSource.fees_note;
              if (feeSource.scholarships_detail?.length)
                flattenedData.scholarships_detail =
                  feeSource.scholarships_detail;
            }

            // Basic info
            const basicSource = source.basic_info || {};
            if (basicSource.student_statistics)
              flattenedData.student_statistics_detail =
                basicSource.student_statistics;
            if (basicSource.faculty_staff)
              flattenedData.faculty_staff_detail = basicSource.faculty_staff;
            if (basicSource.student_history) {
              const sh = basicSource.student_history;
              const comparisonList =
                sh.student_count_comparison_last_3_years ||
                sh.categorywise_student_comparison_last_3_years ||
                [];
              const catwise = (Array.isArray(comparisonList) ? comparisonList : []).map((e: any) => {
                const ugVal = e.ug !== undefined ? e.ug : (e.ug_students || 0);
                const pgVal = e.pg !== undefined ? e.pg : (e.pg_students || 0);
                const phdVal = e.phd !== undefined ? e.phd : (e.phd_students || 0);
                return {
                  year: parseInt(e.year) || e.year,
                  total_enrolled:
                    e.total_enrolled ||
                    (ugVal + pgVal + phdVal) ||
                    0,
                  ug: ugVal,
                  pg: pgVal,
                  phd: phdVal,
                };
              });
              flattenedData.student_history = {
                ...sh,
                student_count_comparison_last_3_years: catwise,
              };
            }
            if (basicSource.rankings) {
              const rSource = basicSource.rankings;
              flattenedData.rankings = {
                nirf_latest:
                  rSource.nirf_latest || rSource.nirf_2025 || rSource.nirf_rank,
                nirf_previous: rSource.nirf_previous || rSource.nirf_2024,
                qs_world: rSource.qs_world,
                national_rank: rSource.national_rank,
                state_rank: rSource.state_rank,
              };
            }

            // Populate rich detailed hooks from go-engine source
            const getFileContent = (key: string) => {
              return (
                source[key] ||
                source[key + ".json"] ||
                (source.files && (source.files[key] || source.files[key + ".json"])) ||
                (data.files && (data.files[key] || data.files[key + ".json"]))
              );
            };

            // Direct file fetch from Python scraper as ultimate fallback
            const fetchFileDirectly = async (fileName: string) => {
              try {
                const response = await fetch(
                  `${SCRAPER_API_URL}/api/file?college_name=${encodeURIComponent(collegeName)}&file=${fileName}`,
                );
                if (response.ok) {
                  return await response.json();
                }
              } catch (err) {
                // Silent fail - will use cache
              }
              return null;
            };

            const ugData = getFileContent("ug");
            setUgCourses(ugData?.courses || []);

            const pgData = getFileContent("pg");
            setPgCourses(pgData?.courses || []);

            const phdData = getFileContent("phd");
            setPhdCourses(phdData?.courses || []);

            const onlineData = getFileContent("online");
            setOnlineCourses(onlineData?.courses || []);

            const additionalData = getFileContent("additional");
            setAdditionalCourses(additionalData?.courses || []);
            setAdditionalInfo(additionalData || null);

            const admissionsData = getFileContent("admissions");
            setAdmissions(
              admissionsData?.data ||
                (Array.isArray(admissionsData)
                  ? admissionsData
                  : admissionsData
                    ? [admissionsData]
                    : []),
            );

            const scholarshipsData = getFileContent("scholarships");
            // Prioritize file-based full data (140 scholarships) over stale serper_sections cache (3 scholarships)
            const finalScholarships =
              data.files?.["scholarships.json"]?.data ||
              scholarshipsData?.data ||
              [];
            setScholarshipItems(finalScholarships);

            const eventsData = getFileContent("events");
            let finalEventsData = data.files?.["events.json"] || eventsData;
            
            // If no events data available, try direct fetch from scraper
            if ((!finalEventsData || (!finalEventsData.events && !finalEventsData.data)) && collegeName) {
              const directEvents = await fetchFileDirectly("events.json");
              finalEventsData = directEvents || eventsData;
            }
            setEventsList(finalEventsData?.events || finalEventsData?.data || []);

            const deptsData = getFileContent("departments");
            setRichDepartments(deptsData?.departments || []);

            const rankingData = getFileContent("ranking");
            // Prioritize file-based ranking data over stale cache
            let finalRankingData = data.files?.["ranking.json"] || rankingData;
            
            // If no ranking data available, try direct fetch from scraper
            if (!finalRankingData && collegeName) {
              const directRanking = await fetchFileDirectly("ranking.json");
              finalRankingData = directRanking || rankingData;
            }
            
            setCurrentRankings(finalRankingData?.current_rankings || []);
            setHistoricalRankings(finalRankingData?.historical_rankings || []);
            setRankingMetadata(finalRankingData?.ranking_metadata || null);
            setRankingBodies(finalRankingData?.ranking_bodies || []);
            setRankingHistory5Year(finalRankingData?.ranking_history_5_year || []);
            setRankingBreakdown(finalRankingData?.ranking_breakdown || null);
            setDepartmentRankings(finalRankingData?.department_rankings || []);
            setResearchContribution(finalRankingData?.research_contribution || []);
            setDataSources(finalRankingData?.data_sources || []);

            const studentStatsData = getFileContent("student_statistics");
            // Prioritize file-based student statistics data over stale cache
            let finalStudentStatsData =
              data.files?.["student_statistics.json"] || studentStatsData;
            
            // If no student stats available, try direct fetch from scraper
            if (!finalStudentStatsData && collegeName) {
              const directStats = await fetchFileDirectly("student_statistics.json");
              finalStudentStatsData = directStats || studentStatsData;
            }
            
            setStudentDemographics(
              finalStudentStatsData?.student_demographics_last_3_years || [],
            );
            setGenderRatio3Yr(
              finalStudentStatsData?.overall_gender_ratio_3_year_average || null,
            );

            const placementsStatsData = getFileContent("placements_statistics");
            // Prioritize file-based placements data over stale cache
            let finalPlacementsStatsData =
              data.files?.["placements_statistics.json"] || placementsStatsData;
            
            // If no placements data available, try direct fetch from scraper
            if (!finalPlacementsStatsData && collegeName) {
              const directPlacements = await fetchFileDirectly("placements_statistics.json");
              finalPlacementsStatsData = directPlacements || placementsStatsData;
            }
            
            setNewPlacementStats(
              finalPlacementsStatsData?.placement_comparison_last_3_years || [],
            );

            const infraData = getFileContent("infrastructure_accommodations");
            setInfraFacility(infraData?.data?.[0] || null);

            const alumniDataGo = getFileContent("alumni");
            setAlumniList(
              alumniDataGo?.data ||
                (Array.isArray(alumniDataGo)
                  ? alumniDataGo
                  : alumniDataGo
                    ? [alumniDataGo]
                    : []),
            );

            const faqsDataGo = getFileContent("faqs") || getFileContent("faq");
            setFaqList(
              faqsDataGo?.data ||
                (Array.isArray(faqsDataGo)
                  ? faqsDataGo
                  : faqsDataGo
                    ? [faqsDataGo]
                    : []),
            );

            setCollegeData(flattenedData);

            if (flattenedData.departments?.length) {
              setSelectedDepartment(flattenedData.departments[0]);
            }
          }
        } catch (goErr) {
          console.warn(" Go Engine fallback also failed:", goErr);
          // Show empty state — college may not be in database yet
          setError(
            "College data not available yet. Please try again after scraping completes.",
          );
        }
      }
    } catch (err) {
      setError("Failed to fetch college data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollegeDetails();
  }, [collegeName]);

  // Sync activeTab with URL hash to preserve selected section on refresh
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash) {
        setActiveTab(hash);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  // Validate activeTab against allTabs to fallback to overview if selected tab is empty/hidden
  useEffect(() => {
    const baseTabs = [
      "overview",
      "rankings",
      "programs",
      "admissions",
      "departments",
      "placements",
      "fees",
      "scholarships",
      "campus",
      ...(eventsList && eventsList.length > 0 ? ["events"] : []),
      "reviews",
      "alumni",
    ];
    const derivedAllTabs = onlineCourses.length > 0 ? [...baseTabs, "online"] : baseTabs;

    if (activeTab !== "overview" && !derivedAllTabs.includes(activeTab)) {
      setActiveTab("overview");
    }
  }, [eventsList, onlineCourses, activeTab]);

  // Background update via WebSockets — fires if SearchModal flagged _streaming for this college
  useEffect(() => {
    const streamingFlag = sessionStorage.getItem("_streaming_college");
    if (!streamingFlag) return;
    const flaggedSlug = streamingFlag
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const currentSlug = collegeName
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    if (flaggedSlug !== currentSlug) return;

    setIsUpdatingBackground(true);
    // Don't remove the flag yet, so if user refreshes they still connect,
    // or remove it after the websocket connects. We'll leave it for now.

    const wsUrl = `${WS_URL}/ws/college-details/${encodeURIComponent(collegeName)}`;
    const ws = new WebSocket(wsUrl);
    const expectedPipelineId = sessionStorage.getItem("_streaming_pipeline_id") || "";
    let pipelineCompleted = false;

    ws.onopen = () => {
      console.log(" Connected to WebSocket for live updates:", collegeName);
      setScrapingStatus("Connected. Receiving live updates...");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log(" Live WebSocket Data:", data);

        const eventPipelineId = data.pipeline_id || data.data?.pipeline_id || "";
        if (expectedPipelineId && eventPipelineId && eventPipelineId !== expectedPipelineId) return;

        if (data.type === "initial_data") {
          setScrapingStatus("Initial data loaded. Receiving detailed sections...");
          fetchCollegeDetails(true);
        } else if (data.type === "scraping_update") {
          if (data.update_type === "section_complete") {
            const sectionName = data.data?.section || "Update";
            setScrapingStatus(`Update received: ${sectionName}`);
            setLastUpdatedSection(sectionName);

            // Re-fetch details silently to update UI with the new DB contents
            fetchCollegeDetails(true).then(() => {
              setBackgroundUpdateDone(true);
              setTimeout(() => setBackgroundUpdateDone(false), 2000);
            });
          } else if (data.update_type === "phase1_complete") {
            console.log(" Phase 1 Ingestion Complete (Serper data ready)");
            setScrapingStatus(
              "Initial data loaded. Finalizing detailed sections...",
            );
            fetchCollegeDetails(true);
          } else if (data.update_type === "pipeline_complete") {
            console.log(" Pipeline complete!");
            pipelineCompleted = true;
            setIsUpdatingBackground(false);
            setScrapingStatus("Scraping completed.");
            sessionStorage.removeItem("_streaming_college");
            sessionStorage.removeItem("_streaming_pipeline_id");

            fetchCollegeDetails(true).then(() => {
              setBackgroundUpdateDone(true);
              setTimeout(() => setBackgroundUpdateDone(false), 4000);
            });
          } else if (data.update_type === "pipeline_error") {
            setIsUpdatingBackground(false);
            setScrapingStatus(
              data.data?.error || "Detailed scraping stopped. Saved sections remain available.",
            );
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error(" WebSocket error:", error);
      setIsUpdatingBackground(false);
      setScrapingStatus("Live updates disconnected. Checking latest saved data...");
    };

    ws.onclose = () => {
      console.log(" WebSocket disconnected for:", collegeName);
      setIsUpdatingBackground(false);

      if (pipelineCompleted) {
        setScrapingStatus("Scraping completed.");
        sessionStorage.removeItem("_streaming_college");
        sessionStorage.removeItem("_streaming_pipeline_id");
      } else {
        setScrapingStatus("Live updates disconnected. Refreshing saved data...");
      }

      // Final fetch to ensure we have everything
      fetchCollegeDetails(true).then(() => {
        setBackgroundUpdateDone(true);
        setTimeout(() => setBackgroundUpdateDone(false), 4000);
      });
    };

    return () => {
      ws.close();
    };
  }, [collegeName, pipelineWatchVersion]);

  useEffect(() => {
    if (collegeData && activeTab === "overview") {
      setTimeout(() => {
        createGenderChart();
      }, 300);
    }
    return () => {
      if (genderChartRef.current) genderChartRef.current.destroy();
    };
  }, [collegeData, activeTab, genderRatio3Yr]);

  const createGenderChart = () => {
    const canvas = document.getElementById("genderChart") as HTMLCanvasElement;
    if (!canvas || !collegeData) return;
    if (genderChartRef.current) genderChartRef.current.destroy();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Prefer 3-yr average from student_statistics.json, then student_history, then legacy
    const maleP =
      genderRatio3Yr?.male_percentage ||
      collegeData.student_history?.student_gender_ratio?.male_percent ||
      collegeData.student_gender_ratio?.male_percentage ||
      50;
    const femaleP =
      genderRatio3Yr?.female_percentage ||
      collegeData.student_history?.student_gender_ratio?.female_percent ||
      collegeData.student_gender_ratio?.female_percentage ||
      50;

    genderChartRef.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Male", "Female"],
        datasets: [
          {
            data: [maleP, femaleP],
            backgroundColor: ["#070642", "#9a3197"],
            borderWidth: 0,
            hoverOffset: 15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
        },
      },
    });
  };

  //  Course card helper 

  const CourseCard = ({
    course,
    level,
  }: {
    course: Course;
    level: "UG" | "PG" | "PhD" | "Online";
  }) => {
    const levelClass = level === "PG" ? "pg" : level === "PhD" ? "phd" : "";
    const durationYears =
      course.duration_months > 0
        ? `${course.duration_months} mo${course.duration_months !== 12 ? ` (${(course.duration_months / 12).toFixed(1)} yrs)` : " (1 yr)"}`
        : null;
    const feeStr =
      course.tuition_fee?.amount > 0
        ? `${fmtFee(course.tuition_fee.amount, course.tuition_fee.currency)}/${course.tuition_fee.fee_cycle || "yr"}`
        : null;
    const hasLink =
      course.curriculum_link &&
      course.curriculum_link !== "not_available" &&
      course.curriculum_link.startsWith("http");

    return (
      <div
        className={`program-card ${levelClass}`}
        style={{ display: "flex", flexDirection: "column", gap: 6 }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
          <span className="program-badge">{level}</span>
          {course.mode && course.mode !== "not_available" && (
            <span
              style={{
                fontSize: 11,
                background: "#f0f0f8",
                color: "#555",
                borderRadius: 4,
                padding: "2px 6px",
                whiteSpace: "nowrap",
              }}
            >
              {course.mode}
            </span>
          )}
        </div>
        <span
          className="program-name"
          style={{ fontWeight: 600, fontSize: 14 }}
        >
          {course.title}
        </span>
        {course.department && (
          <span style={{ fontSize: 12, color: "#666" }}>
             {course.department}
          </span>
        )}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            fontSize: 12,
            color: "#555",
          }}
        >
          {durationYears && <span> {durationYears}</span>}
          {feeStr && <span> {feeStr}</span>}
          {course.intake?.length > 0 && (
            <span> {course.intake.join(", ")}</span>
          )}
        </div>
        {hasLink && (
          <a
            href={course.curriculum_link}
            target="_blank"
            rel="noopener noreferrer"
            className="source-link"
            style={{ fontSize: 12, marginTop: 2 }}
          >
            View Curriculum →
          </a>
        )}
      </div>
    );
  };

  //  Group courses by department 
  const groupByDepartment = (courses: Course[]): Record<string, Course[]> => {
    const groups: Record<string, Course[]> = {};
    for (const c of courses) {
      const key =
        c.department && c.department !== "not_available"
          ? c.department
          : "General";
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }
    return groups;
  };

  //  Loading / Error states 

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading College Data...</p>
      </div>
    );
  }

  if (error || !collegeData) {
    const isNotScraped =
      error?.includes("not available yet") ||
      error?.includes("not found") ||
      !collegeData;
    return (
      <div
        style={{
          minHeight: "80vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 20px",
          background: "linear-gradient(135deg, #f8fafc 0%, #f0f4ff 100%)",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "20px",
            padding: "48px 40px",
            boxShadow: "0 8px 40px rgba(72,52,212,0.10)",
            maxWidth: "520px",
            width: "100%",
            textAlign: "center",
          }}
        >
          {isNotScraped ? (
            <>
              <div style={{ fontSize: "56px", marginBottom: "16px" }}></div>
              <h2
                style={{
                  fontSize: "22px",
                  fontWeight: 700,
                  color: "#1e293b",
                  marginBottom: "8px",
                }}
              >
                Data Not Scraped Yet
              </h2>
              <p
                style={{
                  color: "#64748b",
                  marginBottom: "8px",
                  fontSize: "15px",
                }}
              >
                <strong style={{ color: "#4834d4" }}>{collegeName}</strong>
              </p>
              <p
                style={{
                  color: "#94a3b8",
                  marginBottom: "28px",
                  fontSize: "14px",
                }}
              >
                This college hasn&apos;t been analyzed yet. Click below to start
                scraping all details — it takes 2–5 minutes.
              </p>
              <button
                onClick={async () => {
                  setLoading(true);
                  setError("");
                  try {
                    const res = await fetch(
                      `${API_URL}/api/college/check-or-start`,
                      {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          college_name: collegeName,
                          country: "India",
                        }),
                      },
                    );
                    const d = await res.json();
                    if (!res.ok || !d.found) {
                      throw new Error(d.error || "Unable to start college analysis");
                    }

                    const resolvedName =
                      d.college_name || d.basic_info?.college_name || collegeName;
                    if (d.pipeline_started || d.pipeline_already_running || d.stream_url) {
                      sessionStorage.setItem("_streaming_college", resolvedName);
                      if (d.pipeline_id) sessionStorage.setItem("_streaming_pipeline_id", d.pipeline_id);
                      setScrapingStatus(
                        d.pipeline_already_running
                          ? "Analysis is already running. Connecting to live updates..."
                          : "Initial data saved. Starting detailed sections...",
                      );
                      setIsUpdatingBackground(true);

                      // Keep this workflow on college-details. If validation expanded
                      // an acronym, move to the canonical URL so its WebSocket key and
                      // all subsequent cache reads use the official name.
                      if (resolvedName !== collegeName) {
                        router.replace(
                          `/college-details/${encodeURIComponent(resolvedName)}#overview`,
                        );
                        return;
                      }
                      setPipelineWatchVersion((version) => version + 1);
                    }

                    await fetchCollegeDetails(false);
                    if (d.pipeline_error) setScrapingStatus(d.pipeline_error);
                  } catch {
                    setLoading(false);
                    setError(
                      "Failed to start scraper. Check that the Go Engine and InitialThree service are running.",
                    );
                  }
                }}
                style={{
                  background:
                    "linear-gradient(135deg, #4834d4 0%, #9a3197 100%)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "12px",
                  padding: "14px 32px",
                  fontSize: "15px",
                  fontWeight: 600,
                  cursor: "pointer",
                  width: "100%",
                  marginBottom: "16px",
                  boxShadow: "0 4px 16px rgba(72,52,212,0.25)",
                }}
              >
                 Analyze University Now
              </button>
              <Link
                href="/"
                style={{
                  color: "#4834d4",
                  fontSize: "14px",
                  textDecoration: "none",
                }}
              >
                ← Back to Home
              </Link>
            </>
          ) : (
            <>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}></div>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "#1e293b",
                  marginBottom: "8px",
                }}
              >
                Error Loading Data
              </h2>
              <p style={{ color: "#64748b", marginBottom: "24px" }}>{error}</p>
              <Link
                href="/"
                style={{
                  background: "#4834d4",
                  color: "#fff",
                  borderRadius: "10px",
                  padding: "10px 24px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                ← Back to Home
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  //  Tab list 
  const baseTabs = [
    "overview",
    "rankings",
    "programs",
    "admissions",
    "departments",
    "placements",
    "fees",
    "scholarships",
    "campus",
    ...(eventsList && eventsList.length > 0 ? ["events"] : []),
    "reviews",
    "alumni",
  ];
  const allTabs = onlineCourses.length > 0 ? [...baseTabs, "online"] : baseTabs;

  const tabLabel = (t: string): string => {
    const totalPrograms =
      (ugCourses.length || collegeData.ug_programs?.length || 0) +
      (pgCourses.length || collegeData.pg_programs?.length || 0) +
      (phdCourses.length || collegeData.phd_programs?.length || 0);
    const totalDepts =
      richDepartments.length || collegeData.departments?.length || 0;
    const totalScholarships =
      scholarshipItems.length || collegeData.scholarships_detail?.length || 0;
    const totalReviews = reviewsList.length || 0;
    const totalFaqs = faqList.length || 0;
    const totalAlumni = alumniList.length || 0;

    if (t === "programs" && totalPrograms > 0)
      return `Programs (${totalPrograms})`;
    if (t === "departments" && totalDepts > 0)
      return `Departments (${totalDepts})`;
    if (t === "online" && onlineCourses.length > 0)
      return `Online (${onlineCourses.length})`;
    if (t === "scholarships" && totalScholarships > 0)
      return `Scholarships (${totalScholarships})`;
    if (t === "reviews") {
      if (totalReviews > 0 && totalFaqs > 0)
        return `Reviews & FAQ (${totalReviews + totalFaqs})`;
      if (totalReviews > 0) return `Reviews (${totalReviews})`;
      if (totalFaqs > 0) return `FAQ (${totalFaqs})`;
      return "Reviews & FAQ";
    }
    if (t === "alumni" && totalAlumni > 0) return `Alumni (${totalAlumni})`;
    if (t === "rankings") return `Rankings`;
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  //  Ranking helpers 
  const isRealRank = (v: any) =>
    v !== null &&
    v !== undefined &&
    v !== "" &&
    v !== 0 &&
    String(v).toLowerCase() !== "n/a" &&
    String(v).toLowerCase() !== "not applicable" &&
    String(v).toLowerCase() !== "null";

  const isRealValue = (v: any): boolean => {
    if (v === null || v === undefined) return false;
    const clean = String(v).trim().toLowerCase();
    return clean !== '' && !['n/a', 'na', 'null', 'none', 'undefined', '-', '-1', '-1.0'].includes(clean);
  };

  // 
  // RENDER
  // 
  return (
    <div className="college-details-page">
      {/*  Hero  */}
      <section className="hero-section">
        <div className="hero-content">
          <Link href="/" className="back-link">
            ← Back to Home
          </Link>
          <h1 className="college-name">
            {collegeData.college_name || "College details"}
            {collegeData.approval_status === "fetching" && (
              <span className="live-badge">
                <span className="pulse"></span> LIVE SYNCING
              </span>
            )}
          </h1>
          <p className="college-location">
            {[collegeData.location, collegeData.country]
              .filter((value) => isRealValue(value))
              .join(", ") || "Location not published"}
          </p>
          <p className="college-summary">
            {collegeData.summary ||
              collegeData.about ||
              "Institutional overview is not available yet."}
          </p>

          {scrapingStatus && (
            <div className="scraping-progress">
              <div className="progress-info">
                <span className="progress-text">
                  {scrapingStatus === "fetching"
                    ? "Initializing Scrapers..."
                    : scrapingStatus === "phase1_complete"
                      ? "Core Data Extracted"
                      : scrapingStatus === "section_complete"
                        ? `Updating ${lastUpdatedSection ?? "data"}...`
                        : "Scraping detailed info..."}
                </span>
                <div className="mini-spinner"></div>
              </div>
            </div>
          )}

          {/* Background update badge — shown while pipeline runs after navigation */}
          {isUpdatingBackground && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderRadius: 20,
                marginTop: 8,
                background: "rgba(154,49,151,0.1)",
                border: "1px solid rgba(154,49,151,0.3)",
                fontSize: 13,
                color: "#9a3197",
                fontWeight: 500,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#9a3197",
                  display: "inline-block",
                  animation: "pulse 1.2s infinite",
                }}
              />
               Updating data in background… this page will refresh
              automatically.
            </div>
          )}
          {backgroundUpdateDone && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 16px",
                borderRadius: 20,
                marginTop: 8,
                background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.3)",
                fontSize: 13,
                color: "#16a34a",
                fontWeight: 500,
              }}
            >
               Data updated successfully!
            </div>
          )}

          {/* Quick Stats Bar */}
          <div className="quick-stats">
            {(() => {
              const isNotMinusOne = (val: any): boolean => {
                if (val === null || val === undefined) return false;
                const s = String(val).trim();
                return (
                  s !== "-1" &&
                  s !== "-1.0" &&
                  s !== "" &&
                  s !== "null" &&
                  s !== "undefined"
                );
              };

              const formatStatValue = (val: any, label: string) => {
                if (val === null || val === undefined) return "";
                let s = String(val).trim();
                if (s.endsWith("%")) return s;
                if (
                  label.toLowerCase().includes("percent") &&
                  !s.endsWith("%")
                ) {
                  return `${s}%`;
                }
                const num = Number(s.replace(/,/g, ""));
                if (!isNaN(num)) {
                  return num.toLocaleString("en-IN");
                }
                return s;
              };

              const rawStats = [
                {
                  label: "Total Students",
                  value:
                    collegeData.student_statistics_detail?.total_enrollment ||
                    collegeData.student_history
                      ?.student_count_comparison_last_3_years?.[0]
                      ?.total_enrolled ||
                    getStat("Total students"),
                  icon: "‍",
                },
                {
                  label: "UG Students",
                  value:
                    collegeData.student_statistics_detail?.ug_students ||
                    collegeData.student_history
                      ?.student_count_comparison_last_3_years?.[0]?.ug ||
                    getStat("UG Students"),
                  icon: "",
                },
                {
                  label: "PG Students",
                  value:
                    collegeData.student_statistics_detail?.pg_students ||
                    collegeData.student_history
                      ?.student_count_comparison_last_3_years?.[0]?.pg ||
                    getStat("PG Students"),
                  icon: "",
                },
                {
                  label: "PhD Students",
                  value:
                    collegeData.student_statistics_detail?.phd_students ||
                    collegeData.student_history
                      ?.student_count_comparison_last_3_years?.[0]?.phd ||
                    getStat("PhD Students"),
                  icon: "",
                },
                {
                  label: "Total Faculty",
                  value:
                    collegeData.faculty_staff_detail?.total_faculty ||
                    collegeData.faculty_staff ||
                    getStat("Total Faculty") ||
                    getStat("Faculty"),
                  icon: "‍",
                },
                {
                  label: "PhD Faculty",
                  value:
                    collegeData.faculty_staff_detail?.phd_faculty_percent ||
                    getStat("PhD Faculty Percentage"),
                  icon: "",
                },
                {
                  label: "International",
                  value:
                    collegeData.student_history?.international_students
                      ?.total_count || collegeData.international_students,
                  icon: "",
                },
                {
                  label: "UG Courses",
                  value:
                    ugCourses.length ||
                    collegeData.student_statistics_detail?.total_ug_courses,
                  icon: "",
                },
              ];

              const cardsToRender: {
                label: string;
                value: any;
                icon: string;
              }[] = [];

              rawStats.forEach((stat) => {
                if (
                  isNotMinusOne(stat.value) &&
                  stat.value !== 0 &&
                  stat.value !== "0"
                ) {
                  cardsToRender.push({
                    label: stat.label,
                    value: formatStatValue(stat.value, stat.label),
                    icon: stat.icon,
                  });
                }
              });

              if (currentRankings.length > 0) {
                currentRankings.forEach((r) => {
                  if (r.rank !== null && isNotMinusOne(r.rank)) {
                    cardsToRender.push({
                      label: `${r.ranking_body} ${r.ranking_category ? `(${r.ranking_category})` : ""}`,
                      value: `#${r.rank}`,
                      icon: "",
                    });
                  }
                });
              } else {
                const rk = collegeData.rankings || {};
                const legacyRanks = [
                  { label: "QS World", value: rk.qs_world, icon: "" },
                  { label: "THE World", value: rk.the_world, icon: "" },
                  {
                    label: "National Rank",
                    value: rk.national_rank,
                    icon: "",
                  },
                  { label: "State Rank", value: rk.state_rank, icon: "" },
                ];
                legacyRanks.forEach((card) => {
                  if (isRealRank(card.value) && isNotMinusOne(card.value)) {
                    cardsToRender.push(card);
                  }
                });
              }

              return cardsToRender.map((card, idx) => (
                <div className="stat-card" key={`stat-card-${idx}`}>
                  <span className="stat-icon">{card.icon}</span>
                  <span className="stat-value">{card.value}</span>
                  <span className="stat-label">{card.label}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </section>

      {/*  Tabs  */}
      <div className="tabs-container">
        <div className="tabs">
          {allTabs.map((tab) => (
            <button
              key={tab}
              className={`tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                window.location.hash = tab;
              }}
            >
              {tabLabel(tab)}
            </button>
          ))}
        </div>
      </div>

      {/*  Main content  */}
      <main className="main-content">
        {/* 
                    OVERVIEW TAB
                 */}
        {activeTab === "overview" && (
          <div className="tab-content">
            {/* About */}
            <section className="content-section">
              <h2 className="section-title">
                About {collegeData.college_name}
              </h2>
              <p className="about-text">
                {collegeData.about ||
                  collegeData.summary ||
                  "Institutional overview is not available yet."}
              </p>
            </section>

            {/* Quick Facts */}
            {(collegeData.established ||
              collegeData.institution_type ||
              collegeData.campus_area ||
              collegeData.website ||
              (collegeData.accreditations &&
                collegeData.accreditations.length > 0) ||
              (collegeData.affiliations &&
                collegeData.affiliations.length > 0) ||
              collegeData.recognition) && (
              <section className="content-section">
                <h2 className="section-title"> Quick Facts</h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Detail</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collegeData.established ? (
                      <tr>
                        <td>Established</td>
                        <td>{collegeData.established}</td>
                      </tr>
                    ) : null}
                    {collegeData.institution_type ? (
                      <tr>
                        <td>Institution Type</td>
                        <td>{collegeData.institution_type}</td>
                      </tr>
                    ) : null}
                    {collegeData.campus_area ? (
                      <tr>
                        <td>Campus Area</td>
                        <td>{collegeData.campus_area}</td>
                      </tr>
                    ) : null}
                    {collegeData.recognition ? (
                      <tr>
                        <td>Recognition</td>
                        <td>{collegeData.recognition}</td>
                      </tr>
                    ) : null}
                    {collegeData.accreditations &&
                    collegeData.accreditations.length > 0 ? (
                      <tr>
                        <td>Accreditations</td>
                        <td>
                          {collegeData.accreditations
                            .map(
                              (a) =>
                                `${a.body}${a.grade ? ` (${a.grade})` : ""}${a.year ? ` - ${a.year}` : ""}`,
                            )
                            .join(", ")}
                        </td>
                      </tr>
                    ) : null}
                    {collegeData.affiliations &&
                    collegeData.affiliations.length > 0 ? (
                      <tr>
                        <td>Affiliations</td>
                        <td>
                          {Array.isArray(collegeData.affiliations)
                            ? collegeData.affiliations.join(", ")
                            : collegeData.affiliations}
                        </td>
                      </tr>
                    ) : null}
                    {collegeData.website ? (
                      <tr>
                        <td>Website</td>
                        <td>
                          <a
                            href={
                              collegeData.website.startsWith("http")
                                ? collegeData.website
                                : `https://${collegeData.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="source-link"
                          >
                            {collegeData.website}
                          </a>
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </section>
            )}

            {/* Statistics of College (legacy charts component) */}
            <StatisticsOfCollege
              studentStatistics={collegeData.student_statistics_detail}
              facultyStaff={collegeData.faculty_staff_detail}
              collegeName={collegeData.college_name}
            />

            {/* Student Demographics (rich 3-year table from student_statistics.json) */}
            {studentDemographics.length > 0 && (
              <section className="content-section">
                <h2 className="section-title">
                   Student Demographics (3-Year Trend)
                </h2>
                {genderRatio3Yr && (
                  <p style={{ marginBottom: 12, color: "#555", fontSize: 14 }}>
                    <strong>Gender Ratio (3-yr avg):</strong>{" "}
                    {genderRatio3Yr.male_percentage.toFixed(1)}% Male /{" "}
                    {genderRatio3Yr.female_percentage.toFixed(1)}% Female
                  </p>
                )}
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Total</th>
                        <th>UG Total</th>
                        <th>UG Male</th>
                        <th>UG Female</th>
                        <th>PG Total</th>
                        <th>PG Male</th>
                        <th>PG Female</th>
                        <th>PhD Total</th>
                        <th>PhD Male</th>
                        <th>PhD Female</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentDemographics.map((d, idx) => (
                        <tr key={idx}>
                          <td>{d.year}</td>
                          <td>{d.total_students?.toLocaleString() || "-"}</td>
                          <td>
                            {d.undergraduate_students?.total?.toLocaleString() ||
                              "-"}
                          </td>
                          <td>
                            {d.undergraduate_students?.male?.toLocaleString() ||
                              "-"}
                          </td>
                          <td>
                            {d.undergraduate_students?.female?.toLocaleString() ||
                              "-"}
                          </td>
                          <td>
                            {d.postgraduate_students?.total?.toLocaleString() ||
                              "-"}
                          </td>
                          <td>
                            {d.postgraduate_students?.male?.toLocaleString() ||
                              "-"}
                          </td>
                          <td>
                            {d.postgraduate_students?.female?.toLocaleString() ||
                              "-"}
                          </td>
                          <td>
                            {d.phd_students?.total?.toLocaleString() || "-"}
                          </td>
                          <td>
                            {d.phd_students?.male?.toLocaleString() || "-"}
                          </td>
                          <td>
                            {d.phd_students?.female?.toLocaleString() || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Student History fallback (from normalized.json) */}
            {studentDemographics.length === 0 &&
              collegeData.student_history
                ?.student_count_comparison_last_3_years &&
              collegeData.student_history.student_count_comparison_last_3_years
                .length > 0 && (
                <section className="content-section">
                  <h2 className="section-title">
                     Student Enrollment Trends
                  </h2>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Total Enrolled</th>
                        <th>UG</th>
                        <th>PG</th>
                        <th>PhD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collegeData.student_history.student_count_comparison_last_3_years.map(
                        (entry, idx) => (
                          <tr key={idx}>
                            <td>{entry.year}</td>
                            <td>
                              {entry.total_enrolled
                                ? entry.total_enrolled.toLocaleString()
                                : "-"}
                            </td>
                            <td>
                              {entry.ug ? entry.ug.toLocaleString() : "-"}
                            </td>
                            <td>
                              {entry.pg ? entry.pg.toLocaleString() : "-"}
                            </td>
                            <td>
                              {entry.phd ? entry.phd.toLocaleString() : "-"}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </section>
              )}

            {/* Legacy StudentStatistics */}
            <StudentStatistics
              studentHistory={collegeData.student_history}
              collegeName={collegeData.college_name}
            />

            {/* Gender Distribution Chart */}
            <section className="content-section">
              <h2 className="section-title"> Gender Distribution</h2>
              <div className="charts-grid">
                <div className="chart-card">
                  <h3>
                    Gender Distribution{genderRatio3Yr ? " (3-yr avg)" : ""}
                  </h3>
                  <div className="chart-wrapper">
                    <canvas id="genderChart"></canvas>
                    <div className="chart-center-text">
                      <span className="center-value">
                        {(
                          genderRatio3Yr?.female_percentage ||
                          collegeData.student_history?.student_gender_ratio
                            ?.female_percent ||
                          collegeData.student_gender_ratio?.female_percentage ||
                          0
                        ).toFixed(1)}
                        %
                      </span>
                      <span className="center-label">Female</span>
                    </div>
                  </div>
                  <div className="chart-legend">
                    <span className="legend-item">
                      <span className="dot male"></span> Male (
                      {(
                        genderRatio3Yr?.male_percentage ||
                        collegeData.student_history?.student_gender_ratio
                          ?.male_percent ||
                        collegeData.student_gender_ratio?.male_percentage ||
                        0
                      ).toFixed(1)}
                      %)
                    </span>
                    <span className="legend-item">
                      <span className="dot female"></span> Female (
                      {(
                        genderRatio3Yr?.female_percentage ||
                        collegeData.student_history?.student_gender_ratio
                          ?.female_percent ||
                        collegeData.student_gender_ratio?.female_percentage ||
                        0
                      ).toFixed(1)}
                      %)
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Faculty & Staff */}
            {collegeData.faculty_staff_detail &&
              (collegeData.faculty_staff_detail.total_faculty > 0 ||
                collegeData.faculty_staff_detail.student_faculty_ratio > 0) && (
                <section className="content-section">
                  <h2 className="section-title">‍ Faculty & Staff</h2>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Detail</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {collegeData.faculty_staff_detail.total_faculty ? (
                        <tr>
                          <td>Total Faculty</td>
                          <td>
                            {collegeData.faculty_staff_detail.total_faculty.toLocaleString()}
                          </td>
                        </tr>
                      ) : null}
                      {collegeData.faculty_staff_detail
                        .student_faculty_ratio ? (
                        <tr>
                          <td>Student : Faculty Ratio</td>
                          <td>
                            {
                              collegeData.faculty_staff_detail
                                .student_faculty_ratio
                            }
                            :1
                          </td>
                        </tr>
                      ) : null}
                      {collegeData.faculty_staff_detail.phd_faculty_percent ? (
                        <tr>
                          <td>PhD Faculty</td>
                          <td>
                            {
                              collegeData.faculty_staff_detail
                                .phd_faculty_percent
                            }
                            %
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </section>
              )}

            {/* Contact Info */}
            {collegeData.contact_info &&
              (isRealValue(collegeData.contact_info.phone) ||
                isRealValue(collegeData.contact_info.email) ||
                isRealValue(collegeData.contact_info.address)) && (
                <section className="content-section">
                  <h2 className="section-title"> Contact Information</h2>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isRealValue(collegeData.contact_info.phone) ? (
                        <tr>
                          <td>Phone</td>
                          <td>{collegeData.contact_info.phone}</td>
                        </tr>
                      ) : null}
                      {isRealValue(collegeData.contact_info.email) ? (
                        <tr>
                          <td>Email</td>
                          <td>
                            <a
                              href={`mailto:${collegeData.contact_info.email}`}
                            >
                              {collegeData.contact_info.email}
                            </a>
                          </td>
                        </tr>
                      ) : null}
                      {isRealValue(collegeData.contact_info.address) ? (
                        <tr>
                          <td>Address</td>
                          <td>{collegeData.contact_info.address}</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </section>
              )}

            {/* Legacy additional_details fallback */}
            {(!collegeData.rankings ||
              !Object.values(collegeData.rankings).some((v) => v)) &&
              collegeData.additional_details?.length > 0 && (
                <section className="content-section">
                  <h2 className="section-title"> Additional Details</h2>
                  <div className="details-grid">
                    {collegeData.additional_details.map((detail, idx) => (
                      <div className="detail-card" key={idx}>
                        <span className="detail-label">{detail.category}</span>
                        <span className="detail-value">
                          {formatValue(detail.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}
          </div>
        )}

        {/* 
                    RANKINGS TAB
                 */}
        {activeTab === "rankings" && (
          <div
            className="tab-content"
            style={{ display: "flex", flexDirection: "column", gap: 32 }}
          >
            {/*  1. Ranking History  */}
            <section className="content-section">
              <h2 className="section-title">
                <Trophy
                  className="section-title-icon"
                  style={{
                    display: "inline-block",
                    marginRight: "8px",
                    verticalAlign: "middle",
                    width: "24px",
                    height: "24px",
                    color: "var(--primary)",
                  }}
                />
                Ranking History
              </h2>
              {derivedRankingHistory5Year.length > 0 ? (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Ranking Body</th>
                      <th>Category</th>
                      <th>Rank / Band</th>
                      <th>Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {derivedRankingHistory5Year.map((r: any, idx: number) => (
                      <tr key={idx}>
                        <td>{r.year}</td>
                        <td
                          style={{
                            fontWeight: "700",
                            color: "var(--secondary)",
                          }}
                        >
                          {r.ranking_body}
                        </td>
                        <td>{r.ranking_category || "Overall"}</td>
                        <td
                          style={{ color: "var(--primary)", fontWeight: "700" }}
                        >
                          {r.rank
                            ? `#${r.rank}`
                            : r.rank_band
                              ? `Band: ${r.rank_band}`
                              : "-"}
                        </td>
                        <td>{r.score || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div
                  style={{
                    color: "var(--text-muted)",
                    textAlign: "center",
                    padding: "24px 0",
                  }}
                >
                  No ranking history available for this institution.
                </div>
              )}
            </section>

            {/*  2. Ranking Breakdown  */}
            {derivedRankingBreakdown && (
              <section className="content-section">
                <h2 className="section-title">
                  <Award
                    className="section-title-icon"
                    style={{
                      display: "inline-block",
                      marginRight: "8px",
                      verticalAlign: "middle",
                      width: "24px",
                      height: "24px",
                      color: "var(--primary)",
                    }}
                  />
                  Ranking Breakdown
                </h2>

                <div className="stat-card-grid">
                  {/* Card 1: NIRF */}
                  {derivedRankingBreakdown.nirf_rank_card && (
                    <div
                      className="placement-card"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                        color: "white",
                      }}
                    >
                      <Flame
                        className="placement-icon"
                        style={{
                          width: "36px",
                          height: "36px",
                          margin: "0 auto 10px auto",
                          color: "white",
                        }}
                      />
                      <span
                        className="placement-value"
                        style={{ color: "white" }}
                      >
                        {derivedRankingBreakdown.nirf_rank_card}
                      </span>
                      <span
                        className="placement-label"
                        style={{ color: "rgba(255,255,255,0.9)" }}
                      >
                        {derivedRankingBreakdown.nirf_desc || "NIRF Standing"}
                      </span>
                    </div>
                  )}

                  {/* Card 2: Accreditation Grade */}
                  {derivedRankingBreakdown.naac_grade_card && (
                    <div
                      className="placement-card"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--secondary) 0%, #1e1b76 100%)",
                        color: "white",
                      }}
                    >
                      <Award
                        className="placement-icon"
                        style={{
                          width: "36px",
                          height: "36px",
                          margin: "0 auto 10px auto",
                          color: "white",
                        }}
                      />
                      <span
                        className="placement-value"
                        style={{ color: "white" }}
                      >
                        {derivedRankingBreakdown.naac_grade_card}
                      </span>
                      <span
                        className="placement-label"
                        style={{ color: "rgba(255,255,255,0.9)" }}
                      >
                        Accreditation Grade
                      </span>
                    </div>
                  )}

                  {/* Card 3: Top Rank */}
                  {derivedRankingBreakdown.top_institution_card && (
                    <div
                      className="placement-card"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)",
                        color: "white",
                      }}
                    >
                      <Trophy
                        className="placement-icon"
                        style={{
                          width: "36px",
                          height: "36px",
                          margin: "0 auto 10px auto",
                          color: "white",
                        }}
                      />
                      <span
                        className="placement-value"
                        style={{ color: "white" }}
                      >
                        {derivedRankingBreakdown.top_institution_card}
                      </span>
                      <span
                        className="placement-label"
                        style={{ color: "rgba(255,255,255,0.9)" }}
                      >
                        Institution Cluster
                      </span>
                    </div>
                  )}
                </div>

                {/* Subject Department Standings */}
                {derivedRankingBreakdown.subject_rankings &&
                  derivedRankingBreakdown.subject_rankings.length > 0 && (
                    <div
                      className="stat-card-grid"
                      style={{ marginTop: "20px" }}
                    >
                      {derivedRankingBreakdown.subject_rankings.map(
                        (s: any, idx: number) => (
                          <div key={idx} className="placement-card">
                            <Medal
                              className="placement-icon"
                              style={{
                                width: "32px",
                                height: "32px",
                                margin: "0 auto 10px auto",
                                color: "var(--primary)",
                              }}
                            />
                            <span className="placement-value">{s.rank}</span>
                            <span className="placement-label">{s.subject}</span>
                          </div>
                        ),
                      )}
                    </div>
                  )}
              </section>
            )}

            {/*  3. Ranking Trend (Last 3 Years)  */}
            {allNirfTrend.length > 0 && (
              <section className="content-section">
                <h2 className="section-title">
                  <TrendingUp
                    className="section-title-icon"
                    style={{
                      display: "inline-block",
                      marginRight: "8px",
                      verticalAlign: "middle",
                      width: "24px",
                      height: "24px",
                      color: "var(--primary)",
                    }}
                  />
                  Ranking Trend ({primaryCategory} - Last 3 Years)
                </h2>
                <div className="chart-card">
                  <div className="chart-wrapper-bar">
                    <RankingComparisonChart
                      data={allNirfTrend.slice(-3)}
                      animate={true}
                      title={`NIRF ${primaryCategory} Rankings`}
                    />
                  </div>
                </div>
              </section>
            )}

            {/*  4. Accrediting Bodies & International Rankings  */}
            {liveAccredBodies.length > 0 && (
              <section className="content-section">
                <h2 className="section-title">
                  <ShieldCheck
                    className="section-title-icon"
                    style={{
                      display: "inline-block",
                      marginRight: "8px",
                      verticalAlign: "middle",
                      width: "24px",
                      height: "24px",
                      color: "var(--primary)",
                    }}
                  />
                  Accrediting Bodies & International Rankings
                </h2>
                <div className="details-grid">
                  {liveAccredBodies.map((b: any, i: number) => (
                    <div
                      key={i}
                      className="detail-card"
                      style={{ borderTop: `4px solid ${b.color}` }}
                    >
                      <span
                        style={{
                          fontWeight: "800",
                          fontSize: "16px",
                          color: b.color,
                        }}
                      >
                        {b.name}
                      </span>
                      <span
                        className="detail-value"
                        style={{ fontSize: "15px", color: "var(--secondary)" }}
                      >
                        {b.label}
                      </span>
                      <span className="detail-label">{b.desc}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/*  5. Department Rankings  */}
            {departmentRankings.length > 0 && (
              <section className="content-section">
                <h2 className="section-title">
                  <Medal
                    className="section-title-icon"
                    style={{
                      display: "inline-block",
                      marginRight: "8px",
                      verticalAlign: "middle",
                      width: "24px",
                      height: "24px",
                      color: "var(--primary)",
                    }}
                  />
                  Department Rankings
                </h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Ranking</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentRankings.map((d: any, idx: number) => (
                      <tr key={idx}>
                        <td>{d.department}</td>
                        <td
                          style={{ color: "var(--primary)", fontWeight: "700" }}
                        >
                          {d.ranking}
                        </td>
                        <td style={{ color: "#16a34a", fontWeight: "700" }}>
                          {d.grade}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/*  6. Research Contribution & Faculty Quality Rankings  */}
            {researchContribution.length > 0 && (
              <section className="content-section">
                <h2 className="section-title">
                  <Award
                    className="section-title-icon"
                    style={{
                      display: "inline-block",
                      marginRight: "8px",
                      verticalAlign: "middle",
                      width: "24px",
                      height: "24px",
                      color: "var(--primary)",
                    }}
                  />
                  Research Contribution & Faculty Quality Rankings
                </h2>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Publications</th>
                      <th>Citations</th>
                      <th>Full-time PhD Faculty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {researchContribution.map((r: any, idx: number) => (
                      <tr key={idx}>
                        <td>{r.year}</td>
                        <td>{r.publications}</td>
                        <td>{r.citations}</td>
                        <td style={{ color: "#16a34a", fontWeight: "700" }}>
                          {r.phd_faculty_percent}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/*  7. Data Sources  */}
            {dataSources.length > 0 && (
              <section className="sources-section">
                <h2 className="section-title">
                  <ShieldCheck
                    className="section-title-icon"
                    style={{
                      display: "inline-block",
                      marginRight: "8px",
                      verticalAlign: "middle",
                      width: "24px",
                      height: "24px",
                      color: "var(--primary)",
                    }}
                  />
                  Data Sources
                </h2>
                <div className="sources-list">
                  {dataSources.map((s: any, idx: number) => (
                    <a
                      key={idx}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="source-link"
                    >
                       {s.title}
                    </a>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 
                    PROGRAMS TAB
                 */}
        {activeTab === "programs" && (
          <ProgramsTab
            college={collegeData}
            ugCourses={ugCourses}
            pgCourses={pgCourses}
            phdCourses={phdCourses}
            onlineCourses={onlineCourses}
            additionalCourses={additionalCourses}
          />
        )}

        {/* 
                    ADMISSIONS TAB
                 */}
        {activeTab === "admissions" && (
          <AdmissionsTab admissions={admissions} college={collegeData} />
        )}

        {/* 
                    DEPARTMENTS TAB
                 */}
        {activeTab === "departments" && (
          <DepartmentsTab
            college={collegeData as any}
            richDepartments={richDepartments}
          />
        )}

        {/* 
                    PLACEMENTS TAB
                 */}
        {activeTab === "placements" && (
          <div className="tab-content">
            {/* Rich placement stats from placements_statistics.json */}
            {newPlacementStats.length > 0 && (
              <section className="content-section">
                <h2 className="section-title">
                   Placement Statistics (3-Year)
                </h2>
                <div style={{ overflowX: "auto" }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Year</th>
                        <th>Students Placed</th>
                        <th>Total Graduating</th>
                        <th>Placement Rate</th>
                        <th>Median Package</th>
                        <th>Average Package</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newPlacementStats.map((p, idx) => {
                        const placementsCurrency =
                          collegeData?.placements?.package_currency || "INR";
                        const rate =
                          p.total_graduating_students > 0
                            ? (
                                (p.students_placed /
                                  p.total_graduating_students) *
                                100
                              ).toFixed(1)
                            : null;
                        return (
                          <tr key={idx}>
                            <td>{p.year}</td>
                            <td>
                              {p.students_placed?.toLocaleString() || "-"}
                            </td>
                            <td>
                              {p.total_graduating_students?.toLocaleString() ||
                                "-"}
                            </td>
                            <td>{rate ? `${rate}%` : "-"}</td>
                            <td>
                              {p.median_package
                                ? formatPackage(
                                    p.median_package,
                                    p.currency || placementsCurrency,
                                  )
                                : p.median_package_inr
                                  ? formatPackage(p.median_package_inr, "INR")
                                  : "-"}
                            </td>
                            <td>
                              {p.average_package
                                ? formatPackage(
                                    p.average_package,
                                    p.currency || placementsCurrency,
                                  )
                                : p.average_package_inr
                                  ? formatPackage(p.average_package_inr, "INR")
                                  : "-"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Legacy PlacementStatistics component */}
            <PlacementStatistics
              placements={
                {
                  ...(collegeData.placements || {}),
                  placement_comparison_last_3_years:
                    collegeData.placement_comparison_last_3_years,
                  top_recruiters: collegeData.top_recruiters,
                  sector_wise_placement_last_3_years:
                    collegeData.sector_wise_placement_last_3_years,
                  gender_based_placement_last_3_years:
                    collegeData.gender_based_placement_last_3_years,
                  placement_highlights: collegeData.placement_highlights,
                } as any
              }
              country={collegeData.country}
            />
          </div>
        )}

        {/* 
                    FEES TAB
                 */}
        {activeTab === "fees" && (
          <div className="tab-content">
            <FeeStructure
              fees={collegeData.fees}
              website={collegeData.website}
              fees_by_year={collegeData.fees_by_year}
            />
          </div>
        )}

        {/* 
                    SCHOLARSHIPS TAB
                 */}
        {activeTab === "scholarships" && (
          <div className="tab-content">
            <Scholarships
              scholarshipItems={scholarshipItems}
              collegeName={collegeData.college_name}
              website={collegeData.website}
            />
          </div>
        )}

        {/* 
                    CAMPUS TAB
                 */}
        {activeTab === "campus" && (
          <div className="tab-content">
            {infraFacility ? (
              <>
                {/* Libraries */}
                {infraFacility.libraries?.length > 0 && (
                  <section className="content-section">
                    <h2 className="section-title"> Libraries</h2>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      {infraFacility.libraries.map((lib, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 14,
                            marginBottom: 6,
                            color: "#333",
                          }}
                        >
                          {lib}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Labs */}
                {infraFacility.labs?.length > 0 && (
                  <section className="content-section">
                    <h2 className="section-title"> Labs & Facilities</h2>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      {infraFacility.labs.map((lab, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 14,
                            marginBottom: 6,
                            color: "#333",
                          }}
                        >
                          {lab}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Sports */}
                {infraFacility.sports_facilities?.length > 0 && (
                  <section className="content-section">
                    <h2 className="section-title"> Sports Facilities</h2>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {infraFacility.sports_facilities.map((sf, i) => (
                        <span
                          key={i}
                          className="recruiter-chip"
                          style={{ fontSize: 13 }}
                        >
                          {sf}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Dining */}
                {infraFacility.dining_options?.length > 0 && (
                  <section className="content-section">
                    <h2 className="section-title"> Dining Options</h2>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      {infraFacility.dining_options.map((d, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: 14,
                            marginBottom: 6,
                            color: "#333",
                          }}
                        >
                          {d}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* Hostels */}
                {infraFacility.hostels?.length > 0 && (
                  <section className="content-section">
                    <h2 className="section-title">
                       Accommodation & Hostels
                    </h2>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 24,
                      }}
                    >
                      {infraFacility.hostels.map((hostel: any, i) => {
                        const allFacilities = [
                          ...(hostel.facilities || []),
                          ...(hostel.amenities || []),
                        ];
                        const hasNewSchema =
                          hostel.room_categories ||
                          hostel.operational_policies ||
                          hostel.housing_administration_contacts;

                        return (
                          <div
                            key={i}
                            className="facility-card"
                            style={{ padding: 24 }}
                          >
                            {/* Header */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: 12,
                                borderBottom: "1px solid #f1f5f9",
                                paddingBottom: 12,
                              }}
                            >
                              <div>
                                <h3
                                  style={{
                                    margin: 0,
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: "#0f172a",
                                  }}
                                >
                                  {hostel.name}
                                </h3>
                                {hostel.type && (
                                  <p
                                    style={{
                                      margin: "4px 0 0",
                                      fontSize: 13,
                                      color: "#64748b",
                                    }}
                                  >
                                    Type: {hostel.type}
                                  </p>
                                )}
                              </div>
                              {hostel.housing_administration_contacts && (
                                <div
                                  style={{
                                    textAlign: "right",
                                    fontSize: 13,
                                    color: "#475569",
                                  }}
                                >
                                  {hostel.housing_administration_contacts
                                    .primary_email && (
                                    <div>
                                      {" "}
                                      <a
                                        href={`mailto:${hostel.housing_administration_contacts.primary_email}`}
                                        style={{ color: "#3b82f6" }}
                                      >
                                        {
                                          hostel.housing_administration_contacts
                                            .primary_email
                                        }
                                      </a>
                                    </div>
                                  )}
                                  {hostel.housing_administration_contacts
                                    .residence_life_specialist_phone && (
                                    <div>
                                      {" "}
                                      {
                                        hostel.housing_administration_contacts
                                          .residence_life_specialist_phone
                                      }
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                            {/* Capacity or general description if old schema */}
                            {!hasNewSchema && hostel.capacity && (
                              <p
                                style={{
                                  fontSize: 13,
                                  margin: "0 0 12px",
                                  color: "#475569",
                                }}
                              >
                                <strong>Capacity:</strong>{" "}
                                {hostel.capacity.toLocaleString()} students
                              </p>
                            )}

                            {/* Room Categories */}
                            {hostel.room_categories &&
                              hostel.room_categories.length > 0 && (
                                <div style={{ marginBottom: 16 }}>
                                  <h4
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 600,
                                      color: "#1e293b",
                                      marginBottom: 8,
                                    }}
                                  >
                                     Room Categories & Layouts
                                  </h4>
                                  <div
                                    style={{
                                      display: "grid",
                                      gridTemplateColumns:
                                        "repeat(auto-fill, minmax(280px, 1fr))",
                                      gap: 12,
                                    }}
                                  >
                                    {hostel.room_categories.map(
                                      (room: any, rIdx: number) => {
                                        const feeVal =
                                          room.pricing_tiers_usd
                                            ?.on_campus_fall_spring_per_term;
                                        const feeStr =
                                          feeVal && feeVal !== "not_available"
                                            ? `$${feeVal.toLocaleString()} / term`
                                            : "-";
                                        return (
                                          <div
                                            key={rIdx}
                                            style={{
                                              background: "#f8fafc",
                                              border: "1px solid #e2e8f0",
                                              borderRadius: 8,
                                              padding: 12,
                                            }}
                                          >
                                            <div
                                              style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontWeight: 600,
                                                fontSize: 13,
                                                color: "#0f172a",
                                                marginBottom: 4,
                                              }}
                                            >
                                              <span>{room.type}</span>
                                              <span
                                                style={{ color: "#059669" }}
                                              >
                                                {feeStr}
                                              </span>
                                            </div>
                                            {room.layout_definition && (
                                              <p
                                                style={{
                                                  margin: 0,
                                                  fontSize: 12,
                                                  color: "#64748b",
                                                  lineHeight: 1.4,
                                                }}
                                              >
                                                {room.layout_definition}
                                              </p>
                                            )}
                                          </div>
                                        );
                                      },
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Policies */}
                            {hostel.operational_policies && (
                              <div
                                style={{
                                  marginBottom: 16,
                                  background: "#fffbeb",
                                  border: "1px solid #fef3c7",
                                  borderRadius: 8,
                                  padding: 12,
                                }}
                              >
                                <h4
                                  style={{
                                    fontSize: 14,
                                    fontWeight: 600,
                                    color: "#b45309",
                                    marginTop: 0,
                                    marginBottom: 8,
                                  }}
                                >
                                   Operational Policies
                                </h4>
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 6,
                                    fontSize: 12,
                                    color: "#78350f",
                                  }}
                                >
                                  {hostel.operational_policies
                                    .gender_segregation && (
                                    <div>
                                      <strong>Gender policy:</strong>{" "}
                                      {
                                        hostel.operational_policies
                                          .gender_segregation
                                      }
                                    </div>
                                  )}
                                  {hostel.operational_policies.curfew_hours && (
                                    <div>
                                      <strong>Curfew:</strong>{" "}
                                      {hostel.operational_policies.curfew_hours}
                                    </div>
                                  )}
                                  {hostel.operational_policies.pet_policy && (
                                    <div>
                                      <strong>Pet policy:</strong>{" "}
                                      {hostel.operational_policies.pet_policy}
                                    </div>
                                  )}
                                  {hostel.operational_policies
                                    .contraband_room_items &&
                                    hostel.operational_policies
                                      .contraband_room_items.length > 0 && (
                                      <div>
                                        <strong>Forbidden items:</strong>{" "}
                                        {hostel.operational_policies.contraband_room_items.join(
                                          ", ",
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>
                            )}

                            {/* Old schema Room Types */}
                            {!hasNewSchema &&
                              hostel.room_types &&
                              hostel.room_types.length > 0 && (
                                <div style={{ marginBottom: 12 }}>
                                  <p
                                    style={{
                                      fontSize: 12,
                                      margin: "0 0 4px",
                                      color: "#555",
                                      fontWeight: 600,
                                    }}
                                  >
                                    Room Types:
                                  </p>
                                  <div
                                    style={{
                                      display: "flex",
                                      flexWrap: "wrap",
                                      gap: 4,
                                    }}
                                  >
                                    {hostel.room_types.map(
                                      (rt: string, j: number) => (
                                        <span
                                          key={j}
                                          style={{
                                            fontSize: 11,
                                            background: "#f5f5f5",
                                            borderRadius: 4,
                                            padding: "2px 6px",
                                            color: "#555",
                                          }}
                                        >
                                          {rt}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Amenities / Facilities */}
                            {allFacilities.length > 0 && (
                              <div>
                                <p
                                  style={{
                                    fontSize: 12,
                                    margin: "0 0 6px",
                                    color: "#555",
                                    fontWeight: 600,
                                  }}
                                >
                                   Amenities & Facilities:
                                </p>
                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: 6,
                                  }}
                                >
                                  {allFacilities.map((f: string, j: number) => (
                                    <span
                                      key={j}
                                      className="recruiter-chip"
                                      style={{
                                        fontSize: 11,
                                        padding: "3px 8px",
                                      }}
                                    >
                                      {f}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Campus Essential Services */}
                {infraFacility.campus_essential_services &&
                  infraFacility.campus_essential_services.length > 0 && (
                    <section className="content-section">
                      <h2 className="section-title">
                         Campus Essential Services
                      </h2>
                      <ul style={{ paddingLeft: 20, margin: 0 }}>
                        {infraFacility.campus_essential_services.map(
                          (service: string, i: number) => (
                            <li
                              key={i}
                              style={{
                                fontSize: 14,
                                marginBottom: 6,
                                color: "#333",
                              }}
                            >
                              {service}
                            </li>
                          ),
                        )}
                      </ul>
                    </section>
                  )}

                {/* Student Visa and Residency Requirements */}
                {infraFacility.student_visa_and_residency_requirements && (
                  <section className="content-section">
                    <h2 className="section-title">
                       Student Visa & Residency Requirements
                    </h2>
                    <div className="facility-card" style={{ padding: 20 }}>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit, minmax(200px, 1fr))",
                          gap: 16,
                          marginBottom: 16,
                        }}
                      >
                        {infraFacility.student_visa_and_residency_requirements
                          .mandatory_medical_insurance_annual_usd && (
                          <div>
                            <span
                              style={{
                                fontSize: 12,
                                color: "#64748b",
                                display: "block",
                              }}
                            >
                              Annual Health Insurance Cost
                            </span>
                            <strong style={{ fontSize: 15, color: "#0f172a" }}>
                              $
                              {
                                infraFacility
                                  .student_visa_and_residency_requirements
                                  .mandatory_medical_insurance_annual_usd
                              }{" "}
                              USD
                            </strong>
                          </div>
                        )}
                        {infraFacility.student_visa_and_residency_requirements
                          .student_visa_processing_fee_usd && (
                          <div>
                            <span
                              style={{
                                fontSize: 12,
                                color: "#64748b",
                                display: "block",
                              }}
                            >
                              Visa Processing Fee
                            </span>
                            <strong style={{ fontSize: 15, color: "#0f172a" }}>
                              $
                              {
                                infraFacility
                                  .student_visa_and_residency_requirements
                                  .student_visa_processing_fee_usd
                              }{" "}
                              USD
                            </strong>
                          </div>
                        )}
                        {infraFacility.student_visa_and_residency_requirements
                          .refundable_housing_security_deposit_usd && (
                          <div>
                            <span
                              style={{
                                fontSize: 12,
                                color: "#64748b",
                                display: "block",
                              }}
                            >
                              Refundable Housing Deposit
                            </span>
                            <strong style={{ fontSize: 15, color: "#0f172a" }}>
                              $
                              {
                                infraFacility
                                  .student_visa_and_residency_requirements
                                  .refundable_housing_security_deposit_usd
                              }{" "}
                              USD
                            </strong>
                          </div>
                        )}
                      </div>

                      {infraFacility.student_visa_and_residency_requirements
                        .required_documentation &&
                        infraFacility.student_visa_and_residency_requirements
                          .required_documentation.length > 0 && (
                          <div>
                            <h4
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                color: "#1e293b",
                                marginTop: 0,
                                marginBottom: 8,
                              }}
                            >
                               Required Documentation:
                            </h4>
                            <ul
                              style={{
                                paddingLeft: 20,
                                margin: 0,
                                fontSize: 13,
                                color: "#475569",
                              }}
                            >
                              {infraFacility.student_visa_and_residency_requirements.required_documentation.map(
                                (doc: string, dIdx: number) => (
                                  <li key={dIdx} style={{ marginBottom: 4 }}>
                                    {doc}
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </section>
                )}
              </>
            ) : (
              <>
                {/* Fallback: legacy infrastructure table */}
                {collegeData.infrastructure &&
                  collegeData.infrastructure.length > 0 && (
                    <section className="content-section">
                      <h2 className="section-title"> Infrastructure</h2>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Facility</th>
                            <th>Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {collegeData.infrastructure.map((item: any, idx) => {
                            let facilityName = "";
                            let detailText = "";
                            if (typeof item === "string") {
                              const colonIdx = item.indexOf(":");
                              if (colonIdx !== -1) {
                                facilityName = item
                                  .substring(0, colonIdx)
                                  .trim();
                                detailText = item
                                  .substring(colonIdx + 1)
                                  .trim();
                              } else {
                                facilityName = item;
                                detailText = "-";
                              }
                            } else if (item && typeof item === "object") {
                              facilityName = item.facility || "";
                              detailText = item.details || "";
                            }
                            return (
                              <tr key={idx}>
                                <td>{facilityName || "-"}</td>
                                <td>{detailText || "-"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </section>
                  )}

                {(collegeData.hostel_details?.available ||
                  collegeData.library_details?.total_books ||
                  collegeData.transport_details?.buses) && (
                  <section className="content-section">
                    <h2 className="section-title"> Campus Facilities</h2>
                    <div className="facilities-grid">
                      {collegeData.hostel_details?.available && (
                        <div className="facility-card">
                          <h4> Hostel</h4>
                          <table className="data-table compact">
                            <tbody>
                              {collegeData.hostel_details.type ? (
                                <tr>
                                  <td>Type</td>
                                  <td>{collegeData.hostel_details.type}</td>
                                </tr>
                              ) : null}
                              {collegeData.hostel_details.boys_capacity ? (
                                <tr>
                                  <td>Boys Capacity</td>
                                  <td>
                                    {formatValue(
                                      collegeData.hostel_details.boys_capacity,
                                    )}
                                  </td>
                                </tr>
                              ) : null}
                              {collegeData.hostel_details.girls_capacity ? (
                                <tr>
                                  <td>Girls Capacity</td>
                                  <td>
                                    {formatValue(
                                      collegeData.hostel_details.girls_capacity,
                                    )}
                                  </td>
                                </tr>
                              ) : null}
                              {collegeData.hostel_details.total_capacity ? (
                                <tr>
                                  <td>Total Capacity</td>
                                  <td>
                                    {formatValue(
                                      collegeData.hostel_details.total_capacity,
                                    )}
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {collegeData.library_details?.total_books && (
                        <div className="facility-card">
                          <h4> Library</h4>
                          <table className="data-table compact">
                            <tbody>
                              {collegeData.library_details.total_books ? (
                                <tr>
                                  <td>Total Books</td>
                                  <td>
                                    {collegeData.library_details.total_books}
                                  </td>
                                </tr>
                              ) : null}
                              {collegeData.library_details.journals ? (
                                <tr>
                                  <td>Journals</td>
                                  <td>
                                    {collegeData.library_details.journals}
                                  </td>
                                </tr>
                              ) : null}
                              {collegeData.library_details.e_resources ? (
                                <tr>
                                  <td>E-Resources</td>
                                  <td>
                                    {collegeData.library_details.e_resources}
                                  </td>
                                </tr>
                              ) : null}
                              {collegeData.library_details.area_sqft ? (
                                <tr>
                                  <td>Area</td>
                                  <td>
                                    {collegeData.library_details.area_sqft} sq
                                    ft
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {collegeData.transport_details?.buses && (
                        <div className="facility-card">
                          <h4> Transport</h4>
                          <table className="data-table compact">
                            <tbody>
                              {collegeData.transport_details.buses ? (
                                <tr>
                                  <td>Buses</td>
                                  <td>{collegeData.transport_details.buses}</td>
                                </tr>
                              ) : null}
                              {collegeData.transport_details.routes ? (
                                <tr>
                                  <td>Routes</td>
                                  <td>
                                    {collegeData.transport_details.routes}
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                {!collegeData.infrastructure?.length &&
                  !collegeData.hostel_details?.available &&
                  !collegeData.library_details?.total_books &&
                  !collegeData.transport_details?.buses &&
                  !additionalInfo && (
                    <section className="content-section">
                      <h2 className="section-title"> Campus</h2>
                      <p className="no-data">
                        No campus/infrastructure data available
                      </p>
                    </section>
                  )}
              </>
            )}

            {additionalInfo && (
              <>
                {/* 1. Infrastructure & Facilities from additionalInfo */}
                {additionalInfo.infrastructure_and_facilities &&
                  additionalInfo.infrastructure_and_facilities.filter(
                    (x: any) => x && x !== "-1" && x !== -1,
                  ).length > 0 && (
                    <section className="content-section">
                      <h2 className="section-title">
                         Infrastructure & Facilities
                      </h2>
                      <ul style={{ paddingLeft: 20, margin: 0 }}>
                        {additionalInfo.infrastructure_and_facilities
                          .filter(
                            (inf: any) => inf && inf !== "-1" && inf !== -1,
                          )
                          .map((inf: string, i: number) => (
                            <li
                              key={i}
                              style={{
                                fontSize: 14,
                                marginBottom: 6,
                                color: "#333",
                              }}
                            >
                              {inf}
                            </li>
                          ))}
                      </ul>
                    </section>
                  )}

                {/* 2. Sports Facilities from additionalInfo */}
                {additionalInfo.sports_facilities &&
                  additionalInfo.sports_facilities.filter(
                    (x: any) => x && x !== "-1" && x !== -1,
                  ).length > 0 && (
                    <section className="content-section">
                      <h2 className="section-title"> Sports Facilities</h2>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                      >
                        {additionalInfo.sports_facilities
                          .filter((sf: any) => sf && sf !== "-1" && sf !== -1)
                          .map((sf: string, i: number) => (
                            <span
                              key={i}
                              className="recruiter-chip"
                              style={{ fontSize: 13 }}
                            >
                              {sf}
                            </span>
                          ))}
                      </div>
                    </section>
                  )}

                {/* 3. Hostels details from additionalInfo */}
                {additionalInfo.hostels &&
                  (additionalInfo.hostels.boys_hostel_available === true ||
                    additionalInfo.hostels.girls_hostel_available === true ||
                    (additionalInfo.hostels.details &&
                      additionalInfo.hostels.details !== "-1" &&
                      additionalInfo.hostels.details !== -1)) && (
                    <section className="content-section">
                      <h2 className="section-title">
                         Hostel Accommodation Details
                      </h2>
                      <div className="facility-card" style={{ padding: 16 }}>
                        <div
                          style={{
                            display: "flex",
                            gap: 12,
                            marginBottom: additionalInfo.hostels.details
                              ? 12
                              : 0,
                          }}
                        >
                          {additionalInfo.hostels.boys_hostel_available && (
                            <span
                              style={{
                                fontSize: 12,
                                background: "#e0f2fe",
                                color: "#0369a1",
                                borderRadius: 4,
                                padding: "3px 8px",
                                fontWeight: 600,
                              }}
                            >
                               Boys Hostel Available
                            </span>
                          )}
                          {additionalInfo.hostels.girls_hostel_available && (
                            <span
                              style={{
                                fontSize: 12,
                                background: "#fce7f3",
                                color: "#be185d",
                                borderRadius: 4,
                                padding: "3px 8px",
                                fontWeight: 600,
                              }}
                            >
                               Girls Hostel Available
                            </span>
                          )}
                        </div>
                        {additionalInfo.hostels.details &&
                          additionalInfo.hostels.details !== "-1" &&
                          additionalInfo.hostels.details !== -1 && (
                            <p
                              style={{
                                fontSize: 14,
                                margin: 0,
                                color: "#333",
                                lineHeight: "1.5",
                              }}
                            >
                              {additionalInfo.hostels.details}
                            </p>
                          )}
                      </div>
                    </section>
                  )}

                {/* 4. Clubs & Committees from additionalInfo */}
                {additionalInfo.clubs_and_committees &&
                  additionalInfo.clubs_and_committees.filter(
                    (x: any) => x && x !== "-1" && x !== -1,
                  ).length > 0 && (
                    <section className="content-section">
                      <h2 className="section-title"> Clubs & Committees</h2>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                      >
                        {additionalInfo.clubs_and_committees
                          .filter(
                            (club: any) => club && club !== "-1" && club !== -1,
                          )
                          .map((club: string, i: number) => (
                            <span
                              key={i}
                              className="recruiter-chip"
                              style={{
                                fontSize: 13,
                                background: "#f3f4f6",
                                color: "#374151",
                              }}
                            >
                              {club}
                            </span>
                          ))}
                      </div>
                    </section>
                  )}

                {/* 5. Fests & Events from additionalInfo */}
                {additionalInfo.fests_and_events &&
                  additionalInfo.fests_and_events.filter(
                    (x: any) => x && x !== "-1" && x !== -1,
                  ).length > 0 && (
                    <section className="content-section">
                      <h2 className="section-title">
                         Campus Fests & Events
                      </h2>
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
                      >
                        {additionalInfo.fests_and_events
                          .filter(
                            (fest: any) => fest && fest !== "-1" && fest !== -1,
                          )
                          .map((fest: string, i: number) => (
                            <span
                              key={i}
                              className="recruiter-chip"
                              style={{
                                fontSize: 13,
                                background: "#fef3c7",
                                color: "#92400e",
                              }}
                            >
                              {fest}
                            </span>
                          ))}
                      </div>
                    </section>
                  )}

                {/* 6. Notable Alumni from additionalInfo */}
                {additionalInfo.notable_alumni &&
                  additionalInfo.notable_alumni.filter(
                    (x: any) => x && x.name && x.name !== "-1" && x.name !== -1,
                  ).length > 0 && (
                    <section className="content-section">
                      <h2 className="section-title"> Notable Alumni</h2>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fill, minmax(280px, 1fr))",
                          gap: 12,
                        }}
                      >
                        {additionalInfo.notable_alumni
                          .filter(
                            (alumni: any) =>
                              alumni &&
                              alumni.name &&
                              alumni.name !== "-1" &&
                              alumni.name !== -1,
                          )
                          .map((alumni: any, i: number) => (
                            <div
                              key={i}
                              className="facility-card"
                              style={{
                                padding: 12,
                                display: "flex",
                                flexDirection: "column",
                                gap: 4,
                              }}
                            >
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: "#111827",
                                }}
                              >
                                {alumni.name}
                              </h4>
                              {alumni.designation_or_company &&
                                alumni.designation_or_company !== "-1" &&
                                alumni.designation_or_company !== -1 && (
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: 12,
                                      color: "#4b5563",
                                    }}
                                  >
                                    {alumni.designation_or_company}
                                  </p>
                                )}
                            </div>
                          ))}
                      </div>
                    </section>
                  )}
              </>
            )}
          </div>
        )}

        {/* 
                    EVENTS TAB
                 */}
        {activeTab === "events" && (
          <div className="tab-content">
            <section className="content-section">
              <h2 className="section-title"> Events & Activities</h2>
              {eventsList.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 16,
                  }}
                >
                  {eventsList.map((ev, idx) => {
                    const typeBg = ev.type?.toLowerCase().includes("cultural")
                      ? "#fef3c7"
                      : ev.type?.toLowerCase().includes("sport")
                        ? "#dcfce7"
                        : "#e0f2fe";
                    const typeColor = ev.type
                      ?.toLowerCase()
                      .includes("cultural")
                      ? "#92400e"
                      : ev.type?.toLowerCase().includes("sport")
                        ? "#166534"
                        : "#0369a1";
                    const eventTitle = ev.title || ev.name || "Unnamed Event";
                    const eventDate =
                      ev.month_or_date || ev.start_date || ev.start_time;
                    return (
                      <div
                        key={ev.event_id || idx}
                        className="facility-card"
                        style={{
                          padding: 16,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                              marginBottom: 8,
                            }}
                          >
                            <h4
                              style={{
                                margin: 0,
                                fontSize: 15,
                                fontWeight: 600,
                                flex: 1,
                                color: "#070642",
                              }}
                            >
                              {eventTitle}
                            </h4>
                            {ev.type && (
                              <span
                                style={{
                                  fontSize: 11,
                                  background: typeBg,
                                  color: typeColor,
                                  borderRadius: 4,
                                  padding: "2px 7px",
                                  marginLeft: 8,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {ev.type}
                              </span>
                            )}
                          </div>
                          {ev.month_or_date &&
                          ev.month_or_date !== "not_available" ? (
                            <p
                              style={{
                                fontSize: 12,
                                margin: "0 0 6px",
                                color: "#666",
                              }}
                            >
                               {ev.month_or_date}
                            </p>
                          ) : ev.start_date || ev.start_time ? (
                            <p
                              style={{
                                fontSize: 12,
                                margin: "0 0 6px",
                                color: "#666",
                              }}
                            >
                              {" "}
                              {new Date(
                                ev.start_date || ev.start_time || "",
                              ).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </p>
                          ) : null}
                          {ev.description &&
                            ev.description !== "not_available" && (
                              <p
                                style={{
                                  fontSize: 13,
                                  margin: 0,
                                  color: "#444",
                                  lineHeight: 1.5,
                                }}
                              >
                                {ev.description}
                              </p>
                            )}
                        </div>
                        {ev.registration_link && (
                          <div style={{ marginTop: 12 }}>
                            <a
                              href={ev.registration_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 12,
                                color: "#0284c7",
                                textDecoration: "none",
                                fontWeight: "600",
                              }}
                            >
                               Register / Info
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="no-data">No events data available</p>
              )}
            </section>
          </div>
        )}

        {/* 
                    REVIEWS & FAQ TAB
                 */}
        {activeTab === "reviews" && (
          <div
            className="tab-content"
            style={{ display: "flex", flexDirection: "column", gap: 30 }}
          >
            {/* FAQs */}
            <section className="content-section">
              <h2 className="section-title"> Frequently Asked Questions</h2>
              {faqList.length > 0 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {faqList.map((faq, idx) => (
                    <div
                      key={faq.faq_id || idx}
                      className="facility-card"
                      style={{
                        padding: "24px 28px",
                        borderRadius: 12,
                        borderLeft: "4px solid var(--primary)",
                      }}
                    >
                      <h4
                        style={{
                          margin: "0 0 10px 0",
                          fontSize: 16,
                          fontWeight: 700,
                          color: "var(--secondary)",
                        }}
                      >
                        Q: {faq.question}
                      </h4>
                      <p
                        style={{
                          fontSize: 14,
                          margin: 0,
                          color: "#475569",
                          lineHeight: 1.7,
                        }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">
                  No FAQs available for this institution
                </p>
              )}
            </section>

            {/* Student Reviews */}
            <section className="content-section">
              <h2 className="section-title"> Student Reviews & Feedback</h2>
              {reviewsList.length > 0 ? (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 16 }}
                >
                  {reviewsList.map((rev, idx) => (
                    <div
                      key={rev.review_id || idx}
                      className="facility-card"
                      style={{ padding: 20 }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 10,
                        }}
                      >
                        <h4
                          style={{
                            margin: 0,
                            fontSize: 16,
                            fontWeight: 600,
                            color: "#1e293b",
                          }}
                        >
                          {" "}
                          {rev.author ||
                            rev.reviewer_name ||
                            "Anonymous Student"}
                        </h4>
                        {(rev.rating || rev.review_rating) && (
                          <span
                            style={{
                              fontSize: 14,
                              color: "#eab308",
                              fontWeight: 600,
                            }}
                          >
                            {"".repeat(rev.rating || rev.review_rating)}
                          </span>
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 14,
                          margin: "0 0 12px",
                          color: "#334155",
                          lineHeight: 1.6,
                        }}
                      >
                        "{rev.comment || rev.review_text}"
                      </p>
                      {rev.date && (
                        <p
                          style={{ fontSize: 12, color: "#64748b", margin: 0 }}
                        >
                          Date: {rev.date}
                        </p>
                      )}
                      {rev.keywords && rev.keywords.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            marginTop: 10,
                          }}
                        >
                          {rev.keywords.map((kw: string, i: number) => (
                            <span
                              key={i}
                              className="recruiter-chip"
                              style={{
                                fontSize: 11,
                                background: "#f1f5f9",
                                color: "#475569",
                              }}
                            >
                              # {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-data">No reviews available</p>
              )}
            </section>
          </div>
        )}

        {/* 
                    ALUMNI TAB
                 */}
        {activeTab === "alumni" && (
          <div className="tab-content">
            <section className="content-section">
              <h2 className="section-title">
                 Notable Alumni & Famous Graduates
              </h2>
              {alumniList.length > 0 ? (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(280px, 1fr))",
                    gap: 20,
                  }}
                >
                  {alumniList.map((alm, idx) => (
                    <div
                      key={alm.alumni_id || idx}
                      className="facility-card"
                      style={{
                        padding: 24,
                        borderRadius: 12,
                        borderTop: "4px solid var(--secondary)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: 18,
                          fontWeight: 700,
                          color: "var(--secondary)",
                        }}
                      >
                         {alm.name}
                      </h4>
                      {alm.graduation_year && (
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--primary)",
                            fontWeight: 600,
                          }}
                        >
                          Class of {alm.graduation_year}
                        </span>
                      )}
                      <p
                        style={{
                          fontSize: 14,
                          margin: 0,
                          color: "#475569",
                          lineHeight: 1.6,
                        }}
                      >
                        {alm.notability ||
                          alm.description ||
                          "Distinguished Alumnus"}
                      </p>
                      {alm.keywords && alm.keywords.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: 6,
                            marginTop: 10,
                          }}
                        >
                          {alm.keywords.map((kw: string, i: number) => (
                            <span
                              key={i}
                              className="recruiter-chip"
                              style={{
                                fontSize: 11,
                                background: "#f1f5f9",
                                color: "#475569",
                              }}
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (collegeData.student_history?.notable_faculty?.length ?? 0) >
                0 ? (
                <div>
                  <p className="no-data" style={{ marginBottom: 20 }}>
                    No direct alumni records available. Showing notable members
                    of the institution:
                  </p>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(280px, 1fr))",
                      gap: 20,
                    }}
                  >
                    {collegeData.student_history?.notable_faculty?.map(
                      (fac: any, idx: number) => (
                        <div
                          key={idx}
                          className="facility-card"
                          style={{ padding: 24 }}
                        >
                          <h4
                            style={{
                              margin: 0,
                              fontSize: 16,
                              fontWeight: 600,
                              color: "var(--secondary)",
                            }}
                          >
                             {fac}
                          </h4>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              ) : (
                <p className="no-data">
                  No alumni or legacy record found for this institution.
                </p>
              )}
            </section>
          </div>
        )}

        {/* 
                    ONLINE TAB (conditional — only shown when courses exist)
                 */}
        {activeTab === "online" && onlineCourses.length > 0 && (
          <div className="tab-content">
            <section className="content-section">
              <h2 className="section-title">
                 Online Courses ({onlineCourses.length})
              </h2>
              {(() => {
                const groups = groupByDepartment(onlineCourses);
                const deptKeys = Object.keys(groups);
                if (deptKeys.length > 1) {
                  return deptKeys.map((dept) => (
                    <div key={dept} style={{ marginBottom: 20 }}>
                      <h3
                        style={{
                          fontSize: 15,
                          color: "#333",
                          marginBottom: 8,
                          fontWeight: 600,
                        }}
                      >
                         {dept}
                      </h3>
                      <div className="programs-grid">
                        {groups[dept].map((c, i) => (
                          <CourseCard
                            key={c.course_id || i}
                            course={c}
                            level="Online"
                          />
                        ))}
                      </div>
                    </div>
                  ));
                }
                return (
                  <div className="programs-grid">
                    {onlineCourses.map((c, i) => (
                      <CourseCard
                        key={c.course_id || i}
                        course={c}
                        level="Online"
                      />
                    ))}
                  </div>
                );
              })()}
            </section>
          </div>
        )}

        {/* Data Sources */}
        {collegeData.sources && collegeData.sources.length > 0 && (
          <section className="content-section sources-section">
            <h2 className="section-title"> Data Sources</h2>
            <div className="sources-list">
              {collegeData.sources.map((source, idx) => (
                <a
                  key={idx}
                  href={source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-link"
                >
                  {source}
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      {/*  Footer  */}
      <footer className="page-footer">
        <button onClick={() => router.push("/")} className="back-home-btn">
          ← Return to Home
        </button>
      </footer>
    </div>
  );
}
