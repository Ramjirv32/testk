#!/usr/bin/env python3
import redis
import json

def verify():
    r = redis.Redis(host='localhost', port=6379, db=0)
    key = "college:atlas-university"
    
    print(f"Checking Redis key: '{key}'...")
    exists = r.exists(key)
    if not exists:
        print(" Key not found in Redis!")
        return

    ttl = r.ttl(key)
    val = r.get(key)

    print(f" Key found in Redis!")
    print(f"TTL: {ttl} seconds (approx {ttl / 3600:.2f} hours)")

    try:
        data = json.loads(val)
        print(f"Name in cache: {data.get('college_name')}")
        print(f"Country in cache: {data.get('country')}")
        
        files = data.get("files")
        if files:
            print(f" 'files' field exists in Redis cache! Sub-file count: {len(files)}")
            print("Available sub-files in Redis:")
            for fname in sorted(files.keys()):
                print(f"  - {fname}")
        else:
            print(" 'files' field is missing or empty in Redis cache!")
            
    except Exception as e:
        print(f" Failed to parse Redis value as JSON: {e}")

if __name__ == "__main__":
    verify()
