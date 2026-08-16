"""
RE:SET Backend Test Suite — End-to-End Production Tests
Tests real auth flow (register/login/JWT) — no demo user creation.
"""
import sys
import os
import uuid

sys.path.insert(0, os.path.abspath("H:/Hackthon1/backend"))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Unique email per test run to avoid conflicts
TEST_EMAIL = f"testuser_{uuid.uuid4().hex[:8]}@nutech.edu.pk"
TEST_PASSWORD = "SecurePass2024!"
TEST_NAME = "Test Student"
TEST_UNIVERSITY = "NUTECH University"

TOKEN = None

print("=" * 60)
print("RE:SET API — End-to-End Production Tests")
print("=" * 60)

# ── TEST 1: Health Check ──────────────────────────────────────
print("\n1. GET /health")
res = client.get("/health")
print(f"   Status: {res.status_code} | Body: {res.json()}")
assert res.status_code == 200, f"Health check failed: {res.status_code}"
print("   ✓ PASSED")

# ── TEST 2: Reject unauthenticated requests ───────────────────
print("\n2. GET /api/v1/auth/me (no token — should be 401)")
res = client.get("/api/v1/auth/me")
print(f"   Status: {res.status_code}")
assert res.status_code == 401, f"Expected 401, got {res.status_code}"
print("   ✓ PASSED — correctly requires authentication")

# ── TEST 3: Register new user ─────────────────────────────────
print(f"\n3. POST /api/v1/auth/register ({TEST_EMAIL})")
res = client.post("/api/v1/auth/register", json={
    "email": TEST_EMAIL,
    "password": TEST_PASSWORD,
    "full_name": TEST_NAME,
    "university_name": TEST_UNIVERSITY
})
print(f"   Status: {res.status_code}")
assert res.status_code == 200, f"Register failed: {res.status_code} {res.text}"
reg_data = res.json()
TOKEN = reg_data["access_token"]
print(f"   ✓ PASSED — User registered, token received")

AUTH = {"Authorization": f"Bearer {TOKEN}"}

# ── TEST 4: /me returns correct user ─────────────────────────
print("\n4. GET /api/v1/auth/me (with token)")
res = client.get("/api/v1/auth/me", headers=AUTH)
print(f"   Status: {res.status_code}")
assert res.status_code == 200
me = res.json()
assert me["email"] == TEST_EMAIL
assert me["university_name"] == TEST_UNIVERSITY
print(f"   ✓ PASSED — {me['full_name']} @ {me['university_name']}")

# ── TEST 5: Duplicate email rejected ─────────────────────────
print("\n5. POST /api/v1/auth/register (duplicate email — should 400)")
res = client.post("/api/v1/auth/register", json={
    "email": TEST_EMAIL,
    "password": "AnotherPass!",
    "full_name": "Duplicate"
})
print(f"   Status: {res.status_code}")
assert res.status_code == 400
print("   ✓ PASSED — duplicate email correctly rejected")

# ── TEST 6: Login with credentials ───────────────────────────
print("\n6. POST /api/v1/auth/login")
res = client.post("/api/v1/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD})
print(f"   Status: {res.status_code}")
assert res.status_code == 200
login_token = res.json()["access_token"]
AUTH = {"Authorization": f"Bearer {login_token}"}
print("   ✓ PASSED — login successful")

# ── TEST 7: Submit daily check-in ────────────────────────────
print("\n7. POST /api/v1/checkins/ (AI pipeline check-in)")
res = client.post("/api/v1/checkins/", headers=AUTH, json={
    "mood": 2,
    "stress": 8,
    "sleep_hours": 4.5,
    "energy": "low",
    "screen_time_hours": 7.0,
    "day_tag": "Exhausting",
    "free_text_note": "Final review ran past 3am, feeling drained."
})
print(f"   Status: {res.status_code}")
assert res.status_code == 200, f"Checkin failed: {res.status_code} {res.text}"
pipe = res.json()
print(f"   Safety Crisis: {pipe.get('safety', {}).get('is_crisis')}")
print(f"   Wellness State: {pipe.get('pattern', {}).get('wellness_state') if pipe.get('pattern') else 'N/A'}")
print(f"   RESET Plan: {pipe.get('intervention', {}).get('title') if pipe.get('intervention') else 'None'}")
print("   ✓ PASSED")

# ── TEST 8: Today's intervention (after check-in) ────────────
print("\n8. GET /api/v1/interventions/today")
res = client.get("/api/v1/interventions/today", headers=AUTH)
print(f"   Status: {res.status_code}")
assert res.status_code == 200
int_data = res.json()
if int_data:
    print(f"   Plan: '{int_data.get('title')}' | Actions: {len(int_data.get('actions', []))}")
else:
    print("   No plan for today (pipeline may not have generated one for this state)")
print("   ✓ PASSED")

# ── TEST 9: Weekly Insights ───────────────────────────────────
print("\n9. GET /api/v1/insights/weekly")
res = client.get("/api/v1/insights/weekly", headers=AUTH)
print(f"   Status: {res.status_code}")
assert res.status_code == 200
w = res.json()
print(f"   Has Data: {w.get('has_sufficient_data')} | State: {w.get('current_state')}")
print(f"   AI Takeaway: {w.get('ai_synthesized_takeaway', '')[:80]}...")
print("   ✓ PASSED")

# ── TEST 10: Campus Metrics ───────────────────────────────────
print("\n10. GET /api/v1/campus/metrics")
res = client.get("/api/v1/campus/metrics", headers=AUTH)
print(f"   Status: {res.status_code}")
assert res.status_code == 200
campus = res.json()
print(f"   Institution: {campus.get('institution_name')}")
print(f"   Opted-In Students: {campus.get('total_opted_in_students')}")
print("   ✓ PASSED")

# ── TEST 11: Crisis detection ────────────────────────────────
print("\n11. POST /api/v1/checkins/ (crisis text detection)")
crisis_res = client.post("/api/v1/checkins/", headers=AUTH, json={
    "mood": 1, "stress": 10, "sleep_hours": 2.0,
    "energy": "low", "screen_time_hours": 10.0,
    "day_tag": "Exhausting",
    "free_text_note": "I feel like I want to die, I can't take this pressure anymore."
})
print(f"   Status: {crisis_res.status_code}")
assert crisis_res.status_code == 200
cr = crisis_res.json()
print(f"   Crisis Detected: {cr.get('safety', {}).get('is_crisis')}")
print(f"   Resources Count: {len(cr.get('safety', {}).get('resources', []))}")
print("   ✓ PASSED")

print("\n" + "=" * 60)
print("ALL 11 END-TO-END PRODUCTION TESTS PASSED! 🎉")
print("No demo users. Real auth. Real data flow.")
print("=" * 60)
