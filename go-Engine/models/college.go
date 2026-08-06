package models

import "time"

type CollegeStats struct {
	CollegeName     string   `json:"college_name" bson:"college_name"`
	SearchAliases   []string `json:"search_aliases,omitempty" bson:"search_aliases,omitempty"`
	ShortName       string   `json:"short_name" bson:"short_name"`
	Established     int      `json:"established" bson:"established"`
	InstitutionType string   `json:"institution_type" bson:"institution_type"`
	Country         string   `json:"country" bson:"country"`
	About           string   `json:"about" bson:"about"`
	Location        string   `json:"location" bson:"location"`
	Website         string   `json:"website" bson:"website"`
	Summary         string   `json:"summary" bson:"summary"`
	UGPrograms      []string `json:"ug_programs" bson:"ug_programs"`
	PGPrograms      []string `json:"pg_programs" bson:"pg_programs"`
	PhDPrograms     []string `json:"phd_programs" bson:"phd_programs"`

	// Complex Structured Data
	Rankings            CollegeRankings    `json:"rankings" bson:"rankings"`
	RankingsHistory     []RankingEntry     `json:"rankings_history" bson:"rankings_history"`
	GlobalRankingObj    GlobalRanking      `json:"global_ranking" bson:"global_ranking"` // rename to avoid conflict with string
	StudentStatsDetail  StudentStatsDetail `json:"student_statistics_detail" bson:"student_statistics_detail"`
	FacultyStaffDetail  FacultyStaffDetail `json:"faculty_staff_detail" bson:"faculty_staff_detail"`
	Placements          PlacementInfo      `json:"placements" bson:"placements"`
	PlacementComparison []PlacementComp    `json:"placement_comparison_last_3_years" bson:"placement_comparison_last_3_years"`
	GenderPlacement     []GenderPlacement  `json:"gender_based_placement_last_3_years" bson:"gender_based_placement_last_3_years"`
	SectorPlacement     []SectorPlacement  `json:"sector_wise_placement_last_3_years" bson:"sector_wise_placement_last_3_years"`
	TopRecruiters       []string           `json:"top_recruiters" bson:"top_recruiters"`
	PlacementHighlights string             `json:"placement_highlights" bson:"placement_highlights"`

	Fees               FeesInfo          `json:"fees" bson:"fees"`
	FeesByYear         []FeesYearInfo    `json:"fees_by_year" bson:"fees_by_year"`
	FeesNote           string            `json:"fees_note" bson:"fees_note"`
	ScholarshipsDetail []ScholarshipItem `json:"scholarships_detail" bson:"scholarships_detail"`

	Infrastructure   []InfraItem      `json:"infrastructure" bson:"infrastructure"`
	HostelDetails    HostelDetails    `json:"hostel_details" bson:"hostel_details"`
	TransportDetails TransportDetails `json:"transport_details" bson:"transport_details"`
	LibraryDetails   LibraryDetails   `json:"library_details" bson:"library_details"`

	StudentHistory    StudentHistory  `json:"student_history" bson:"student_history"`
	Accreditations    []Accreditation `json:"accreditations" bson:"accreditations"`
	Affiliations      []string        `json:"affiliations" bson:"affiliations"`
	Recognition       string          `json:"recognition" bson:"recognition"`
	CampusArea        string          `json:"campus_area" bson:"campus_area"`
	ContactInfo       ContactInfo     `json:"contact_info" bson:"contact_info"`
	AdditionalDetails []string        `json:"additional_details_list" bson:"additional_details_list"`

	// Legacy/Compat fields
	GlobalRanking          string          `json:"global_ranking_legacy" bson:"global_ranking_legacy"`
	Departments            []string        `json:"departments" bson:"departments"`
	StudentStatistics      []StatisticItem `json:"student_statistics" bson:"student_statistics"`
	AdditionalDetailsItems []StatisticItem `json:"additional_details" bson:"additional_details"`
	Sources                []string        `json:"sources" bson:"sources"`
	ValidationWarnings     []string        `json:"validation_warnings" bson:"validation_warnings"`

	ApprovalStatus string    `json:"approval_status" bson:"approval_status"`
	CreatedAt      time.Time `json:"created_at" bson:"created_at"`
	UpdatedAt      time.Time `json:"updated_at" bson:"updated_at"`
	ApprovedAt     time.Time `json:"approved_at,omitempty" bson:"approved_at,omitempty"`
	ApprovedBy     string    `json:"approved_by,omitempty" bson:"approved_by,omitempty"`

	// Stores full schema JSON files (e.g., ug.json, pg.json, scholarships.json, etc.)
	Files map[string]interface{} `json:"files,omitempty" bson:"files,omitempty"`

	// Stores full raw Serper output per section (including any extra fields beyond the typed struct)
	SerperSections map[string]interface{} `json:"serper_sections,omitempty" bson:"serper_sections,omitempty"`

	// Catch-all for any other fields not explicitly defined in the struct (e.g. root-level scraper data)
	RawData map[string]interface{} `json:"raw_data,omitempty" bson:",inline"`

	// Legacy Compatibility Fields (Top Level)
	LegacyGenderRatio        GenderRatio `json:"student_gender_ratio" bson:"student_gender_ratio"`
	LegacyInternationalCount int         `json:"international_students" bson:"international_students"`
	LegacyFacultyCount       int         `json:"faculty_staff" bson:"faculty_staff"`
}

