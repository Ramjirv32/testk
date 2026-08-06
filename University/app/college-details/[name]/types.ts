//  Shared types for college-details page 

export interface FeeGroup {
  per_year: string;
  total_course: string;
  currency: string;
}

export interface FeesInfo {
  UG: FeeGroup;
  PG: FeeGroup;
  hostel_per_year: string;
  ug_yearly_min?: number;
  ug_yearly_max?: number;
  pg_yearly_min?: number;
  pg_yearly_max?: number;
  phd_yearly_min?: number;
  phd_yearly_max?: number;
}

export interface FeesYearInfo {
  year: string;
  program_type: string;
  per_year_local: string;
  total_course_local: string;
  hostel_per_year_local: string;
  currency: string;
}

export interface GenderRatio {
  male_percentage: number;
  female_percentage: number;
}

export interface GenderRatioDetail {
  total_male: number;
  total_female: number;
  male_percent: number;
  female_percent: number;
}

export interface StatisticItem {
  category: string;
  value: any;
}

export interface CollegeRankings {
  nirf_2025?: any;
  nirf_2024?: any;
  qs_world?: any;
  qs_asia?: any;
  the_world?: any;
  national_rank?: any;
  state_rank?: any;
}

export interface StudentStatsDetail {
  total_enrollment?: number;
  ug_students?: number;
  pg_students?: number;
  phd_students?: number;
  annual_intake?: number;
  male_percent?: number;
  female_percent?: number;
  total_ug_courses?: number;
  total_pg_courses?: number;
  total_phd_courses?: number;
}

export interface FacultyStaffDetail {
  total_faculty: number;
  student_faculty_ratio: number;
  phd_faculty_percent: number;
}

export interface PlacementInfo {
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

export interface PlacementComp {
  year: number;
  average_package: number;
  employment_rate_percent: number;
  package_currency: string;
}

export interface GenderPlacement {
  year: number;
  male_placed: any;
  female_placed: any;
  male_percent: any;
  female_percent: any;
}

export interface SectorPlacement {
  year: number;
  sector: string;
  companies: string;
  percent: any;
}

export interface ScholarshipItem {
  name: string;
  amount: string;
  eligibility: string;
  provider: string;
}

export interface InfraItem {
  facility: string;
  details: string;
}

export interface HostelDetails {
  available: boolean;
  boys_capacity: any;
  girls_capacity: any;
  total_capacity: any;
  type: string;
}

export interface LibraryDetails {
  total_books: string;
  journals: string;
  e_resources: string;
  area_sqft: string;
}

export interface TransportDetails {
  buses: string;
  routes: string;
}

export interface StudentCountEntry {
  year: number;
  total_enrolled: number;
  ug: number;
  pg: number;
  phd: number;
}

export interface StudentHistory {
  student_count_comparison_last_3_years: StudentCountEntry[];
  student_gender_ratio: GenderRatioDetail;
  international_students: {
    total_count: number;
    countries_represented: string[];
    international_percent: number;
  };
  notable_faculty: { name: string; designation: string; specialization: string }[] | null;
  faculty_achievements: string;
}

export interface Accreditation {
  body: string;
  grade: any;
  year: any;
}

export interface ContactInfo {
  phone: string;
  email: string;
  address: string;
}

export interface CollegeData {
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

