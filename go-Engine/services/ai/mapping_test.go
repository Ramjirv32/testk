package ai

import (
	"testing"
)

func TestNormalizeAndValidateFinancial(t *testing.T) {
	tests := []struct {
		name           string
		country        string
		val            interface{}
		cur            string
		expectedVal    float64
		expectedCur    string
		hasWarning     bool
	}{
		{
			name:        "AED simple normal package",
			country:     "United Arab Emirates",
			val:         162000.0,
			cur:         "AED",
			expectedVal: 162000.0 * 22.7,
			expectedCur: "INR",
			hasWarning:  false,
		},
		{
			name:        "AED severe contradiction low LPA scaled value",
			country:     "Dubai, UAE",
			val:         1.62,
			cur:         "LPA",
			expectedVal: 162000.0 * 22.7,
			expectedCur: "INR",
			hasWarning:  true,
		},
		{
			name:        "AED severe contradiction big INR raw value",
			country:     "Abu Dhabi",
			val:         162000.0,
			cur:         "INR",
			expectedVal: 162000.0 * 22.7,
			expectedCur: "INR",
			hasWarning:  true,
		},
		{
			name:        "NZD simple normal package",
			country:     "New Zealand",
			val:         65000.0,
			cur:         "NZD",
			expectedVal: 65000.0 * 51.0,
			expectedCur: "INR",
			hasWarning:  false,
		},
		{
			name:        "NZD severe contradiction low value",
			country:     "NZ",
			val:         0.65,
			cur:         "INR",
			expectedVal: 65000.0 * 51.0,
			expectedCur: "INR",
			hasWarning:  true,
		},
		{
			name:        "INR/LPA normal package already scaled",
			country:     "India",
			val:         12.5,
			cur:         "LPA",
			expectedVal: 12.5 * 100000.0,
			expectedCur: "INR",
			hasWarning:  false,
		},
		{
			name:        "INR/LPA normal package raw value",
			country:     "India",
			val:         1250000.0,
			cur:         "INR",
			expectedVal: 1250000.0,
			expectedCur: "INR",
			hasWarning:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotVal, gotCur, warn := normalizeAndValidateFinancial(tt.country, tt.val, tt.cur)
			if gotVal != tt.expectedVal {
				t.Errorf("normalizeAndValidateFinancial() gotVal = %v, want %v", gotVal, tt.expectedVal)
			}
			if gotCur != tt.expectedCur {
				t.Errorf("normalizeAndValidateFinancial() gotCur = %v, want %v", gotCur, tt.expectedCur)
			}
			if (warn != "") != tt.hasWarning {
				t.Errorf("normalizeAndValidateFinancial() warning = %q, expected presence = %v", warn, tt.hasWarning)
			}
		})
	}
}