type CollegeRankings struct {
	NIRF2025     interface{} `json:"nirf_2025" bson:"nirf_2025"`
	NIRF2024     interface{} `json:"nirf_2024" bson:"nirf_2024"`
	NIRFRank     interface{} `json:"nirf_rank" bson:"nirf_rank"` // Added for Serper
	QSWorld      interface{} `json:"qs_world" bson:"qs_world"`
	QSAsia       interface{} `json:"qs_asia" bson:"qs_asia"`
	THEWorld     interface{} `json:"the_world" bson:"the_world"`
	NationalRank interface{} `json:"national_rank" bson:"national_rank"`
	StateRank    interface{} `json:"state_rank" bson:"state_rank"`
}

type RankingEntry struct {
	Year        int         `json:"year" bson:"year"`
	RankingBody string      `json:"ranking_body" bson:"ranking_body"`
	Rank        interface{} `json:"rank" bson:"rank"`
	Category    string      `json:"category" bson:"category"`
}

type GlobalRanking struct {
	QSWorld      interface{} `json:"qs_world" bson:"qs_world"`
	THEWorld     interface{} `json:"the_world" bson:"the_world"`
	USNewsGlobal interface{} `json:"us_news_global" bson:"us_news_global"`
	ARWU         interface{} `json:"arwu" bson:"arwu"`
	Webometrics  interface{} `json:"webometrics" bson:"webometrics"`
}

type StudentStatsDetail struct {
	TotalEnrollment int     `json:"total_enrollment" bson:"total_enrollment"`
	UGStudents      int     `json:"ug_students" bson:"ug_students"`
	PGStudents      int     `json:"pg_students" bson:"pg_students"`
	PhDStudents     int     `json:"phd_students" bson:"phd_students"`
	AnnualIntake    int     `json:"annual_intake" bson:"annual_intake"`
	MalePercent     float64 `json:"male_percent" bson:"male_percent"`
	FemalePercent   float64 `json:"female_percent" bson:"female_percent"`
	TotalUGCourses  int     `json:"total_ug_courses" bson:"total_ug_courses"`
	TotalPGCourses  int     `json:"total_pg_courses" bson:"total_pg_courses"`
	TotalPhDCourses int     `json:"total_phd_courses" bson:"total_phd_courses"`
}

type FacultyStaffDetail struct {
	TotalFaculty        int     `json:"total_faculty" bson:"total_faculty"`
	StudentFacultyRatio float64 `json:"student_faculty_ratio" bson:"student_faculty_ratio"`
	PhDFacultyPercent   float64 `json:"phd_faculty_percent" bson:"phd_faculty_percent"`
}

