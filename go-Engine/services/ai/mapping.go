package ai

import (
	"fmt"

	"gobackend/models"
)

func MapMapToCollegeStats(data map[string]interface{}) *models.CollegeStats {
	// Deep mapping to models.CollegeStats
	stats := &models.CollegeStats{
		CollegeName:     GetString(data, "college_name"),
		ShortName:       GetString(data, "short_name"),
		Established:     GetInt(data, "established"),
		InstitutionType: GetString(data, "institution_type"),
		Country:         GetString(data, "country"),
		About:           GetString(data, "about"),
		Location:        GetString(data, "location"),
		Website:         GetString(data, "website"),
		Summary:         GetString(data, "summary"),
	}

	if files, ok := data["files"].(map[string]interface{}); ok {
		stats.Files = files
	}

	// Legacy fields (for compatibility)
	stats.GlobalRanking = GetString(data, "global_ranking")
	stats.UGPrograms = GetStringSlice(data, "ug_programs")
	stats.PGPrograms = GetStringSlice(data, "pg_programs")
	stats.PhDPrograms = GetStringSlice(data, "phd_programs")
	stats.Departments = GetStringSlice(data, "departments")
	stats.Sources = GetStringSlice(data, "sources")

	// Call separate mapping functions
	mapRankings(data, stats)
	mapStudentStats(data, stats)
	mapPlacements(data, stats)
	mapFeesAndScholarships(data, stats)
	mapInfrastructure(data, stats)
	mapStudentHistory(data, stats)
	mapIdentityDetails(data, stats)

	SyncLegacyFields(stats)

	return stats
}

// SyncLegacyFields populates the legacy slices (student_statistics, additional_details) from structured data
func SyncLegacyFields(stats *models.CollegeStats) {
	// Sync StudentStatistics slice for frontend compatibility
	stats.StudentStatistics = []models.StatisticItem{
		{Category: "Total students", Value: stats.StudentStatsDetail.TotalEnrollment},
		{Category: "Undergraduate students", Value: stats.StudentStatsDetail.UGStudents},
		{Category: "Postgraduate students", Value: stats.StudentStatsDetail.PGStudents},
		{Category: "PhD Students", Value: stats.StudentStatsDetail.PhDStudents},
		{Category: "Annual Intake", Value: stats.StudentStatsDetail.AnnualIntake},
		{Category: "Male students percentage", Value: stats.StudentStatsDetail.MalePercent},
		{Category: "Female students percentage", Value: stats.StudentStatsDetail.FemalePercent},
		{Category: "Total Faculty (Staff)", Value: stats.FacultyStaffDetail.TotalFaculty},
		{Category: "International students", Value: stats.StudentHistory.International.TotalCount},
		{Category: "Scholarships Available", Value: len(stats.ScholarshipsDetail)},
		{Category: "Total UG Courses", Value: stats.StudentStatsDetail.TotalUGCourses},
		{Category: "Total PG Courses", Value: stats.StudentStatsDetail.TotalPGCourses},
		{Category: "Total PhD Courses", Value: stats.StudentStatsDetail.TotalPhDCourses},
		{Category: "Placement rate (%)", Value: stats.Placements.PlacementRatePercent},
		{Category: "Total students placed", Value: stats.Placements.TotalStudentsPlaced},
	}

	// Add historical data as batches
	for _, entry := range stats.StudentHistory.CountComparison {
		label := entry.YearString
		if label == "" {
			label = fmt.Sprintf("%v", entry.Year)
		}
		stats.StudentStatistics = append(stats.StudentStatistics, models.StatisticItem{
			Category: fmt.Sprintf("Enrollment %s", label),
			Value:    entry.TotalEnrolled,
		})
	}

	for _, entry := range stats.PlacementComparison {
		label := entry.YearString
		if label == "" {
			label = fmt.Sprintf("%v", entry.Year)
		}
		stats.StudentStatistics = append(stats.StudentStatistics, models.StatisticItem{
			Category: fmt.Sprintf("Placement %s (%%)", label),
			Value:    entry.EmploymentRatePercent,
		})
	}

	// Add specific placement stats if available
	if GetFloatFromAny(stats.Placements.HighestPackage) > 0 {
		stats.StudentStatistics = append(stats.StudentStatistics, models.StatisticItem{
			Category: "Highest Package", Value: stats.Placements.HighestPackage,
		})
	}

	// Sync AdditionalDetailsItems slice (filter out null/NA)
	rawItems := []struct {
		Label string
		Value interface{}
	}{
		{"Global Ranking", stats.GlobalRanking},
		{"NIRF 2025", stats.Rankings.NIRF2025},
		{"NIRF 2024", stats.Rankings.NIRF2024},
		{"NIRF Rank", stats.Rankings.NIRFRank},
		{"National Rank", stats.Rankings.NationalRank},
		{"State Rank", stats.Rankings.StateRank},
		{"Global Rank (QS/THE)", stats.Rankings.QSWorld},
		{"Category Rank", stats.Rankings.QSAsia},
		{"Established Year", stats.Established},
		{"Institution Type", stats.InstitutionType},
		{"Location", stats.Location},
		{"Median CTC", stats.Placements.MedianPackage},
	}

	stats.AdditionalDetailsItems = []models.StatisticItem{}
	for _, item := range rawItems {
		val := fmt.Sprintf("%v", item.Value)
		if item.Value != nil && val != "" && val != "<nil>" && val != "Not Applicable" && val != "0" {
			stats.AdditionalDetailsItems = append(stats.AdditionalDetailsItems, models.StatisticItem{
				Category: item.Label,
				Value:    item.Value,
			})
		}
	}

	// Add items from the additional details string slice
	for _, detail := range stats.AdditionalDetails {
		stats.AdditionalDetailsItems = append(stats.AdditionalDetailsItems, models.StatisticItem{
			Category: "Info",
			Value:    detail,
		})
	}

	// Top level compatibility fields
	stats.LegacyGenderRatio = models.GenderRatio{
		MalePercentage:   int(stats.StudentStatsDetail.MalePercent),
		FemalePercentage: int(stats.StudentStatsDetail.FemalePercent),
	}
	stats.LegacyInternationalCount = stats.StudentHistory.International.TotalCount
	stats.LegacyFacultyCount = stats.FacultyStaffDetail.TotalFaculty
}
