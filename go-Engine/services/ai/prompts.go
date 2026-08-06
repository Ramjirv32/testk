package ai

import "fmt"

const PHASE1_PROMPT = `You are a college data researcher specializing in accurate institutional statistics. Your task: find REAL, VERIFIED data for: %s

ACCURACY IS THE #1 PRIORITY. Follow these rules strictly:

1. SEARCH REQUIREMENT: You MUST prioritize the LATEST data (2026). Check:
   - Official 2026 Annual Reports / 2026 Fact Sheets
   - NIRF 2026/2025 Reports
   - Latest available enrollment data (2026 or 2025)
   - Official Enrollment Portals (Live Data)
2. DO NOT USE OLD DATA (2021-2022) IF LATER DATA EXISTS. If you see old numbers, DISCARD THEM and find the latest 2026/2025 numbers.
3. If 2026 data is absolutely not published yet, use 2025. NEVER default to 2022 or earlier.
4. If a field does not apply or is truly unavailable after deep search, use "N/A" for strings or null for numbers.
5. Return ONLY valid JSON.
6. INCLUDE a "sources_verified" array with URLs or document names used (e.g., ["Annual Report 2026", "NIRF 2026 Data"]).

CRITICAL — DATA CURRENCY RULE:
- Your target is the 2026 academic year. 
- You MUST verify if the university has updated its enrollment/staff/placement figures in the last 6 months.

Return this exact JSON structure with REAL LATEST values for this specific college:

{
  "college_name": "<official full name>",
  "short_name": "<common abbreviation>",
  "established": "<year as integer>",
  "institution_type": "<Private/Public/Deemed/Government>",
  "country": "<country>",
  "location": "<city, state>",
  "website": "<official URL>",
  "about": "<factual paragraph about this specific college>",
  "summary": "<2-3 sentence factual summary>",
  "rankings": {
    "nirf_2025": "<real rank number or N/A>",
    "nirf_2024": "<real rank number or N/A>",
    "qs_world": "<real rank or N/A>",
    "national_rank": "<real rank or N/A>",
    "state_rank": "<real rank or N/A>",
    "guessed_data": false
  },
  "student_statistics": {
    "total_enrollment": "<TOTAL students across all years — NOT annual intake>",
    "ug_students": "<total UG students across all 4 years>",
    "pg_students": "<total PG students across all 2 years>",
    "phd_students": "<total PhD scholars>",
    "annual_intake": "<new students admitted per year only>",
    "male_percent": "<percentage>",
    "female_percent": "<percentage>",
    "total_ug_courses": "<count of distinct UG programs offered>",
    "total_pg_courses": "<count of distinct PG programs offered>",
    "total_phd_courses": "<count of distinct PhD programs offered>",
    "guessed_data": false
  },
  "faculty_staff": {
    "total_faculty": "<number>",
    "student_faculty_ratio": "<ratio>",
    "phd_faculty_percent": "<percentage>",
    "guessed_data": false
  },
  "student_history": {
    "student_count_comparison_last_3_years": [
      {"year": 2026, "total_enrolled": "<total that year>", "ug": "<ug count>", "pg": "<pg count>", "phd": "<phd count>"},
      {"year": 2025, "total_enrolled": "<total>", "ug": "<ug>", "pg": "<pg>", "phd": "<phd>"},
      {"year": 2022, "total_enrolled": "<total>", "ug": "<ug>", "pg": "<pg>", "phd": "<phd>"}
    ],
    "international_students": {
      "total_count": "<number>",
      "countries_represented": ["<country1>", "<country2>"],
      "international_percent": "<percentage>"
    },
    "guessed_data": false
  },
  "accreditations": [
    {"body": "<accreditation body name>", "grade": "<grade/score>", "year": "<year awarded>"}
  ],
  "affiliations": ["<university affiliation>", "<other affiliations>"],
  "recognition": "<UGC/AICTE/other recognition details>",
  "campus_area": "<size in acres/sqft>",
  "contact_info": {
    "phone": "<official phone number>",
    "email": "<official email>",
    "address": "<full campus address>"
  },
  "sources_verified": ["<URL 1>", "<Document Name>"]
}

Remember: all placeholder descriptions above must be replaced with REAL INTEGER or FLOAT values (not strings). Only rankings and grades can be strings.
maek sur to give accraute correct data`

