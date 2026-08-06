package main

const PHASE1_PROMPT = `You are a precise university data extractor. Extract data for "{name}".

EXACTNESS RULES — READ CAREFULLY:
- NEVER round numbers. If enrollment is 85,018 → write 85018. If it is 12,347 → write 12347. NOT 85000 or 12000.
- NEVER approximate. Use the exact figure you know. If the real number is 4,978 write 4978, NOT 5000.
- If you do NOT know the exact figure → use "not_available". Do NOT guess or round.
- Rankings: exact integers only. No ranges like "601-650". If you know it exactly, write it. Else "not_available".
- Percentages: exact decimals if known (e.g. 42.3 not 42). Else "not_available".
- phd_students: ONLY doctoral/PhD research candidates. NOT all postgrad. Typically 500–4,000 for large universities.
- pg_students: taught/coursework masters ONLY. Do NOT include PhD here.
- total_enrollment = ug_students + pg_students + phd_students (must add up).
- NIRF rankings: Indian colleges only. Set "not_available" for all non-Indian colleges.
- NEVER use "not_applicable". Only "not_available" if genuinely unknown.
- No markdown fences. Return valid JSON only.

Return a single JSON object with these exact keys:

college_name: full official name
short_name: abbreviation or common name
established: founding year (integer)
institution_type: "Public" or "Private" or "Deemed" etc
location: "City, State/Region, Country"
country: country name
website: official URL
about: 2-3 factual sentences — founding, affiliations, global standing, notable strengths

rankings: object with keys:
  nirf_2025 (exact integer or "not_available"),
  nirf_2024 (exact integer or "not_available"),
  qs_world (exact integer or "not_available"),
  qs_asia (exact integer or "not_available"),
  the_world (exact integer or "not_available"),
  national_rank (exact integer or "not_available"),
  state_rank (exact integer or "not_available")

student_statistics: object with keys:
  total_enrollment (exact integer — total all students),
  ug_students (exact integer — UG only),
  pg_students (exact integer — taught masters only, NOT PhD),
  phd_students (exact integer — doctoral candidates only),
  annual_intake (exact integer — new admissions per year),
  male_percent (exact float — e.g. 42.3),
  female_percent (exact float — e.g. 57.7),
  total_ug_courses (exact integer — distinct UG programs offered),
  total_pg_courses (exact integer — distinct PG/masters programs offered),
  total_phd_courses (exact integer — distinct PhD programs offered)

faculty_staff: object with keys:
  total_faculty (exact integer),
  student_faculty_ratio (exact float e.g. 13.5),
  phd_faculty_percent (exact float — % of faculty with PhD)

departments: array of faculty/school/department names`