type PlacementInfo struct {
	Year                  interface{} `json:"year" bson:"year"`
	HighestPackage        interface{} `json:"highest_package" bson:"highest_package"`
	AveragePackage        interface{} `json:"average_package" bson:"average_package"`
	MedianPackage         interface{} `json:"median_package" bson:"median_package"`
	PackageCurrency       string      `json:"package_currency" bson:"package_currency"`
	PlacementRatePercent  interface{} `json:"placement_rate_percent" bson:"placement_rate_percent"`
	TotalStudentsPlaced   interface{} `json:"total_students_placed" bson:"total_students_placed"`
	TotalCompaniesVisited interface{} `json:"total_companies_visited" bson:"total_companies_visited"`
	GraduateOutcomesNote  string      `json:"graduate_outcomes_note" bson:"graduate_outcomes_note"`
}

type PlacementComp struct {
	Year                  interface{} `json:"year" bson:"year"`
	YearString            string      `json:"year_string" bson:"year_string"`
	AveragePackage        interface{} `json:"average_package" bson:"average_package"`
	HighestPackage        interface{} `json:"highest_package" bson:"highest_package"`
	MedianPackage         interface{} `json:"median_package" bson:"median_package"`
	EmploymentRatePercent interface{} `json:"employment_rate_percent" bson:"employment_rate_percent"`
	PackageCurrency       string      `json:"package_currency" bson:"package_currency"`
}

type GenderPlacement struct {
	Year          interface{} `json:"year" bson:"year"`
	MalePlaced    interface{} `json:"male_placed" bson:"male_placed"`
	FemalePlaced  interface{} `json:"female_placed" bson:"female_placed"`
	MalePercent   interface{} `json:"male_percent" bson:"male_percent"`
	FemalePercent interface{} `json:"female_percent" bson:"female_percent"`
}

type SectorPlacement struct {
	Year      interface{} `json:"year" bson:"year"`
	Sector    string      `json:"sector" bson:"sector"`
	Companies interface{} `json:"companies" bson:"companies"`
	Percent   interface{} `json:"percent" bson:"percent"`
}

type FeesInfo struct {
	UG            FeeGroup `json:"UG" bson:"UG"`
	PG            FeeGroup `json:"PG" bson:"PG"`
	PhD           FeeGroup `json:"PhD" bson:"PhD"`
	HostelPerYear string   `json:"hostel_per_year" bson:"hostel_per_year"`
	UGYearlyMin   int      `json:"ug_yearly_min" bson:"ug_yearly_min"`
	UGYearlyMax   int      `json:"ug_yearly_max" bson:"ug_yearly_max"`
	PGYearlyMin   int      `json:"pg_yearly_min" bson:"pg_yearly_min"`
	PGYearlyMax   int      `json:"pg_yearly_max" bson:"pg_yearly_max"`
	PhDYearlyMin  int      `json:"phd_yearly_min" bson:"phd_yearly_min"`
	PhDYearlyMax  int      `json:"phd_yearly_max" bson:"phd_yearly_max"`
}

type FeeGroup struct {
	PerYear     interface{} `json:"per_year" bson:"per_year"`
	TotalCourse interface{} `json:"total_course" bson:"total_course"`
	Currency    string      `json:"currency" bson:"currency"`
}

type FeesYearInfo struct {
	Year          string   `json:"year" bson:"year"`
	UG            FeeGroup `json:"UG" bson:"UG"`
	PG            FeeGroup `json:"PG" bson:"PG"`
	PhD           FeeGroup `json:"PhD" bson:"PhD"`
	HostelPerYear float64  `json:"hostel_per_year" bson:"hostel_per_year"`
}

type ScholarshipItem struct {
	Name        string      `json:"name" bson:"name"`
	Amount      interface{} `json:"amount" bson:"amount"`
	Eligibility string      `json:"eligibility" bson:"eligibility"`
	Provider    string      `json:"provider" bson:"provider"`
}

