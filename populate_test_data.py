#!/usr/bin/env python3
"""Populate database with test issues for demonstration"""

from backend.app.database import SessionLocal
from backend.app.models import Issue
from datetime import datetime, timedelta
import json

db = SessionLocal()

# Clear existing issues
db.query(Issue).delete()
db.commit()

# Test data
test_issues = [
    {
        "title": "Large pothole on Main Street near Market Square",
        "description": "Deep pothole creating hazard for vehicles and pedestrians near the market",
        "issue_type": "road_damage",
        "latitude": 32.1933,
        "longitude": 76.2633,
        "location_description": "Main Street, Kangra District",
        "priority_score": 85.5,
        "priority_level": "critical",
        "status": "reported",
        "ai_confidence": 0.92,
        "upvotes": 12
    },
    {
        "title": "Garbage accumulation near bus stand",
        "description": "Waste materials and litter scattered across the bus stand area",
        "issue_type": "garbage",
        "latitude": 32.1945,
        "longitude": 76.2650,
        "location_description": "Bus Stand, Kangra",
        "priority_score": 65.3,
        "priority_level": "high",
        "status": "investigating",
        "ai_confidence": 0.88,
        "upvotes": 8
    },
    {
        "title": "Water leakage from pipeline junction",
        "description": "Continuous water leak causing waste and creating wet area",
        "issue_type": "water_leak",
        "latitude": 32.1920,
        "longitude": 76.2620,
        "location_description": "Railway Road, Kangra",
        "priority_score": 72.1,
        "priority_level": "high",
        "status": "reported",
        "ai_confidence": 0.85,
        "upvotes": 5
    },
    {
        "title": "Traffic congestion at main intersection",
        "description": "Heavy traffic during peak hours with signal malfunction",
        "issue_type": "traffic",
        "latitude": 32.1960,
        "longitude": 76.2680,
        "location_description": "Main Intersection, Kangra City",
        "priority_score": 58.4,
        "priority_level": "medium",
        "status": "investigating",
        "ai_confidence": 0.79,
        "upvotes": 6
    },
    {
        "title": "Construction debris blocking sidewalk",
        "description": "Building materials left on pedestrian path creating safety hazard",
        "issue_type": "construction",
        "latitude": 32.1880,
        "longitude": 76.2590,
        "location_description": "Sector 5, Kangra",
        "priority_score": 55.2,
        "priority_level": "medium",
        "status": "resolved",
        "ai_confidence": 0.82,
        "upvotes": 3
    },
    {
        "title": "Small crack in road pavement",
        "description": "Minor damage that could worsen if not maintained",
        "issue_type": "road_damage",
        "latitude": 32.1905,
        "longitude": 76.2610,
        "location_description": "College Road, Kangra",
        "priority_score": 42.1,
        "priority_level": "low",
        "status": "reported",
        "ai_confidence": 0.75,
        "upvotes": 2
    },
    {
        "title": "Landslide risk on hillside near residential area",
        "description": "Soil erosion on slope threatening nearby homes and structures",
        "issue_type": "landslide",
        "latitude": 32.2050,
        "longitude": 76.3000,
        "location_description": "Hillside, North Kangra",
        "priority_score": 88.9,
        "priority_level": "critical",
        "status": "investigating",
        "ai_confidence": 0.91,
        "upvotes": 15
    },
    {
        "title": "Miscellaneous public disturbance",
        "description": "General maintenance issue requiring attention",
        "issue_type": "other",
        "latitude": 32.1870,
        "longitude": 76.2500,
        "location_description": "Downtown Area, Kangra",
        "priority_score": 35.6,
        "priority_level": "low",
        "status": "reported",
        "ai_confidence": 0.45,
        "upvotes": 1
    },
    {
        "title": "Multiple potholes on bypass highway",
        "description": "Severe road damage affecting traffic flow on bypass",
        "issue_type": "road_damage",
        "latitude": 32.1800,
        "longitude": 76.3200,
        "location_description": "Highway Bypass, Kangra",
        "priority_score": 92.3,
        "priority_level": "critical",
        "status": "reported",
        "ai_confidence": 0.94,
        "upvotes": 18
    },
    {
        "title": "Street light malfunction blocks visibility",
        "description": "Street lamp not functioning creating dark area at night",
        "issue_type": "other",
        "latitude": 32.1925,
        "longitude": 76.2645,
        "location_description": "Evening Market Street, Kangra",
        "priority_score": 48.7,
        "priority_level": "medium",
        "status": "investigating",
        "ai_confidence": 0.68,
        "upvotes": 4
    }
]

# Create all test issues
for issue_data in test_issues:
    issue = Issue(
        reporter_id=1,
        title=issue_data["title"],
        description=issue_data["description"],
        issue_type=issue_data["issue_type"],
        image_path="",  # No image for test data
        latitude=issue_data["latitude"],
        longitude=issue_data["longitude"],
        location_description=issue_data["location_description"],
        priority_score=issue_data["priority_score"],
        priority_level=issue_data["priority_level"],
        status=issue_data["status"],
        ai_confidence=issue_data["ai_confidence"],
        ai_detected_objects=json.dumps([]),
        upvotes=issue_data["upvotes"],
        satisfaction_votes=0,
        created_at=datetime.utcnow() - timedelta(days=len(test_issues) - test_issues.index(issue_data))
    )
    db.add(issue)

db.commit()
print(f"✓ Created {len(test_issues)} test issues")

# Verify
count = db.query(Issue).count()
print(f"Total issues in database: {count}")

db.close()
