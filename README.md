# RE:SET — AI-Powered Early Wellness Intervention System

> **Track: Health (Advanced) · CS Girlies "Technology for Wellness" Hackathon 2025**

RE:SET is a production-grade student wellness engine that detects early signs of burnout from daily behavioral signals (sleep, stress, mood, energy, screen time) and delivers personalized 15-minute micro-recovery plans — powered by a pipeline of 6 cooperating AI agents.

---

## ✨ What It Does

1. **30-Second Daily Check-In** — Students enter 6 behavioral signals per day.
2. **6-Agent AI Pipeline fires instantly:**
   - **Safety Agent** — High-recall distress classifier. On crisis signal: suppresses recommendations and routes to 24/7 helplines (Umang Pakistan, Rozan, International 988).
   - **Pattern Agent** — Computes 3-day & 7-day rolling behavioral deltas, generates non-clinical summaries.
   - **Risk/Trend Agent** — Classifies state: `Stable`, `Needs Attention`, or `Recovery Needed`.
   - **Personalization Agent** — Maps patterns to targeted recovery categories.
   - **Intervention Agent** — Generates "Today's RESET": 3–4 timed recovery actions + reflection prompt.
   - **Reflection Agent** — Next-day correlation analysis to adapt future recommendations.
3. **"What Changed?" Diagnostic** — On-demand comparative analysis vs personal rolling baseline.
4. **Recovery Readiness Index** — Transparent weighted formula:
   ```
   Readiness = 0.25×Sleep + 0.25×Stress + 0.20×Energy + 0.15×Activity + 0.15×Digital
   ```
5. **Campus Mode** — University-wide aggregate wellness metrics with strict k-anonymity (N ≥ 20).
6. **Privacy Controls** — One-click data export (JSON) + hard account deletion from Supabase.

---

## 🏗️ Architecture

```
Frontend (React + TypeScript + Vite + Tailwind)
      ↕ REST API (JWT Bearer)
Backend (FastAPI + SQLAlchemy + Python)
      ↕
  Supabase PostgreSQL (Production)
      ↕
  AIML API → gpt-4o-mini
  (Safety, Pattern, Risk, Personalization, Intervention, Reflection Agents)
```

---

## 🚀 Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
- API Docs: http://127.0.0.1:8000/docs
- Health: http://127.0.0.1:8000/health

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
- App: http://localhost:5173

### 3. One-click (Windows)
```bash
start.bat
```

---

## 🧪 Testing the App (Judges)

1. Open http://localhost:5173
2. Click **Create Account** → fill Name, University, Email, Password
3. You land on the **Daily Check-In** — set your mood, stress, sleep, energy
4. Hit **Submit** — watch the 6-agent AI pipeline analyze your signals (~3-5 sec)
5. Navigate to **Today's RESET** — start the circular timer on any action
6. Check **Weekly Insights** after 2+ check-ins
7. Open **"Why do I feel different?"** for the What Changed diagnostic
8. Visit **Campus Mode** to see institutional aggregate data
9. Visit **Data & Privacy** to test export and account controls

**To test the Safety Agent:** In the Optional Note field, type `"I want to die"` — the crisis modal with helplines appears immediately.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python 3.11, FastAPI, SQLAlchemy |
| Database | Supabase PostgreSQL (ap-northeast-1) |
| AI Model | AIML API → `gpt-4o-mini` (free tier) |
| Auth | JWT Bearer tokens (python-jose) |
| Design | Glassmorphism, Inter font, SVG animations |

---

## 📁 Project Structure

```
Hackthon1/
├── backend/
│   ├── app/
│   │   ├── agents/          # 6 AI agents + orchestrator
│   │   │   ├── safety_agent.py
│   │   │   ├── pattern_agent.py
│   │   │   ├── risk_trend_agent.py
│   │   │   ├── personalization_agent.py
│   │   │   ├── intervention_agent.py
│   │   │   ├── reflection_agent.py
│   │   │   ├── what_changed_agent.py
│   │   │   └── orchestrator.py
│   │   ├── routers/         # FastAPI route handlers
│   │   ├── models.py        # SQLAlchemy ORM models
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   ├── config.py        # Environment & API key config
│   │   └── main.py          # App entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # All React UI components
│   │   ├── App.tsx          # Root app with auth flow
│   │   ├── api.ts           # REST API client
│   │   └── types.ts         # TypeScript interfaces
│   └── package.json
└── README.md
```

---

## 🔒 Privacy & Safety

- No hardware sensors (camera, mic, GPS, biometrics) are ever accessed
- No personally identifiable data is used in Campus Mode (k-anonymity enforced)
- All data is deletable on demand — immediate cascade delete from Supabase
- RE:SET is a **behavioral wellness tool, not a clinical diagnostic service**

---

## 🏆 Hackathon Track

- **Primary:** Health (Advanced)
- **Bonus:** Best Use of AI — 6 cooperating LLM agents with structured JSON pipelines, crisis safety classifier, and personalized recovery generation