type InfraItem struct {
	Facility string `json:"facility" bson:"facility"`
	Details  string `json:"details" bson:"details"`
}

type HostelDetails struct {
	Available     bool        `json:"available" bson:"available"`
	BoysCapacity  interface{} `json:"boys_capacity" bson:"boys_capacity"`
	GirlsCapacity interface{} `json:"girls_capacity" bson:"girls_capacity"`
	TotalCapacity interface{} `json:"total_capacity" bson:"total_capacity"`
	Type          string      `json:"type" bson:"type"`
}

type TransportDetails struct {
	Buses  string `json:"buses" bson:"buses"`
	Routes string `json:"routes" bson:"routes"`
}

type LibraryDetails struct {
	TotalBooks string `json:"total_books" bson:"total_books"`
	Journals   string `json:"journals" bson:"journals"`
	EResources string `json:"e_resources" bson:"e_resources"`
	AreaSqft   string `json:"area_sqft" bson:"area_sqft"`
}

type StudentHistory struct {
	CountComparison     []StudentCountEntry `json:"student_count_comparison_last_3_years" bson:"student_count_comparison_last_3_years"`
	GenderRatio         GenderRatioDetail   `json:"student_gender_ratio" bson:"student_gender_ratio"`
	International       IntlStudents        `json:"international_students" bson:"international_students"`
	NotableFaculty      []FacultyMember     `json:"notable_faculty" bson:"notable_faculty"`
	FacultyAchievements string              `json:"faculty_achievements" bson:"faculty_achievements"`
}

type StudentCountEntry struct {
	Year          interface{} `json:"year" bson:"year"`
	YearString    string      `json:"year_string" bson:"year_string"`
	TotalEnrolled interface{} `json:"total_enrolled" bson:"total_enrolled"`
	UG            interface{} `json:"ug" bson:"ug"`
	PG            interface{} `json:"pg" bson:"pg"`
	PhD           interface{} `json:"phd" bson:"phd"`
}

type GenderRatioDetail struct {
	TotalMale     int     `json:"total_male" bson:"total_male"`
	TotalFemale   int     `json:"total_female" bson:"total_female"`
	MalePercent   float64 `json:"male_percent" bson:"male_percent"`
	FemalePercent float64 `json:"female_percent" bson:"female_percent"`
}

type IntlStudents struct {
	TotalCount           int      `json:"total_count" bson:"total_count"`
	CountriesRepresented []string `json:"countries_represented" bson:"countries_represented"`
	InternationalPercent float64  `json:"international_percent" bson:"international_percent"`
}

type FacultyMember struct {
	Name           string `json:"name" bson:"name"`
	Designation    string `json:"designation" bson:"designation"`
	Specialization string `json:"specialization" bson:"specialization"`
}

type Accreditation struct {
	Body  string      `json:"body" bson:"body"`
	Grade interface{} `json:"grade" bson:"grade"`
	Year  interface{} `json:"year" bson:"year"`
}

type ContactInfo struct {
	Phone   string `json:"phone" bson:"phone"`
	Email   string `json:"email" bson:"email"`
	Address string `json:"address" bson:"address"`
}

type GenderRatio struct {
	MalePercentage   int `json:"male_percentage" bson:"male_percentage"`
	FemalePercentage int `json:"female_percentage" bson:"female_percentage"`
}

type StatisticItem struct {
	Category string      `json:"category" bson:"category"`
	Value    interface{} `json:"value" bson:"value"`
}

// College Validation Structures (used for Groq-based validation)
type CollegeValidationRequest struct {
	CollegeName string `json:"college_name"`
	Country     string `json:"country"`
	Location    string `json:"location"`
}

type CollegeValidationResponse struct {
	IsValid  bool   `json:"is_valid"`
	Name     string `json:"name"`
	Country  string `json:"country"`
	Location string `json:"location"`
	Error    string `json:"error,omitempty"`
	Reason   string `json:"reason,omitempty"`
}
