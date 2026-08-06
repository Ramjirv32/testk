package ai

import (
	"fmt"

	"gobackend/models"
)

func mapStudentStats(data map[string]interface{}, stats *models.CollegeStats) {
	sd := GetMap(data, "student_statistics_detail")
	if len(sd) == 0 {
		sd = GetMap(data, "student_statistics")
	}
	detail := models.StudentStatsDetail{
		TotalEnrollment: GetInt(sd, "total_enrollment"),
		UGStudents:      GetInt(sd, "ug_students"),
		PGStudents:      GetInt(sd, "pg_students"),
		PhDStudents:     GetInt(sd, "phd_students"),
		AnnualIntake:    GetInt(sd, "annual_intake"),
		MalePercent:     GetFloat(sd, "male_percent"),
		FemalePercent:   GetFloat(sd, "female_percent"),
		TotalUGCourses:  GetInt(sd, "total_ug_courses"),
		TotalPGCourses:  GetInt(sd, "total_pg_courses"),
		TotalPhDCourses: GetInt(sd, "total_phd_courses"),
	}
	// Fallback: normalized.json stores student data nested under student_demographics_last_3_years
	// e.g. student_statistics.student_demographics_last_3_years[0].undergraduate_students.total
	if detail.TotalEnrollment == 0 || detail.UGStudents == 0 {
		if demos, ok := sd["student_demographics_last_3_years"].([]interface{}); ok && len(demos) > 0 {
			if d0, ok := demos[0].(map[string]interface{}); ok {
				if detail.TotalEnrollment == 0 {
					detail.TotalEnrollment = GetInt(d0, "total_students")
				}
				if detail.UGStudents == 0 {
					if ugObj, ok := d0["undergraduate_students"].(map[string]interface{}); ok {
						detail.UGStudents = GetInt(ugObj, "total")
					}
				}
				if detail.PGStudents == 0 {
					if pgObj, ok := d0["postgraduate_students"].(map[string]interface{}); ok {
						detail.PGStudents = GetInt(pgObj, "total")
					}
				}
				if detail.PhDStudents == 0 {
					if phdObj, ok := d0["phd_students"].(map[string]interface{}); ok {
						detail.PhDStudents = GetInt(phdObj, "total")
					}
				}
			}
		}
	}
	// Fallback: gender ratio nested under overall_gender_ratio_3_year_average
	// e.g. student_statistics.overall_gender_ratio_3_year_average.male_percentage
	if detail.MalePercent == 0 {
		if gr, ok := sd["overall_gender_ratio_3_year_average"].(map[string]interface{}); ok {
			detail.MalePercent = GetFloat(gr, "male_percentage")
			detail.FemalePercent = GetFloat(gr, "female_percentage")
		}
	}
	stats.StudentStatsDetail = detail

	// Faculty Detail
	fd := GetMap(data, "faculty_staff")
	stats.FacultyStaffDetail = models.FacultyStaffDetail{
		TotalFaculty:        GetInt(fd, "total_faculty"),
		StudentFacultyRatio: GetFloat(fd, "student_faculty_ratio"),
		PhDFacultyPercent:   GetFloat(fd, "phd_faculty_percent"),
	}
}

