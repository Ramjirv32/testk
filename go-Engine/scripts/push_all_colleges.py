#!/usr/bin/env python3
import os
import json
import requests

def push_all():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    full_schema_dir = os.path.join(root_dir, "Fullcollgeslist")
    
    url = "http://localhost:9000/api/ingest/college"
    headers = {
        "Content-Type": "application/json",
        "X-Internal-API-Key": "default-internal-key"
    }

    count = 0
    # Walk the directory tree to find all normalized.json
    for root, dirs, files in os.walk(full_schema_dir):
        if "normalized.json" in files:
            norm_path = os.path.join(root, "normalized.json")
            
            # Extract country and college_name from path
            # Example path: .../Fullcollgeslist/TURKEY/ATLAS-UNIVERSITY/normalized.json
            parts = root.split(os.sep)
            try:
                idx = parts.index("Fullcollgeslist")
                country = parts[idx + 1]
                next_part = parts[idx + 2]
                if next_part.isdigit() and len(next_part) == 4:
                    college_name = parts[idx + 3]
                else:
                    college_name = next_part
            except (ValueError, IndexError):
                continue
                
            print(f"Processing {country} / {college_name}...")
            
            # Load normalized.json
            try:
                with open(norm_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
            except Exception as e:
                print(f" Failed to load normalized.json for {college_name}: {e}")
                continue
                
            # Gather other files
            files_data = {}
            for fname in os.listdir(root):
                if fname.endswith(".json") and fname not in ["normalized.json", "raw.json"]:
                    fpath = os.path.join(root, fname)
                    try:
                        with open(fpath, "r", encoding="utf-8") as f:
                            files_data[fname] = json.load(f)
                    except Exception as e:
                        print(f" Failed to load {fname} for {college_name}: {e}")

            # Basic info mapping
            basic_info = data.get("basic_info", {})
            location = basic_info.get("location", basic_info.get("city", ""))
            
            # Build payload
            payload = {
                **data,
                "college_name": college_name,
                "country": country,
                "location": location,
                "files": files_data
            }
            
            # Post request
            try:
                resp = requests.post(url, json=payload, headers=headers)
                print(f"  Result: {resp.status_code} - {resp.text.strip()}")
                if resp.status_code == 200:
                    count += 1
            except Exception as e:
                print(f"   Post request failed: {e}")

    print(f"\n Successfully ingested {count} colleges!")

if __name__ == "__main__":
    push_all()
