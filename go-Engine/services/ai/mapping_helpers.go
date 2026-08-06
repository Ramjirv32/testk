package ai

import (
	"fmt"
	"regexp"
	"strconv"
)

// Map helpers
func GetString(m map[string]interface{}, key string) string {
	if val, ok := m[key].(string); ok {
		return val
	}
	return ""
}

// GetStringFromAny converts any type (string, int, float64) to string
// Useful for fees which can be returned as numbers by AI APIs
func GetStringFromAny(m map[string]interface{}, key string) string {
	val, ok := m[key]
	if !ok {
		return ""
	}

	// If it's already a string, return it
	if s, ok := val.(string); ok {
		return s
	}

	// Handle numbers (float64 from JSON) - skip if 0
	if f, ok := val.(float64); ok {
		if f == 0 {
			return "N/A" // Some APIs return 0 for unknown/unavailable fees
		}
		// Format as integer if it's a whole number
		if f == float64(int(f)) {
			return fmt.Sprintf("%d", int(f))
		}
		return fmt.Sprintf("%.2f", f)
	}

	// Handle integers
	if i, ok := val.(int); ok {
		if i == 0 {
			return "N/A"
		}
		return fmt.Sprintf("%d", i)
	}

	// If nil or empty, return N/A
	return "N/A"
}

func GetInt(m map[string]interface{}, key string) int {
	return int(GetFloat(m, key))
}

func GetFloat(m map[string]interface{}, key string) float64 {
	val, ok := m[key]
	if !ok || val == nil {
		return 0
	}

	switch v := val.(type) {
	case float64:
		return v
	case int:
		return float64(v)
	case string:
		// Remove commas, percent signs, and conversational text
		clean := regexp.MustCompile(`[^\d\.]`).ReplaceAllString(v, "")
		if clean == "" {
			// Try to extract the first number found if cleanup stripped everything
			re := regexp.MustCompile(`\d+(\.\d+)?`)
			clean = re.FindString(v)
		}
		if f, err := strconv.ParseFloat(clean, 64); err == nil {
			return f
		}
	}
	return 0
}

func GetBool(m map[string]interface{}, key string) bool {
	if val, ok := m[key].(bool); ok {
		return val
	}
	return false
}

func GetFloatFromAny(val interface{}) float64 {
	if val == nil {
		return 0
	}
	switch v := val.(type) {
	case float64:
		return v
	case int:
		return float64(v)
	case string:
		clean := regexp.MustCompile(`[^\d\.]`).ReplaceAllString(v, "")
		if f, err := strconv.ParseFloat(clean, 64); err == nil {
			return f
		}
	}
	return 0
}

func GetIntFromAny(val interface{}) int {
	return int(GetFloatFromAny(val))
}

func GetStringSlice(m map[string]interface{}, key string) []string {
	var result []string
	if slice, ok := m[key].([]interface{}); ok {
		for _, item := range slice {
			if s, ok := item.(string); ok {
				result = append(result, s)
			} else if obj, ok := item.(map[string]interface{}); ok {
				if name, ok := obj["title"].(string); ok && name != "" {
					result = append(result, name)
				} else if name, ok := obj["name"].(string); ok && name != "" {
					result = append(result, name)
				} else if name, ok := obj["course_title"].(string); ok && name != "" {
					result = append(result, name)
				} else if name, ok := obj["program_name"].(string); ok && name != "" {
					result = append(result, name)
				}
			}
		}
	}
	return result
}

func GetSlice(m map[string]interface{}, key string) []interface{} {
	if slice, ok := m[key].([]interface{}); ok {
		return slice
	}
	return []interface{}{}
}

func GetMap(m map[string]interface{}, key string) map[string]interface{} {
	if res, ok := m[key].(map[string]interface{}); ok {
		return res
	}
	return make(map[string]interface{})
}

func GetYearFromAny(val interface{}) interface{} {
	if val == nil {
		return 0
	}
	switch v := val.(type) {
	case int:
		return v
	case float64:
		return int(v)
	case string:
		if i, err := strconv.Atoi(v); err == nil {
			return i
		}
		return v
	}
	return val
}
