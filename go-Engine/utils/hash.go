package utils

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
)

func GenerateDataHash(data interface{}) string {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return ""
	}

	hash := md5.Sum(jsonData)
	return fmt.Sprintf("%x", hash)
}

func CompareHashes(hash1, hash2 string) bool {
	return hash1 == hash2
}