var PHASE2_SECTIONS = map[string]string{
	"basic_info": `For the college named '%COLLEGE_NAME%', located in %COUNTRY% (%LOCATION%), provide the latest verified institutional data for the 2026 academic year or the latest available year if 2026 data is not published. Return only valid JSON with the exact fields: college_name, short_name, established, institution_type, country, location, website, about, summary, rankings (nirf_latest, nirf_previous, qs_world, national_rank, state_rank, guessed_data), student_statistics (total_enrollment, ug_students, pg_students, phd_students, annual_intake, male_percent, female_percent, total_ug_courses, total_pg_courses, total_phd_courses, guessed_data), faculty_staff (total_faculty, student_faculty_ratio, phd_faculty_percent, guessed_data), student_history (student_count_comparison_last_3_years with 2026, 2025, 2022, international_students, guessed_data, categorywise_student_comparison_last_3_years: [{"year": "2026", "ug_students": integer, "pg_students": integer, "phd_students": integer, "international_students": integer, "domestic_students": integer, "male_students": integer, "female_students": integer}, {"year": "2025", "ug_students": integer, "pg_students": integer, "phd_students": integer, "international_students": integer, "domestic_students": integer, "male_students": integer, "female_students": integer}, {"year": "2022", "ug_students": integer, "pg_students": integer, "phd_students": integer, "international_students": integer, "domestic_students": integer, "male_students": integer, "female_students": integer}]), accreditations (body, grade, year), affiliations, recognition, campus_area, contact_info (phone, email, address), and sources_verified (array of URLs or document names). IMPORTANT: Find actual numerical values from official sources for 2026. For past years (2025=2026-1, 2022=2026-4), provide comparative data if available. Do not use -1 unless data is genuinely unavailable. Provide estimates based on similar institutions if exact data is not found, but mark as guessed_data: true. Do not add any extra text, only JSON.`,

	"programs_and_departments": `For %COLLEGE_NAME% in %COUNTRY% (%LOCATION%), search the official website, academic programs directory, and course listings to find all undergraduate degree programs (Bachelor's/B.Tech/B.A./B.Sc. programs), postgraduate degree programs (Master's/M.Tech/M.A./M.Sc./MBA programs offered), PhD/Doctoral programs as of 2026, and all academic departments. Return valid JSON with this format: {"ug_programs": ["program1", "program2", ...], "ug_count": number, "pg_programs": ["program1", "program2", ...], "pg_count": number, "phd_programs": ["program_name", ...], "phd_count": number, "departments": ["Department Name 1", "Department Name 2", ...], "departments_count": number, "source": "url or 'official website'", "guessed_data": false}. You can also infer programs based on faculty/departments listed on their site. Return an empty array if genuinely no data is available for that level. Include only real programs. Do not invent. Do not add any extra text, only JSON.`,

	"placements_and_fees": `For the college named '%COLLEGE_NAME%', located in %COUNTRY% (%LOCATION%), find the latest verified placement data and fee structure for 2026, 2025, and 2022. Return valid JSON with: {"guessed_data": false, "data_year": "2026", "sources": ["source URL or document name"], "placements": {"year": "2026", "highest_package": real_number, "average_package": real_number, "median_package": real_number, "package_currency": "LPA for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges", "placement_rate_percent": real_percent, "total_students_placed": integer, "total_companies_visited": integer, "graduate_outcomes_note": "factual note"}, "placement_comparison_last_3_years": [{"year": "2026", "average_package": real_number, "employment_rate_percent": real_percent, "package_currency": string}, {"year": "2025", "average_package": real_number, "employment_rate_percent": real_percent, "package_currency": string}, {"year": "2022", "average_package": real_number, "employment_rate_percent": real_percent, "package_currency": string}], "gender_based_placement_last_3_years": [{"year": "2026", "male_placed": integer, "female_placed": integer, "male_percent": real_percent, "female_percent": real_percent}], "sector_wise_placement_last_3_years": [{"year": "2026", "sector": "sector name", "companies": ["company names"], "percent": real_percent}], "top_recruiters": ["company names"], "placement_highlights": "2-3 sentence factual summary", "fees": {"UG": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "PG": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "PhD": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "hostel_per_year": real_number}, "fees_by_year": [{"year": "2026", "UG": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "PG": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "PhD": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "hostel_per_year": real_number}, {"year": "2025", "UG": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "PG": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "PhD": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "hostel_per_year": real_number}, {"year": "2022", "UG": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "PG": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "PhD": {"per_year": real_number, "total_course": real_number, "currency": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges"}, "hostel_per_year": real_number}], "fees_note": "2-3 sentence factual summary", "scholarships_detail": [{"name": "scholarship name", "amount": real_number, "currency_type": "INR for Indian colleges, USD for US colleges, GBP for UK colleges, AUD for Australian colleges", "eligibility": "eligibility criteria", "provider": "provider name"}]}. IMPORTANT: Find actual placement statistics and fee amounts from official sources for each year. Do not use -1 unless data is genuinely unavailable. Provide reasonable estimates based on similar institutions if exact data is not found, but mark as guessed_data: true. Always include currency_type field for all monetary values. Do not add any extra text, only JSON.`,

	"departments_enriched": `For the college named '%COLLEGE_NAME%' in %COUNTRY% (%LOCATION%), find detailed information about ALL academic departments as of 2026. Search the official website, department pages, faculty directories, and annual reports. Return valid JSON with this exact structure: {"departments": [{"unit_id": "DEP-001", "name": "Department Name", "slug": "department-name", "tier": "DEPARTMENT", "hod_name": "Head of Department full name", "established_year": integer (year department was established), "faculty_count": integer (total faculty members), "student_strength": integer (total students enrolled in this department)}, ...], "total_departments": integer, "source": "url or document name", "guessed_data": false}. CRITICAL: For each department, find the HEAD OF DEPARTMENT NAME, year department was established, COUNT of faculty members in that department, and TOTAL STUDENT enrollment in that department (across all years UG+PG+PhD in that department). If a field is not available, use null, never use "N/A" or -1. Do not invent HOD names. For established_year, search official records; if 2022 not found, leave null. For 2026, 2025, 2022 comparisons if available, include a "student_strength_history": [{"year": 2026, "count": integer}, {"year": 2025, "count": integer}, {"year": 2022, "count": integer}]. Return only valid JSON, no extra text.`,

	"admissions_enriched": `For the college named '%COLLEGE_NAME%' in %COUNTRY% (%LOCATION%), find comprehensive admission requirements and procedures for 2026. Search official admissions pages, prospectus, and FAQs. Return valid JSON with: {"standardized_tests": {"undergraduate": ["test name 1", "test name 2"], "postgraduate": ["test name 1"], "phd": ["test name 1"]}, "merit_criteria": {"undergraduate": {"stream1": {"marks_weight": numeric_percent, "entrance_exam_weight": numeric_percent, "counseling_weight": numeric_percent}, "stream2": {}}, "postgraduate": {"specialization1": {"academic_marks_weight": numeric_percent, "entrance_exam_weight": numeric_percent}, ...}}, "important_dates": [{"event": "Application Start", "date": "DD-MMM-YYYY", "description": "Optional description"}, {"event": "Application Deadline", "date": "DD-MMM-YYYY"}], "admission_process_steps": [{"step": 1, "title": "Online Application", "description": "Submit application form"}, {"step": 2, "title": "Document Verification", "description": "Submit documents"}], "mandatory_documents": ["10th Certificate", "12th Certificate", "Entrance Exam Score Card"], "additional_documents_pg": ["Bachelor's Degree Certificate", "Work Experience Letter (if applicable)"], "english_proficiency": {"ielts_min": numeric, "toefl_min": numeric, "duolingo_min": numeric, "pte_min": numeric}, "application_fee_inr": numeric (if applicable) or null, "application_fee_usd": numeric (if applicable) or null, "application_fee_gbp": numeric (if applicable) or null, "payment_methods": ["Online Transfer", "Debit Card", "Credit Card", "Bank Challan"], "general_requirements": "Factual paragraph about general admission eligibility", "official_links": {"official_website": "url", "admissions_page": "url", "application_portal": "url"}, "source": "url or document name", "guessed_data": false}. IMPORTANT: Search official admissions pages for entrance exam requirements (GATE, JEE, CAT, GMAT, etc.). Include merit weightage breakdown if published. For important_dates, include actual 2026 admission calendar dates if available. For English proficiency, search for international student requirements. Return only valid JSON, no extra text.`,

	"campus_facilities": `For the college named '%COLLEGE_NAME%' in %COUNTRY% (%LOCATION%), gather information about campus facilities available as of 2026. Search official website, prospectus, campus tour pages, and facilities guide. Return valid JSON with: {"hostel_details": {"total_hostels": integer or null, "total_capacity": integer or null, "boys_hostels": integer or null, "girls_hostels": integer or null, "hostel_fee_per_year": numeric or null, "currency": "INR/USD/GBP/AUD", "facilities": ["WiFi", "Mess", "Recreation Room"]}, "library_details": {"name": "Library Name", "total_books": integer or null, "digital_resources": ["E-Journals", "Online Databases"], "seating_capacity": integer or null, "operational_hours": "HH:MM - HH:MM", "special_collections": ["Rare Books", "Reference Collection"]}, "transport_details": {"shuttle_service_available": boolean, "shuttle_routes": ["Route 1", "Route 2"], "parking_available": boolean, "parking_capacity": integer or null, "nearby_public_transport": ["Bus Stop (distance)", "Railway Station (distance)"]}, "sports_facilities": {"indoor_courts": ["Badminton", "Squash", "Table Tennis"], "outdoor_grounds": ["Cricket Ground", "Football Field", "Tennis Courts"], "gym_available": boolean, "swimming_pool": boolean}, "medical_facilities": {"health_center": boolean, "doctors_available": integer or null, "ambulance_service": boolean, "emergency_contact": "phone number"}, "dining_facilities": {"central_mess": boolean, "cafeteria": boolean, "food_courts": integer or null, "special_diets_available": ["Vegetarian", "Vegan", "Jain"]}, "technology_infrastructure": {"wifi_coverage": "campus-wide or specific areas", "computer_labs": integer or null, "high_speed_internet": boolean, "smart_classrooms": integer or null}, "other_facilities": ["Auditorium", "Conference Halls", "Laboratories"], "campus_area_sqft": numeric or null, "green_spaces_acres": numeric or null, "source": "url or document name", "guessed_data": false}. IMPORTANT: Search for actual facility details; do not guess. If information unavailable, use null. Include realistic boolean values (true/false) for yes/no questions. Return only valid JSON, no extra text.`,

	"scholarships": `For the college named '%COLLEGE_NAME%' in %COUNTRY% (%LOCATION%), find all available scholarships and financial aid for 2026. Search official scholarship pages, financial aid office pages, and official prospectus. Return valid JSON with: {"scholarships": [{"name": "Scholarship Name", "amount": numeric or "full_tuition" or "partial", "currency": "INR/USD/GBP/AUD", "level": "UG/PG/PhD/All", "eligibility": "Concise eligibility criteria", "merit_based": boolean, "need_based": boolean, "provider": "Government/Institution/Corporate/NGO", "application_deadline": "DD-MMM-YYYY or Ongoing", "number_awarded_annually": integer or null, "renewable": boolean, "description": "2-3 sentence description"}], "total_scholarships": integer, "merit_based_count": integer, "need_based_count": integer, "total_awards_value_per_year_inr": numeric or null (for Indian colleges in INR), "total_awards_value_per_year_usd": numeric or null (for non-Indian colleges in USD), "financial_aid_office_contact": "email or phone", "scholarships_website": "url", "government_schemes_available": ["Scheme Name 1", "Scheme Name 2"], "corporate_tie_ups": ["Company Name 1", "Company Name 2"], "source": "url or document name", "guessed_data": false}. IMPORTANT: Find actual scholarship names, amounts, and eligibility. Search for: (1) Merit-based scholarships, (2) Need-based scholarships, (3) Government schemes (if India: FMGE, GATE scholarships), (4) Institutional scholarships, (5) Corporate partnerships. For "amount", use exact numbers if available; use descriptive terms only if exact amounts not published. If critical data not found, set guessed_data: true. Return only valid JSON, no extra text.`,

	"general": PHASE1_PROMPT,
}

func GetPhase1Prompt(collegeName string) string {
	return fmt.Sprintf(PHASE1_PROMPT, collegeName)
}

func GetPhase2Prompt(section string, collegeName string) string {
	if p, ok := PHASE2_SECTIONS[section]; ok {
		return fmt.Sprintf(p, collegeName)
	}
	return ""
}

// Support legacy getPrompt
func getPrompt(collegeName string) string {
	return GetPhase1Prompt(collegeName)
}
