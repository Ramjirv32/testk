package ai

import (
	"regexp"

	"gobackend/models"
)

func mapRankings(data map[string]interface{}, stats *models.CollegeStats) {
	rankMap := GetMap(data, "rankings")
	if len(rankMap) == 0 {
		bi := GetMap(data, "basic_info")
		rankMap = GetMap(bi, "rankings")
	}
	if len(rankMap) == 0 {
		rankMap = GetMap(data, "ranking")
	}

	nirf2025Val := rankMap["nirf_2025"]
	if nirf2025Val == nil {
		nirf2025Val = rankMap["nirf_latest"]
	}

	nirf2024Val := rankMap["nirf_2024"]
	if nirf2024Val == nil {
		nirf2024Val = rankMap["nirf_previous"]
	}

	nirfRankVal := GetString(rankMap, "nirf_rank")
	if nirfRankVal == "" {
		nirfRankVal = GetString(rankMap, "nirf_latest")
	}

	stats.Rankings = models.CollegeRankings{
		NIRF2025:     nirf2025Val,
		NIRF2024:     nirf2024Val,
		NIRFRank:     nirfRankVal,
		QSWorld:      rankMap["qs_world"],
		QSAsia:       rankMap["qs_asia"],
		THEWorld:     rankMap["the_world"],
		NationalRank: rankMap["national_rank"],
		StateRank:    rankMap["state_rank"],
	}

	// Dynamic fallback for world_rankings as a list (common in Serper)
	if wr, ok := rankMap["world_rankings"].([]interface{}); ok && len(wr) > 0 {
		for _, rawR := range wr {
			if m, ok := rawR.(map[string]interface{}); ok {
				source := GetString(m, "source")
				// Take 2026/2025 rank depending on what's available
				val := m["2026"]
				if val == nil {
					val = m["2025"]
				}
				if val != nil {
					reQS := regexp.MustCompile("(?i)QS")
					reTHE := regexp.MustCompile("(?i)Times|THE")
					if reQS.MatchString(source) && stats.Rankings.QSWorld == nil {
						stats.Rankings.QSWorld = val
					} else if reTHE.MatchString(source) && stats.Rankings.THEWorld == nil {
						stats.Rankings.THEWorld = val
					}
				}
			}
		}
	}

	// Fallback: parse current_rankings list (used by normalized.json from serper)
	// e.g. ranking.current_rankings: [{ranking_body: "QS World...", rank: 298}, ...]
	if stats.Rankings.QSWorld == nil || stats.Rankings.THEWorld == nil {
		currentRankingsList := func() []interface{} {
			// try data["ranking"]["current_rankings"]
			if rMap, ok := data["ranking"].(map[string]interface{}); ok {
				if cr, ok := rMap["current_rankings"].([]interface{}); ok {
					return cr
				}
			}
			// try rankMap["current_rankings"]
			if cr, ok := rankMap["current_rankings"].([]interface{}); ok {
				return cr
			}
			return nil
		}()
		reQS := regexp.MustCompile("(?i)QS")
		reTHE := regexp.MustCompile("(?i)Times|THE")
		reARWU := regexp.MustCompile("(?i)Shanghai|ARWU")
		for _, rawR := range currentRankingsList {
			if m, ok := rawR.(map[string]interface{}); ok {
				body := GetString(m, "ranking_body")
				rank := m["rank"]
				if rank == nil {
					rank = m["rank_band"] // e.g. "501-600"
				}
				if reQS.MatchString(body) && stats.Rankings.QSWorld == nil {
					stats.Rankings.QSWorld = rank
				} else if reTHE.MatchString(body) && stats.Rankings.THEWorld == nil {
					stats.Rankings.THEWorld = rank
				} else if reARWU.MatchString(body) && stats.GlobalRankingObj.ARWU == nil {
					stats.GlobalRankingObj.ARWU = rank
				}
			}
		}
	}

	// Rankings History — try all known key names including historical_rankings
	rh := GetSlice(data, "rankings_history")
	if len(rh) == 0 {
		rh = GetSlice(rankMap, "ranking_comparison_last_3_years")
	}
	if len(rh) == 0 {
		rMap := GetMap(data, "ranking")
		rh = GetSlice(rMap, "rankings_comparison_last_3_years")
	}
	// Fallback: historical_rankings from normalized.json serper format
	if len(rh) == 0 {
		if rMap, ok := data["ranking"].(map[string]interface{}); ok {
			rh = GetSlice(rMap, "historical_rankings")
		}
	}
	for _, raw := range rh {
		if m, ok := raw.(map[string]interface{}); ok {
			yearVal := GetInt(m, "year")

			rankVal := m["rank"]
			if rankVal == nil {
				rankVal = m["rank_band"]
			}
			if rankVal == nil {
				rankVal = m["national_rank"]
			}
			if rankVal == nil {
				rankVal = m["qs_world_rank"]
			}

			rankingBodyVal := GetString(m, "ranking_body")
			if rankingBodyVal == "" {
				if m["qs_world_rank"] != nil {
					rankingBodyVal = "QS World University Rankings"
				} else {
					rankingBodyVal = "NIRF"
				}
			}

			stats.RankingsHistory = append(stats.RankingsHistory, models.RankingEntry{
				Year:        yearVal,
				RankingBody: rankingBodyVal,
				Rank:        rankVal,
				Category:    GetString(m, "category"),
			})
		}
	}

	// Global Ranking Detail (fallback if rankings map was shallow)
	gr := GetMap(data, "global_ranking")
	stats.GlobalRankingObj = models.GlobalRanking{
		QSWorld:      gr["qs_world"],
		THEWorld:     gr["the_world"],
		USNewsGlobal: gr["us_news_global"],
		ARWU:         gr["arwu"],
		Webometrics:  gr["webometrics"],
	}

	if stats.Rankings.QSWorld == nil && stats.GlobalRankingObj.QSWorld != nil {
		stats.Rankings.QSWorld = stats.GlobalRankingObj.QSWorld
	}
	if stats.Rankings.THEWorld == nil && stats.GlobalRankingObj.THEWorld != nil {
		stats.Rankings.THEWorld = stats.GlobalRankingObj.THEWorld
	}
}
