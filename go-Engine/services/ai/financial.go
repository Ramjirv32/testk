package ai

import (
	"fmt"
	"strings"
)

func normalizeAndValidateFinancial(country string, val interface{}, cur string) (float64, string, string) {
	v := GetFloatFromAny(val)
	if v == 0 {
		return 0, cur, ""
	}

	countryUpper := strings.ToUpper(country)
	curUpper := strings.ToUpper(strings.TrimSpace(cur))
	if curUpper == "" {
		curUpper = "INR"
	}

	isUAE := strings.Contains(countryUpper, "UAE") || strings.Contains(countryUpper, "UNITED ARAB EMIRATES") || strings.Contains(countryUpper, "DUBAI") || strings.Contains(countryUpper, "ABU DHABI")
	isNZ := strings.Contains(countryUpper, "NEW ZEALAND") || strings.Contains(countryUpper, "NZ")
	isTurkey := strings.Contains(countryUpper, "TURKEY") || strings.Contains(countryUpper, "TURKIYE")
	isRussia := strings.Contains(countryUpper, "RUSSIA") || strings.Contains(countryUpper, "RUSSIAN")
	isJapan := strings.Contains(countryUpper, "JAPAN")

	warn := ""
	actualLocalVal := v
	localCur := curUpper

	if isUAE {
		localCur = "AED"
		if v > 0 && v < 100 { // e.g. 1.62 or 1.48
			actualLocalVal = v * 100000
			warn = fmt.Sprintf("Severe currency contradiction: raw package %v LPA/INR scaled to %v AED for UAE.", v, actualLocalVal)
		} else if v >= 100000 && (curUpper == "INR" || curUpper == "LPA") {
			actualLocalVal = v
			warn = fmt.Sprintf("Severe currency contradiction: raw package %v INR/LPA interpreted as %v AED for UAE.", v, actualLocalVal)
		}
	} else if isNZ {
		localCur = "NZD"
		if v > 0 && v < 100 {
			actualLocalVal = v * 100000
			warn = fmt.Sprintf("Severe currency contradiction: raw package %v LPA/INR scaled to %v NZD for NZ.", v, actualLocalVal)
		}
	} else if isTurkey {
		localCur = "TRY"
		if v > 0 && v < 100 {
			actualLocalVal = v * 100000
			warn = fmt.Sprintf("Severe currency contradiction: raw package %v LPA/INR scaled to %v TRY for Turkey.", v, actualLocalVal)
		}
	} else if isRussia {
		localCur = "RUB"
		if v > 0 && v < 100 {
			actualLocalVal = v * 100000
			warn = fmt.Sprintf("Severe currency contradiction: raw package %v LPA/INR scaled to %v RUB for Russia.", v, actualLocalVal)
		}
	} else if isJapan {
		localCur = "JPY"
		if v > 0 && v < 100 {
			actualLocalVal = v * 100000
			warn = fmt.Sprintf("Severe currency contradiction: raw package %v LPA/INR scaled to %v JPY for Japan.", v, actualLocalVal)
		}
	}

	if localCur == "INR" || localCur == "LPA" {
		if v > 0 && v < 200 {
			actualLocalVal = v * 100000
		}
	}

	var rate float64 = 1.0
	switch localCur {
	case "AED":
		rate = 22.7
	case "NZD":
		rate = 51.0
	case "TRY":
		rate = 2.6
	case "RUB":
		rate = 0.95
	case "JPY":
		rate = 0.53
	case "USD":
		rate = 83.5
	case "GBP":
		rate = 106.0
	case "EUR":
		rate = 90.0
	case "AUD":
		rate = 55.5
	case "CAD":
		rate = 61.0
	case "SGD":
		rate = 61.8
	case "SAR":
		rate = 22.3
	case "CNY":
		rate = 11.5
	}

	inrValue := actualLocalVal * rate
	return inrValue, "INR", warn
}