func mapFeesAndScholarships(data map[string]interface{}, stats *models.CollegeStats) {
	// Fees
	fs := GetMap(data, "fees")
	stats.Fees = models.FeesInfo{
		UG: models.FeeGroup{
			PerYear:     GetStringFromAny(GetMap(fs, "UG"), "per_year"),
			TotalCourse: GetStringFromAny(GetMap(fs, "UG"), "total_course"),
			Currency:    GetString(GetMap(fs, "UG"), "currency"),
		},
		PG: models.FeeGroup{
			PerYear:     GetStringFromAny(GetMap(fs, "PG"), "per_year"),
			TotalCourse: GetStringFromAny(GetMap(fs, "PG"), "total_course"),
			Currency:    GetString(GetMap(fs, "PG"), "currency"),
		},
		PhD: models.FeeGroup{
			PerYear:     GetStringFromAny(GetMap(fs, "PhD"), "per_year"),
			TotalCourse: GetStringFromAny(GetMap(fs, "PhD"), "total_course"),
			Currency:    GetString(GetMap(fs, "PhD"), "currency"),
		},
		HostelPerYear: GetStringFromAny(fs, "hostel_per_year"),
		UGYearlyMin:   GetInt(fs, "ug_yearly_min"),
		UGYearlyMax:   GetInt(fs, "ug_yearly_max"),
		PGYearlyMin:   GetInt(fs, "pg_yearly_min"),
		PGYearlyMax:   GetInt(fs, "pg_yearly_max"),
		PhDYearlyMin:  GetInt(fs, "phd_yearly_min"),
		PhDYearlyMax:  GetInt(fs, "phd_yearly_max"),
	}

	stats.FeesNote = GetString(data, "fees_note")
	fy := GetSlice(data, "fees_by_year")
	for _, raw := range fy {
		if m, ok := raw.(map[string]interface{}); ok {
			stats.FeesByYear = append(stats.FeesByYear, models.FeesYearInfo{
				Year: GetStringFromAny(m, "year"),
				UG: models.FeeGroup{
					PerYear:     GetStringFromAny(GetMap(m, "UG"), "per_year"),
					TotalCourse: GetStringFromAny(GetMap(m, "UG"), "total_course"),
					Currency:    GetStringFromAny(GetMap(m, "UG"), "currency"),
				},
				PG: models.FeeGroup{
					PerYear:     GetStringFromAny(GetMap(m, "PG"), "per_year"),
					TotalCourse: GetStringFromAny(GetMap(m, "PG"), "total_course"),
					Currency:    GetStringFromAny(GetMap(m, "PG"), "currency"),
				},
				PhD: models.FeeGroup{
					PerYear:     GetStringFromAny(GetMap(m, "PhD"), "per_year"),
					TotalCourse: GetStringFromAny(GetMap(m, "PhD"), "total_course"),
					Currency:    GetStringFromAny(GetMap(m, "PhD"), "currency"),
				},
				HostelPerYear: GetFloatFromAny(m["hostel_per_year"]),
			})
		}
	}

	// Scholarships
	sch := GetSlice(data, "scholarships_detail")
	if len(sch) == 0 {
		sch = GetSlice(data, "scholarships")
	}
	for _, raw := range sch {
		if m, ok := raw.(map[string]interface{}); ok {
			stats.ScholarshipsDetail = append(stats.ScholarshipsDetail, models.ScholarshipItem{
				Name:        GetString(m, "name"),
				Amount:      GetString(m, "amount"),
				Eligibility: GetString(m, "eligibility"),
				Provider:    GetString(m, "provider"),
			})
		}
	}
}

func mapInfrastructure(data map[string]interface{}, stats *models.CollegeStats) {
	inf := GetSlice(data, "infrastructure")
	for _, raw := range inf {
		if m, ok := raw.(map[string]interface{}); ok {
			stats.Infrastructure = append(stats.Infrastructure, models.InfraItem{
				Facility: GetString(m, "facility"),
				Details:  GetString(m, "details"),
			})
		}
	}

	// Hostel Details
	hd := GetMap(data, "hostel_details")
	stats.HostelDetails = models.HostelDetails{
		Available:     GetBool(hd, "available"),
		BoysCapacity:  hd["boys_capacity"],
		GirlsCapacity: hd["girls_capacity"],
		TotalCapacity: hd["total_capacity"],
		Type:          GetString(hd, "type"),
	}

	// Transport
	td := GetMap(data, "transport_details")
	stats.TransportDetails = models.TransportDetails{
		Buses:  GetString(td, "buses"),
		Routes: GetString(td, "routes"),
	}

	// Library
	ld := GetMap(data, "library_details")
	stats.LibraryDetails = models.LibraryDetails{
		TotalBooks: GetString(ld, "total_books"),
		Journals:   GetString(ld, "journals"),
		EResources: GetString(ld, "e_resources"),
		AreaSqft:   GetString(ld, "area_sqft"),
	}
}

