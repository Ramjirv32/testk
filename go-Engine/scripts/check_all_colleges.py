#!/usr/bin/env python3
import pymongo

def verify():
    client = pymongo.MongoClient("mongodb://localhost:27017/")
    db = client["tru-main"]
    collection = db["college_details"]

    print("Retrieving all colleges from MongoDB:")
    cursor = collection.find({}, {"college_name": 1, "country": 1, "approval_status": 1, "files": 1})
    count = 0
    for doc in cursor:
        count += 1
        files = doc.get("files", {})
        print(f"{count}. Name: {doc.get('college_name')} | Country: {doc.get('country')} | Status: {doc.get('approval_status')} | Files Count: {len(files)}")
    
    if count == 0:
        print(" No colleges found in database!")

if __name__ == "__main__":
    verify()
