#!/usr/bin/env python3
import os
import json
import requests

def push():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
    target_dir = os.path.join(root_dir, "Fullcollgeslist", "TURKEY", "ATLAS-UNIVERSITY")
    norm_path = os.path.join(target_dir, "normalized.json")

    if not os.path.exists(norm_path):
        print(f" normalized.json not found at {norm_path}!")
        return

    with open(norm_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    # Gather all JSON files
    files_data = {}
    for fname in os.listdir(target_dir):
        if fname.endswith(".json") and fname not in ["normalized.json", "raw.json"]:
            fpath = os.path.join(target_dir, fname)
            try:
                with open(fpath, "r", encoding="utf-8") as f:
                    files_data[fname] = json.load(f)
            except Exception as e:
                print(f" Failed to load {fname}: {e}")

    # Build the exact payload
    payload = {
        **data,
        "college_name": "ATLAS-UNIVERSITY",
        "country": "TURKEY",
        "location": "Istanbul",
        "files": files_data
    }

    url = "http://localhost:9000/api/ingest/college"
    headers = {
        "Content-Type": "application/json",
        "X-Internal-API-Key": "default-internal-key"
    }

    print(f"Sending POST to {url}...")
    try:
        resp = requests.post(url, json=payload, headers=headers)
        print(f"Response Status: {resp.status_code}")
        print(f"Response Body: {resp.text}")
    except Exception as e:
        print(f" Request failed: {e}")

if __name__ == "__main__":
    push()