func mapStudentHistory(data map[string]interface{}, stats *models.CollegeStats) {
	sh := GetMap(data, "student_history")
	shd := models.StudentHistory{
		FacultyAchievements: GetString(sh, "faculty_achievements"),
	}

	// Internal helper to parse student records from map
	parseEntry := func(m map[string]interface{}) models.StudentCountEntry {
		yearVal := GetYearFromAny(m["year"])
		e := models.StudentCountEntry{
			Year:       yearVal,
			YearString: fmt.Sprintf("%v", yearVal),
		}
		// Enrollments
		e.TotalEnrolled = GetInt(m, "total_enrolled")
		if GetIntFromAny(e.TotalEnrolled) == 0 {
			e.TotalEnrolled = int(GetFloatFromAny(m["total_students"]))
		}
		if GetIntFromAny(e.TotalEnrolled) == 0 {
			e.TotalEnrolled = int(GetFloatFromAny(m["domestic_students"]))
		}
		// Levels
		e.UG = GetInt(m, "ug")
		if GetIntFromAny(e.UG) == 0 {
			e.UG = GetInt(m, "ug_enrolled")
		}
		if GetIntFromAny(e.UG) == 0 {
			e.UG = GetInt(m, "ug_students")
		}
		if GetIntFromAny(e.UG) == 0 {
			if ugObj, ok := m["undergraduate_students"].(map[string]interface{}); ok {
				e.UG = GetInt(ugObj, "total")
			}
		}

		e.PG = GetInt(m, "pg")
		if GetIntFromAny(e.PG) == 0 {
			e.PG = GetInt(m, "pg_enrolled")
		}
		if GetIntFromAny(e.PG) == 0 {
			e.PG = GetInt(m, "pg_students")
		}
		if GetIntFromAny(e.PG) == 0 {
			if pgObj, ok := m["postgraduate_students"].(map[string]interface{}); ok {
				e.PG = GetInt(pgObj, "total")
			}
		}

		e.PhD = GetInt(m, "phd")
		if GetIntFromAny(e.PhD) == 0 {
			e.PhD = GetInt(m, "phd_enrolled")
		}
		if GetIntFromAny(e.PhD) == 0 {
			e.PhD = GetInt(m, "phd_students")
		}
		if GetIntFromAny(e.PhD) == 0 {
			if phdObj, ok := m["phd_students"].(map[string]interface{}); ok {
				e.PhD = GetInt(phdObj, "total")
			}
		}
		return e
	}

	cc := GetSlice(sh, "student_count_comparison_last_3_years")
	if len(cc) == 0 {
		cc = GetSlice(sh, "categorywise_student_comparison_last_3_years")
	}
	if len(cc) == 0 {
		cc = GetSlice(data, "student_demographics_last_3_years")
	}
	if len(cc) == 0 {
		cc = GetSlice(data, "student_count_comparison_last_3_years")
	}
	if len(cc) == 0 {
		cc = GetSlice(sh, "student_demographics_last_3_years")
	}

	if len(cc) > 0 {
		for _, raw := range cc {
			if m, ok := raw.(map[string]interface{}); ok {
				shd.CountComparison = append(shd.CountComparison, parseEntry(m))
			}
		}
	} else {
		// Try map format (sometimes Serper returns {"2024": {...}})
		ccMap := GetMap(sh, "student_count_comparison_last_3_years")
		if len(ccMap) == 0 {
			ccMap = GetMap(data, "student_demographics_last_3_years")
		}
		if len(ccMap) == 0 {
			ccMap = GetMap(data, "student_count_comparison_last_3_years")
		}
		for yearStr, value := range ccMap {
			if m, ok := value.(map[string]interface{}); ok {
				entry := parseEntry(m)
				if GetIntFromAny(entry.Year) == 0 {
					var yVal int
					if _, err := fmt.Sscanf(yearStr, "%d", &yVal); err == nil {
						entry.Year = yVal
					}
				}
				shd.CountComparison = append(shd.CountComparison, entry)
			}
		}
	}

	grd := GetMap(sh, "student_gender_ratio")
	if len(grd) == 0 {
		grd = GetMap(data, "overall_gender_ratio_3_year_average")
	}
	if len(grd) == 0 {
		grd = GetMap(data, "student_gender_ratio")
	}

	shd.GenderRatio = models.GenderRatioDetail{
		TotalMale:     GetInt(grd, "total_male"),
		TotalFemale:   GetInt(grd, "total_female"),
		MalePercent:   GetFloat(grd, "male_percent"),
		FemalePercent: GetFloat(grd, "female_percent"),
	}
	// Fallback if gender info is at top level or alternative fields
	if shd.GenderRatio.MalePercent == 0 {
		shd.GenderRatio.MalePercent = GetFloat(grd, "male_percentage")
	}
	if shd.GenderRatio.MalePercent == 0 {
		shd.GenderRatio.MalePercent = GetFloat(sh, "male_percent")
	}
	if shd.GenderRatio.MalePercent == 0 {
		shd.GenderRatio.MalePercent = GetFloat(data, "male_percent")
	}

	if shd.GenderRatio.FemalePercent == 0 {
		shd.GenderRatio.FemalePercent = GetFloat(grd, "female_percentage")
	}
	if shd.GenderRatio.FemalePercent == 0 {
		shd.GenderRatio.FemalePercent = GetFloat(sh, "female_percent")
	}
	if shd.GenderRatio.FemalePercent == 0 {
		shd.GenderRatio.FemalePercent = GetFloat(data, "female_percent")
	}

	ints := GetMap(sh, "international_students")
	if len(ints) == 0 {
		ints = GetMap(data, "international_students")
	}

	shd.International = models.IntlStudents{
		TotalCount:           GetInt(ints, "total_count"),
		CountriesRepresented: GetStringSlice(ints, "countries_represented"),
		InternationalPercent: GetFloat(ints, "international_percent"),
	}
	// Fallback for direct international student count (common in Serper)
	if shd.International.TotalCount == 0 {
		shd.International.TotalCount = int(GetFloatFromAny(sh["international_students"]))
	}
	if shd.International.TotalCount == 0 {
		shd.International.TotalCount = int(GetFloatFromAny(data["international_students"]))
	}
	if shd.International.InternationalPercent == 0 {
		shd.International.InternationalPercent = GetFloat(sh, "international_percent")
	}
	if shd.International.InternationalPercent == 0 {
		shd.International.InternationalPercent = GetFloat(data, "international_percent")
	}
	nf := GetSlice(sh, "notable_faculty")
	for _, raw := range nf {
		if m, ok := raw.(map[string]interface{}); ok {
			shd.NotableFaculty = append(shd.NotableFaculty, models.FacultyMember{
				Name:           GetString(m, "name"),
				Designation:    GetString(m, "designation"),
				Specialization: GetString(m, "specialization"),
			})
		}
	}
	stats.StudentHistory = shd
}

func mapIdentityDetails(data map[string]interface{}, stats *models.CollegeStats) {
	// Accreditations
	acc := GetSlice(data, "accreditations")
	for _, raw := range acc {
		if m, ok := raw.(map[string]interface{}); ok {
			stats.Accreditations = append(stats.Accreditations, models.Accreditation{
				Body:  GetString(m, "body"),
				Grade: m["grade"],
				Year:  m["year"],
			})
		}
	}

	// Identity Details (Affiliations, Recognition, Campus Area, Contact)
	stats.Affiliations = GetStringSlice(data, "affiliations")
	stats.Recognition = GetString(data, "recognition")
	stats.CampusArea = GetString(data, "campus_area")
	ci := GetMap(data, "contact_info")
	stats.ContactInfo = models.ContactInfo{
		Phone:   GetString(ci, "phone"),
		Email:   GetString(ci, "email"),
		Address: GetString(ci, "address"),
	}
	stats.AdditionalDetails = GetStringSlice(data, "additional_details")
}