var PHASE2_SECTIONS = map[string]string{
	"programs": `You are a college programs expert. Using ONLY your verified training knowledge about "{name}", return a JSON object:
- total_ug_programs: integer — total number of UG programs offered (approximate is fine)
- total_pg_programs: integer — total number of PG programs offered
- total_phd_programs: integer — total number of PhD/doctoral programs
- ug_programs: top 10 most popular/notable UG programs — array of objects with keys: name, duration (e.g. "3 years"), seats (integer or null), fees_total_local (number or null)
- pg_programs: top 10 most popular/notable PG programs, same structure
- phd_programs: top 5 notable PhD programs — array of objects with keys: name, duration, seats

RULES:
- India: 4-year BE/BTech, 2-year ME/MTech. Europe/Australia: 3-year BSc/BA, 2-year MSc/MA.
- Only list programs you KNOW this college actually offers.
- Use "not_available" (never "not_applicable") for unknown totals.
No markdown fences. Return valid JSON only.`,

	"rankings_history": `You are a college rankings expert. Using ONLY your verified training knowledge about "{name}", return a JSON object:
- rankings_history: array of ranking entries for years 2021 to 2025 only, each object with keys: year (integer), ranking_body (string), rank (integer or string), category (e.g. "World", "Asia", "National", or subject name). Include QS, THE, ARWU, US News, national rankings only — maximum 20 entries total.
- global_ranking: object with keys qs_world, the_world, us_news_global, arwu, webometrics — most recent values, "not_available" if unknown

RULES: NEVER fabricate numbers. Max 20 entries in rankings_history. No markdown fences. Return valid JSON only.`,

	"placements": `You are a college employment/placement expert. Using ONLY your verified training knowledge about "{name}", return a JSON object:

For non-Indian colleges: use graduate employment rate, median salary in local currency. Provide best estimates if exact figures are unavailable — note them as estimates.
For Indian colleges: use placement rate, packages in LPA.

placements: object with keys:
  year (most recent available),
  highest_package, average_package, median_package,
  package_currency (e.g. "LPA", "AUD/year", "USD/year"),
  placement_rate_percent (Indian) or employment_rate_percent (non-Indian),
  total_students_placed, total_companies_visited,
  graduate_outcomes_note (text summary)

placement_comparison_last_3_years: array of 3 objects with keys: year, average_package, employment_rate_percent, package_currency
gender_based_placement_last_3_years: array of 3 objects with keys: year, male_placed, female_placed, male_percent, female_percent
sector_wise_placement_last_3_years: array of objects with keys: year, sector, companies, percent
top_recruiters: array of company names known to hire from this college
placement_highlights: detailed paragraph on graduate employment, salary ranges, top employers

RULE: NEVER use "not_applicable". Use "not_available" only if truly unknown.
No markdown fences. Return valid JSON only.`,

	"fees_infra": `You are a college fees and infrastructure expert. Using ONLY your verified training knowledge about "{name}", return a JSON object:

fees: object with keys UG (object: per_year, total_course, currency), PG (same), hostel_per_year
fees_note: explain domestic vs international fee differences, tuition-free status, or any important fee context
fees_by_year: array of objects with keys year, program_type, per_year_local, total_course_local, hostel_per_year_local, currency — for 2023-24, 2024-25, 2025-26
scholarships: array of objects with keys name, amount, eligibility, provider — only scholarships specifically available at THIS college
infrastructure: array of objects with keys facility, details
hostel_details: object with keys available, boys_capacity, girls_capacity, total_capacity, type
transport_details: object with keys buses, routes
library_details: object with keys total_books, journals, e_resources, area_sqft

RULES:
- Provide fees in local currency. Approximate ranges are acceptable — add an estimate note.
- NEVER use "not_applicable". Use "not_available" only if truly unknown.
- No double braces. Return clean JSON only, no markdown fences.`,

	"student_history": `You are a college statistics expert. Using ONLY your verified training knowledge about "{name}", return a JSON object:

student_count_comparison_last_3_years: array of 3 objects each with keys year, total_enrolled, ug, pg, phd — for years 2023, 2024, 2025
student_gender_ratio: object with keys total_male, total_female, male_percentage, female_percentage
international_students: object with keys total_count, countries_represented, international_percentage
notable_faculty: array of objects with keys name, designation, specialization — only real confirmed names
faculty_achievements: text summary of faculty recognition/awards or null

RULES: Provide best estimates if exact figures unavailable. NEVER use "not_applicable".
No markdown fences. Return valid JSON only.`,

	"identity_details": `You are a college information expert. Using ONLY your verified training knowledge about "{name}", return a JSON object:

accreditations: array of objects with keys body, grade, year — only confirmed accreditations
affiliations: array of confirmed membership organizations/networks/alliances
recognition: text describing government/ministry recognitions
campus_area: campus size e.g. "150 acres" or null if unknown
contact_info: object with keys phone, email, address
additional_details: array of notable verified facts about this college (history, achievements, firsts, records)

RULES: Only list confirmed facts. NEVER use "not_applicable". Return valid JSON only, no markdown fences.`,
}
