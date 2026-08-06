package main

import (
	"encoding/json"
	"fmt"
	"os"

	"gobackend/models"
	"gobackend/services/ai"
)

func main() {
	var _ models.CollegeRankings
	filePath := "../../../Fullcollgeslist/INDIA/VELLORE-INSTITUTE-OF-TECHNOLOGY/normalized.json"
	bytes, err := os.ReadFile(filePath)
	if err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		return
	}

	var rawData map[string]interface{}
	if err := json.Unmarshal(bytes, &rawData); err != nil {
		fmt.Printf("Error unmarshaling JSON: %v\n", err)
		return
	}

	// Replicate IngestCollege flattening
	flatData := make(map[string]interface{})
	for k, v := range rawData {
		flatData[k] = v
	}

	basicInfo, _ := rawData["basic_info"].(map[string]interface{})
	ranking, _ := rawData["ranking"].(map[string]interface{})

	if basicInfo != nil {
		if nameVal := ai.GetString(basicInfo, "college_name"); nameVal != "" {
			flatData["college_name"] = nameVal
		}
		if rankingsObj, ok := basicInfo["rankings"].(map[string]interface{}); ok {
			flatData["rankings"] = rankingsObj
		}
	}

	if ranking != nil {
		if rComp := ranking["rankings_comparison_last_3_years"]; rComp != nil {
			flatData["rankings_history"] = rComp
		}
		if rankingsObj, ok := ranking["rankings"].(map[string]interface{}); ok {
			flatData["rankings"] = rankingsObj
		}
	}

	stats := ai.MapMapToCollegeStats(flatData)

	fmt.Printf("Mapped CollegeName: %s\n", stats.CollegeName)
	fmt.Printf("Mapped Rankings: %+v\n", stats.Rankings)
	fmt.Printf("Mapped RankingsHistory Length: %d\n", len(stats.RankingsHistory))
	for i, entry := range stats.RankingsHistory {
		fmt.Printf("  [%d] Year: %d, Body: %s, Rank: %v\n", i, entry.Year, entry.RankingBody, entry.Rank)
	}
}
