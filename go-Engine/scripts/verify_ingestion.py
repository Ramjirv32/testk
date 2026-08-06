#!/usr/bin/env python3
import pymongo
import json

def verify():
    client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = client["tru-main"]
    collection = db["college_details"]

    print("Checking database for 'ATLAS-UNIVERSITY' or 'Istanbul Atlas University'...")
    college = collection.find_one({"college_name": {"$regex": "ATLAS-UNIVERSITY", "$options": "i"}})
    
    if not college:
        print(" College not found in database!")
        return

    print(" Found college in MongoDB!")
    print(f"Name: {college.get('college_name')}")
    print(f"Country: {college.get('country')}")
    print(f"Approval Status: {college.get('approval_status')}")
    
    files = college.get("files")
    if files:
        print(f" 'files' field exists and is populated! Sub-file count: {len(files)}")
        print("Available sub-files in DB:")
        for fname in sorted(files.keys()):
            print(f"  - {fname}")
    else:
        print(" 'files' field is missing or empty in MongoDB!")

if __name__ == "__main__":
    verify()
