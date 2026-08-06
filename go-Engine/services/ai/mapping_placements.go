package ai

import (
	"fmt"
	"strconv"

	"gobackend/models"
)

func mapPlacements(data map[string]interface{}, stats *models.CollegeStats) {
	pl := GetMap(data, "placements")
	if len(pl) == 0 {
		// Fallback if LLM returned at root instead of nested
		if data["highest_package"] != nil || data["average_package"] != nil {
			pl = data
		}
	}
	var plYear interface{} = pl["year"]
	if plYear == nil {
		plYear = ""
	}
	stats.Placements = models.PlacementInfo{
		Year:                  plYear,
		HighestPackage:        GetFloatFromAny(pl["highest_package"]),
		AveragePackage:        GetFloatFromAny(pl["average_package"]),
		MedianPackage:         GetFloatFromAny(pl["median_package"]),
		PackageCurrency:       GetString(pl, "package_currency"),
		PlacementRatePercent:  GetFloatFromAny(pl["placement_rate_percent"]),
		TotalStudentsPlaced:   GetInt(pl, "total_students_placed"),
		TotalCompaniesVisited: GetInt(pl, "total_companies_visited"),
		GraduateOutcomesNote:  GetString(pl, "graduate_outcomes_note"),
	}
	// Fallbacks for placement keys
	if GetFloatFromAny(stats.Placements.HighestPackage) == 0 {
		stats.Placements.HighestPackage = GetFloatFromAny(pl["highest"])
	}
	if GetFloatFromAny(stats.Placements.AveragePackage) == 0 {
		stats.Placements.AveragePackage = GetFloatFromAny(pl["average"])
	}
	if GetFloatFromAny(stats.Placements.MedianPackage) == 0 {
		stats.Placements.MedianPackage = GetFloatFromAny(pl["median"])
	}
	if GetFloatFromAny(stats.Placements.PlacementRatePercent) == 0 {
		stats.Placements.PlacementRatePercent = GetFloatFromAny(pl["employment_rate"])
	}
	if stats.Placements.PackageCurrency == "" {
		stats.Placements.PackageCurrency = GetString(pl, "currency")
	}

	// Normalize Placements
	{
		normAvg, normCur, warn1 := normalizeAndValidateFinancial(stats.Country, stats.Placements.AveragePackage, stats.Placements.PackageCurrency)
		normHighest, _, warn2 := normalizeAndValidateFinancial(stats.Country, stats.Placements.HighestPackage, stats.Placements.PackageCurrency)
		normMedian, _, warn3 := normalizeAndValidateFinancial(stats.Country, stats.Placements.MedianPackage, stats.Placements.PackageCurrency)

		if warn1 != "" {
			stats.ValidationWarnings = append(stats.ValidationWarnings, warn1)
		}
		if warn2 != "" {
			stats.ValidationWarnings = append(stats.ValidationWarnings, warn2)
		}
		if warn3 != "" {
			stats.ValidationWarnings = append(stats.ValidationWarnings, warn3)
		}

		stats.Placements.AveragePackage = normAvg
		stats.Placements.HighestPackage = normHighest
		stats.Placements.MedianPackage = normMedian
		stats.Placements.PackageCurrency = normCur
	}

	// Placement Comparisons
	pc := GetSlice(data, "placement_comparison_last_3_years")
	if len(pc) == 0 {
		pc = GetSlice(pl, "placement_comparison_last_3_years")
	}
	for _, raw := range pc {
		if m, ok := raw.(map[string]interface{}); ok {
			avgPkg := GetFloatFromAny(m["average_package"])
			if avgPkg == 0 {
				avgPkg = GetFloatFromAny(m["average_package_inr"])
			}
			if avgPkg == 0 {
				avgPkg = GetFloatFromAny(m["average"])
			}
			if avgPkg == 0 {
				avgPkg = GetFloatFromAny(m["median_package"])
			}
			if avgPkg == 0 {
				avgPkg = GetFloatFromAny(m["median_package_inr"])
			}
			if avgPkg == 0 {
				avgPkg = GetFloatFromAny(m["median"])
			}

			highestPkg := GetFloatFromAny(m["highest"])
			if highestPkg == 0 {
				highestPkg = GetFloatFromAny(m["highest_package"])
			}
			if highestPkg == 0 {
				highestPkg = GetFloatFromAny(m["highest_package_inr"])
			}

			medianPkg := GetFloatFromAny(m["median"])
			if medianPkg == 0 {
				medianPkg = GetFloatFromAny(m["median_package"])
			}
			if medianPkg == 0 {
				medianPkg = GetFloatFromAny(m["median_package_inr"])
			}

			currency := GetString(m, "package_currency")
			if currency == "" {
				currency = GetString(m, "currency")
			}
			if currency == "" {
				if m["median_package_inr"] != nil || m["average_package_inr"] != nil || m["highest_package_inr"] != nil {
					currency = "INR"
				} else {
					currency = "TRY"
				}
			}

			// Normalize Comparison Entry
			{
				normAvg, normCur, warn1 := normalizeAndValidateFinancial(stats.Country, avgPkg, currency)
				normHighest, _, warn2 := normalizeAndValidateFinancial(stats.Country, highestPkg, currency)
				normMedian, _, warn3 := normalizeAndValidateFinancial(stats.Country, medianPkg, currency)

				if warn1 != "" {
					stats.ValidationWarnings = append(stats.ValidationWarnings, warn1)
				}
				if warn2 != "" {
					stats.ValidationWarnings = append(stats.ValidationWarnings, warn2)
				}
				if warn3 != "" {
					stats.ValidationWarnings = append(stats.ValidationWarnings, warn3)
				}

				avgPkg = normAvg
				highestPkg = normHighest
				medianPkg = normMedian
				currency = normCur
			}

			empRate := GetFloatFromAny(m["employment_rate_percent"])
			if empRate == 0 {
				empRate = GetFloatFromAny(m["placement_rate_percent"])
			}
			if empRate == 0 {
				placed := GetFloatFromAny(m["students_placed"])
				if placed == 0 {
					placed = GetFloatFromAny(m["total_students_placed"])
				}
				total := GetFloatFromAny(m["total_graduating_students"])
				if total > 0 {
					empRate = (placed / total) * 100
				}
			}

			stats.PlacementComparison = append(stats.PlacementComparison, models.PlacementComp{
				Year:                  GetYearFromAny(m["year"]),
				YearString:            GetString(m, "year"),
				AveragePackage:        avgPkg,
				HighestPackage:        highestPkg,
				MedianPackage:         medianPkg,
				EmploymentRatePercent: empRate,
				PackageCurrency:       currency,
			})
		}
	}

	// Fallback placements from comparison slice if empty or zero
	if len(stats.PlacementComparison) > 0 {
		latest := stats.PlacementComparison[0]
		for _, comp := range stats.PlacementComparison {
			if comp.YearString > latest.YearString {
				latest = comp
			}
		}

		var yearStr string
		switch y := stats.Placements.Year.(type) {
		case string:
			yearStr = y
		case int:
			yearStr = strconv.Itoa(y)
		case float64:
			yearStr = fmt.Sprintf("%.0f", y)
		}
		if yearStr == "" || yearStr == "N/A" || yearStr == "0" {
			stats.Placements.Year = latest.YearString
		}
		if GetFloatFromAny(stats.Placements.AveragePackage) == 0 {
			stats.Placements.AveragePackage = latest.AveragePackage
		}
		if GetFloatFromAny(stats.Placements.MedianPackage) == 0 {
			stats.Placements.MedianPackage = latest.MedianPackage
		}
		if GetFloatFromAny(stats.Placements.HighestPackage) == 0 {
			stats.Placements.HighestPackage = latest.HighestPackage
		}
		if stats.Placements.PackageCurrency == "" {
			stats.Placements.PackageCurrency = latest.PackageCurrency
		}

		if GetIntFromAny(stats.Placements.TotalStudentsPlaced) == 0 || GetIntFromAny(stats.Placements.TotalStudentsPlaced) == -1 {
			for _, raw := range pc {
				if m, ok := raw.(map[string]interface{}); ok {
					if GetString(m, "year") == latest.YearString {
						stats.Placements.TotalStudentsPlaced = GetInt(m, "students_placed")
						break
					}
				}
			}
		}
	}

	// Gender Placement
	gp := GetSlice(data, "gender_based_placement_last_3_years")
	if len(gp) == 0 {
		gp = GetSlice(pl, "gender_based_placement_last_3_years")
	}
	for _, raw := range gp {
		if m, ok := raw.(map[string]interface{}); ok {
			stats.GenderPlacement = append(stats.GenderPlacement, models.GenderPlacement{
				Year:          GetYearFromAny(m["year"]),
				MalePlaced:    m["male_placed"],
				FemalePlaced:  m["female_placed"],
				MalePercent:   m["male_percent"],
				FemalePercent: m["female_percent"],
			})
		}
	}

	if len(stats.GenderPlacement) == 0 {
		gbpMap := GetMap(data, "gender_based_placement")
		if len(gbpMap) == 0 {
			gbpMap = GetMap(pl, "gender_based_placement")
		}
		if len(gbpMap) > 0 {
			maleMap := GetMap(gbpMap, "male")
			femaleMap := GetMap(gbpMap, "female")
			if len(maleMap) > 0 || len(femaleMap) > 0 {
				malePlaced := maleMap["students_placed"]
				femalePlaced := femaleMap["students_placed"]

				var malePercent, femalePercent interface{}
				mPlacedVal := GetFloatFromAny(malePlaced)
				fPlacedVal := GetFloatFromAny(femalePlaced)
				if mPlacedVal > 0 || fPlacedVal > 0 {
					totalPlaced := mPlacedVal + fPlacedVal
					if totalPlaced > 0 {
						malePercent = float64(int((mPlacedVal/totalPlaced)*100*10)) / 10
						femalePercent = float64(int((fPlacedVal/totalPlaced)*100*10)) / 10
					}
				}

				var genderYear interface{} = 2025
				if len(stats.PlacementComparison) > 0 {
					genderYear = GetYearFromAny(stats.Placements.Year)
				}

				stats.GenderPlacement = append(stats.GenderPlacement, models.GenderPlacement{
					Year:          genderYear,
					MalePlaced:    malePlaced,
					FemalePlaced:  femalePlaced,
					MalePercent:   malePercent,
					FemalePercent: femalePercent,
				})
			}
		}
	}

	// Sector Placement
	sp := GetSlice(data, "sector_wise_placement_last_3_years")
	if len(sp) == 0 {
		sp = GetSlice(pl, "sector_wise_placement_last_3_years")
	}
	for _, raw := range sp {
		if m, ok := raw.(map[string]interface{}); ok {
			stats.SectorPlacement = append(stats.SectorPlacement, models.SectorPlacement{
				Year:      GetYearFromAny(m["year"]),
				Sector:    GetString(m, "sector"),
				Companies: GetString(m, "companies"),
				Percent:   m["percent"],
			})
		}
	}

	stats.TopRecruiters = GetStringSlice(data, "top_recruiters")
	if len(stats.TopRecruiters) == 0 {
		stats.TopRecruiters = GetStringSlice(pl, "top_recruiters")
	}
	stats.PlacementHighlights = GetString(data, "placement_highlights")
	if stats.PlacementHighlights == "" {
		stats.PlacementHighlights = GetString(pl, "placement_highlights")
	}
}
