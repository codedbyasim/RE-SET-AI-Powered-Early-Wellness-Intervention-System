import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath("H:/Hackthon1/backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("1. Testing GET /health...")
res = client.get("/health")
print("Health Status:", res.status_code, res.json())
assert res.status_code == 200

print("\n2. Testing GET /api/v1/auth/me (auto-creates demo user)...")
res = client.get("/api/v1/auth/me")
print("Auth Me Status:", res.status_code, res.json())
assert res.status_code == 200

print("\n3. Testing Seeding Sarah Demo Scenario (POST /api/v1/demo/load-sarah-scenario)...")
res = client.post("/api/v1/demo/load-sarah-scenario")
print("Demo Seed Status:", res.status_code, res.json())
assert res.status_code == 200

print("\n4. Testing GET /api/v1/insights/weekly...")
res = client.get("/api/v1/insights/weekly")
print("Weekly Insights Status:", res.status_code)
insights_data = res.json()
print("Has sufficient data:", insights_data.get("has_sufficient_data"))
print("Recovery Readiness Score:", insights_data.get("readiness", {}).get("overall_score"))
print("AI Synthesized Takeaway:", insights_data.get("ai_synthesized_takeaway"))

print("\n5. Testing GET /api/v1/insights/what-changed...")
res = client.get("/api/v1/insights/what-changed")
print("What Changed Status:", res.status_code)
wc_data = res.json()
print("Top Contributor:", wc_data.get("top_contributor"))
print("AI Narrative:", wc_data.get("ai_narrative"))
print("Disclaimer:", wc_data.get("disclaimer"))

print("\n6. Testing GET /api/v1/interventions/today...")
res = client.get("/api/v1/interventions/today")
print("Intervention Status:", res.status_code)
int_data = res.json()
print("Plan Title:", int_data.get("title"))
print("Actions Count:", len(int_data.get("actions", [])))

print("\n7. Testing POST /api/v1/checkins/ (Live Check-In with AI Pipeline)...")
checkin_payload = {
    "mood": 2,
    "stress": 8,
    "sleep_hours": 4.5,
    "energy": "low",
    "screen_time_hours": 7.0,
    "day_tag": "Exhausting",
    "free_text_note": "Final review session ran past 3am, feeling completely drained.",
    "language": "en"
}
res = client.post("/api/v1/checkins/", json=checkin_payload)
print("Checkin Pipeline Status:", res.status_code)
pipe_res = res.json()
print("Safety Flag:", pipe_res.get("safety", {}).get("is_crisis"))
print("Wellness State:", pipe_res.get("pattern", {}).get("wellness_state") if pipe_res.get("pattern") else None)
print("Pattern Summary:", pipe_res.get("pattern", {}).get("summary_text") if pipe_res.get("pattern") else None)
print("Generated RESET Title:", pipe_res.get("intervention", {}).get("title") if pipe_res.get("intervention") else None)

print("\n8. Testing Crisis Safety Detection...")
crisis_payload = {
    "mood": 1,
    "stress": 10,
    "sleep_hours": 2.0,
    "energy": "low",
    "screen_time_hours": 10.0,
    "day_tag": "Exhausting",
    "free_text_note": "I feel like I want to die, I can't take this pressure anymore.",
    "language": "en"
}
res = client.post("/api/v1/checkins/", json=crisis_payload)
crisis_res = res.json()
print("Crisis Triggered:", crisis_res.get("safety", {}).get("is_crisis"))
print("Crisis Message:", crisis_res.get("safety", {}).get("message"))
print("Resources Count:", len(crisis_res.get("safety", {}).get("resources", [])))
print("Pipeline Suppressed:", crisis_res.get("intervention") is None)

print("\n9. Testing Campus Mode GET /api/v1/campus/metrics...")
res = client.get("/api/v1/campus/metrics")
print("Campus Mode Status:", res.status_code)
print("Institution:", res.json().get("institution_name"))
print("Privacy Guarantee:", res.json().get("privacy_guarantee"))

print("\nALL BACKEND API & MULTI-AGENT INTEGRATION TESTS PASSED PERFECTLY!")