  scholarships?: string[];
  student_gender_ratio: GenderRatio;
  faculty_staff: number;
  international_students: number;
  global_ranking: string | { qs_world?: any; the_world?: any; us_news_global?: any; arwu?: any; webometrics?: any };
  departments: string[];
  student_statistics: StatisticItem[];
  additional_details: StatisticItem[];
  sources: string[];
  approval_status: string;
  validation_warnings?: string[];
}

//  Helpers 

const currencySymbols: { [key: string]: string } = {
  INR: '₹',
  USD: '$',
  GBP: '£',
  EUR: '€',
  TRY: '₺',
  AED: 'د.إ',
  MYR: 'RM',
  SAR: 'ر.س',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  JPY: '¥',
};

export const getCurrencySymbol = (currency: string): string => {
  if (!currency) return '₹';
  const upper = currency.toUpperCase().trim();
  return currencySymbols[upper] || currency;
};

export const formatValue = (val: any): string => {
  if (val === null || val === undefined || val === '' || val === 0) return '-';
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

export const convertToINR = (val: number, currency: string = 'INR', country: string = ''): number => {
  if (!val) return 0;
  const upper = currency ? currency.toUpperCase().trim() : 'INR';
  const countryUpper = country ? country.toUpperCase().trim() : '';

  const isUAE = countryUpper.includes('UAE') || countryUpper.includes('UNITED ARAB EMIRATES') || countryUpper.includes('DUBAI') || countryUpper.includes('ABU DHABI');
  const isNZ = countryUpper.includes('NEW ZEALAND') || countryUpper.includes('NZ');
  const isTurkey = countryUpper.includes('TURKEY') || countryUpper.includes('TURKIYE');
  const isRussia = countryUpper.includes('RUSSIA') || countryUpper.includes('RUB');
  const isJapan = countryUpper.includes('JAPAN');

  let actualLocalVal = val;
  let localCur = upper;

  if (isUAE) {
    localCur = 'AED';
    if (val > 0 && val < 200) {
      actualLocalVal = val * 100000;
    }
  } else if (isNZ) {
    localCur = 'NZD';
    if (val > 0 && val < 200) {
      actualLocalVal = val * 100000;
    }
  } else if (isTurkey) {
    localCur = 'TRY';
    if (val > 0 && val < 200) {
      actualLocalVal = val * 100000;
    }
  } else if (isRussia) {
    localCur = 'RUB';
    if (val > 0 && val < 200) {
      actualLocalVal = val * 100000;
    }
  } else if (isJapan) {
    localCur = 'JPY';
    if (val > 0 && val < 200) {
      actualLocalVal = val * 100000;
    }
  }

  // Handle case where INR is already scaled (e.g. 1.62 LPA instead of 162000)
  if (localCur === 'INR' || localCur === 'LPA') {
    if (val > 0 && val < 200) {
      return val * 100000;
    }
    return val;
  }

  let rate = 1.0;
  switch (localCur) {
    case 'AED': rate = 22.7; break;
    case 'NZD': rate = 51.0; break;
    case 'TRY': rate = 2.6; break;
    case 'RUB': rate = 0.95; break;
    case 'JPY': rate = 0.53; break;
    case 'USD': rate = 83.5; break;
    case 'GBP': rate = 106.0; break;
    case 'EUR': rate = 90.0; break;
    case 'AUD': rate = 55.5; break;
    case 'CAD': rate = 61.0; break;
    case 'SGD': rate = 61.8; break;
    case 'SAR': rate = 22.3; break;
    case 'CNY': rate = 11.5; break;
  }

  return actualLocalVal * rate;
};

export const formatPackage = (amount: number, currency: string = 'INR', country: string = ''): string => {
  if (!amount) return '-';
  const upper = currency.toUpperCase().trim();
  const sym = getCurrencySymbol(upper);
  if (upper === 'INR' || upper === 'LPA') {
    if (amount >= 100000) return `${sym}${(amount / 100000).toFixed(2)} LPA`;
    if (amount > 0 && amount < 200) return `${sym}${amount.toFixed(2)} LPA`;
    return `${sym}${amount.toLocaleString()}`;
  }
  
  let localStr = '';
  if (amount >= 1000000) {
    localStr = `${sym}${(amount / 1000000).toFixed(2)}M`;
  } else if (amount >= 1000) {
    localStr = `${sym}${(amount / 1000).toFixed(0)}K`;
  } else if (amount > 0 && amount < 200) {
    localStr = `${sym}${amount.toFixed(2)} Lakhs`;
  } else {
    localStr = `${sym}${amount.toLocaleString()}`;
  }

  const inrVal = convertToINR(amount, upper, country);
  if (inrVal > 0) {
    const lpaVal = (inrVal / 100000).toFixed(2);
    if (upper !== 'INR' && upper !== 'LPA') {
      return `${localStr} (₹${lpaVal} LPA)`;
    }
  }
  return localStr;
};

export const formatCurrency = (amount: any, currency: string = 'INR', country: string = ''): string => {
  if (!amount) return 'N/A';
  if (typeof amount === 'string') return amount;
  if (typeof amount === 'number') {
    const upper = currency.toUpperCase().trim();
    const sym = getCurrencySymbol(upper);
    if (upper === 'INR' || upper === 'LPA') {
      if (amount >= 100000) return `${sym}${(amount / 100000).toFixed(1)}L`;
      if (amount > 0 && amount < 200) return `${sym}${amount.toFixed(1)} LPA`;
    }
    if (amount >= 1000000) {
      return `${sym}${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
      return `${sym}${(amount / 1000).toFixed(0)}K`;
    }
    return `${sym}${amount.toLocaleString()}`;
  }
  return String(amount);
};

export const isRealRank = (v: any): boolean =>
  v !== null && v !== undefined && v !== '' && v !== 0 &&
  String(v).toLowerCase() !== 'n/a' &&
  String(v).toLowerCase() !== 'not applicable';

export const isRealValue = (v: any): boolean => {
  if (v === null || v === undefined) return false;
  const clean = String(v).trim().toLowerCase();
  return clean !== '' && !['n/a', 'na', 'null', 'none', 'undefined', '-', '-1', '-1.0'].includes(clean);
};

