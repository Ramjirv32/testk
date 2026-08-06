#!/usr/bin/env python3
import redis
import json

def verify():
    r = redis.Redis(host='localhost', port=6379, db=0)
    keys = r.keys("college:*")
    
    print(f"Listing all college keys in Redis (Total: {len(keys)}):")
    for key_bytes in sorted(keys):
        key = key_bytes.decode('utf-8')
        ttl = r.ttl(key)
        val = r.get(key)
        try:
            data = json.loads(val)
            files = data.get("files", {})
            print(f"Key: {key} | Name: {data.get('college_name')} | TTL: {ttl}s (approx {ttl/3600:.2f}h) | Files Count: {len(files)}")
        except Exception as e:
            print(f"Key: {key} | Error parsing JSON: {e}")

if __name__ == "__main__":
    verify()
