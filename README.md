<div align="center">

# 🌿 RE:SET — AI-Powered Early Wellness Intervention System

### _Detecting subtle student routine deterioration & delivering personalized micro-recovery before acute burnout._

[![Hackathon](https://img.shields.io/badge/CS%20Girlies%20Hackathon-Technology%20For%20Wellness-10b981?style=for-the-badge&logo=target)](https://cs-girlies-wellness-hackathon.devpost.com/)
[![Track](<https://img.shields.io/badge/Track-Health%20(Advanced)%20%2B%20Best%20Use%20of%20AI-6366f1?style=for-the-badge>)](https://devpost.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Python%203.11-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-38bdf8?style=for-the-badge&logo=react)](https://react.dev)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com)
[![AI Engine](https://img.shields.io/badge/AI%20Pipeline-6--Agent%20Cooperative%20LLM-f59e0b?style=for-the-badge&logo=openai)](https://aimlapi.com)

</div>

---

## 📌 Executive Summary

University students often do not recognize acute burnout until exam failure, chronic insomnia, or mental health breakdown occurs. Traditional mental health applications either act as generic symptom journals or attempt clinical therapy without appropriate medical authority.

**RE:SET** bridges this critical gap as an **Early Intervention System**:

1. **Low Friction**: Daily check-in takes `< 30 seconds` (5 biometric/lifestyle sliders + 1 qualitative tag + optional context).
2. **6-Agent Cooperative AI Pipeline**: Analyzes signals via an orchestrated multi-agent network to detect rolling statistical anomalies across 3-day and 7-day windows.
3. **Actionable Micro-Recovery**: Delivers **Today's RESET** — 3 timed micro-actions (5–15 mins total) targeted at the user's specific physiological strain.
4. **Adaptive Learning**: A dedicated **Reflection Agent** evaluates next-day biological response to observe what recovery practices actually worked.
5. **Safety-First Architecture**: An independent **Safety Agent** intercepts severe psychological distress in real-time, completely halts AI generation, and routes students to accredited 24/7 emergency helplines.

---

## 🏛️ System Architecture

RE:SET is engineered as a decoupled, asynchronous multi-tier platform built with **FastAPI**, **React (TypeScript)**, **Supabase PostgreSQL**, and the **AIML API (GPT-4o-mini)**.

<div align="center">
  <img src="docs/images/system_architecture.png" alt="RE:SET System Architecture Diagram" width="950" />
</div>

---

## 🤖 The 6-Agent Cooperative AI Pipeline

Instead of a generic single-prompt chatbot, RE:SET passes state deterministically through a sequential chain of specialized micro-agents:

<div align="center">
  <img src="docs/images/ai_pipeline_workflow.png" alt="6-Agent Cooperative AI Pipeline Flowchart" width="950" />
</div>

### Agent Roster & Responsibilities

| #     | Agent Name                | Core Responsibility                                                         | Input                             | Output                                                 |
| ----- | ------------------------- | --------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------ |
| **1** | **Safety Agent**          | High-recall crisis screener for self-harm & acute psychological emergencies | Free text notes + sentiment       | `is_crisis: bool`, verified human helpline routing     |
| **2** | **Pattern Agent**         | Computes 3-day & 7-day rolling statistical deltas                           | Signal histories                  | `%` deviation vector & objective narrative             |
| **3** | **Risk / Trend Agent**    | Classifies aggregate deterioration state                                    | Pattern vectors                   | `STABLE` \| `NEEDS_ATTENTION` \| `RECOVERY_NEEDED`     |
| **4** | **Personalization Agent** | Maps strained dimensions to recovery modes                                  | State + completion history        | Target domain (Somatic, Cognitive, Sensory, Circadian) |
| **5** | **Intervention Agent**    | Generates 3–4 timed actionable micro-steps                                  | Target domain + user context      | Complete **RESET Plan** with timer durations & icons   |
| **6** | **Reflection Agent**      | Compares next-day check-in to observe recovery correlation                  | $T$ and $T+1$ signal deltas       | Effectiveness adaptation score                         |
| **7** | **"What Changed?" Agent** | Diagnoses primary lifestyle factor causing current state                    | 7-day window vs personal baseline | Ranked contributing factors & plain-language summary   |

---

## 📱 User Interface Showcase

<div align="center">

### 1. Split-Screen Auth & Onboarding

<img src="docs/images/ui_auth.png" alt="RE:SET Authentication Interface" width="900" />

### 2. Daily Check-In & Live Readiness Gauge

<img src="docs/images/ui_checkin.png" alt="RE:SET Daily Check-In" width="900" />

### 3. Today's RESET Micro-Recovery Plan (with Circular Timer)

<img src="docs/images/ui_reset_plan.png" alt="Today's RESET Plan" width="900" />

### 4. Weekly Analytics & Signal Deltas

<img src="docs/images/ui_insights.png" alt="Weekly Analytics Dashboard" width="900" />

</div>

---

## 🔒 Security, Privacy & Ethical Guardrails

<div align="center">
  <img src="docs/images/privacy_security_flow.png" alt="Privacy & Safety Guardrails" width="950" />
</div>

- **Non-Diagnostic Policy**: RE:SET explicitly states on all pages that it is a _lifestyle and behavioral habit support tool_, not a clinical or medical diagnostic device.
- **k-Anonymity ($N \ge 20$)**: Institutional Campus Mode only displays aggregate student metrics when a minimum cohort size of 20 students from that university participate.
- **Complete Data Ownership**: Students can download all raw check-ins, signals, and agent outputs as a structured JSON file at any time, or permanently delete their account with immediate database cascade wipe.

---

## 🛠️ Tech Stack Matrix

| Component               | Technology               | Version   | Purpose                                           |
| ----------------------- | ------------------------ | --------- | ------------------------------------------------- |
| **Frontend Framework**  | React + TypeScript       | `18.2.0`  | Strongly-typed single page application            |
| **Build Tooling**       | Vite                     | `5.1.6`   | Lightning-fast HMR and optimized chunk bundling   |
| **Styling & Design**    | Tailwind CSS             | `3.4.1`   | Curated dark-mode glassmorphic aesthetic          |
| **Icons & UI**          | Lucide React             | `0.359.0` | Accessible, modern iconography                    |
| **Backend Framework**   | FastAPI (Python)         | `0.111.0` | High-performance async ASGI web framework         |
| **ASGI Server**         | Uvicorn                  | `0.29.0`  | Production ASGI web server                        |
| **ORM & Database**      | SQLAlchemy + psycopg2    | `2.0.30`  | Object Relational Mapping & PostgreSQL driver     |
| **Database Host**       | Supabase PostgreSQL      | `15.x`    | Managed cloud PostgreSQL with transaction pooler  |
| **AI LLM API**          | AIML API (`gpt-4o-mini`) | `v1`      | Multi-agent reasoning, classification & synthesis |
| **Auth & Cryptography** | python-jose + passlib    | `3.3.0`   | JWT Bearer token generation & Bcrypt hashing      |

---

## 🚀 Quickstart & Local Testing

### Prerequisites

- **Python**: `3.11+`
- **Node.js**: `18.x+` (with npm)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/codedbyasim/RE-SET-AI-Powered-Early-Wellness-Intervention-System.git
cd RE-SET-AI-Powered-Early-Wellness-Intervention-System
```

### 2. Configure Environment Variables

**Backend (`backend/.env`):**

```ini
PROJECT_NAME="RE:SET Wellness Engine"
VERSION="1.0.0"
SECRET_KEY=your-secret-jwt-key
DB_USER=postgres.nwlypyjuxqfhzpymiytd
DB_PASSWORD=your-db-password
DB_HOST=aws-0-ap-northeast-1.pooler.supabase.com
DB_PORT=6543
DB_NAME=postgres
AIML_API_KEY=your-aiml-api-key
AIML_API_BASE_URL=https://api.aimlapi.com/v1
AIML_MODEL=gpt-4o-mini
```

**Frontend (`frontend/.env.local`):**

```ini
VITE_API_URL=
```

### 3. Start Backend Server

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API Health: `http://127.0.0.1:8000/health`
- Interactive Swagger Docs: `http://127.0.0.1:8000/docs`

### 4. Start Frontend Client

```bash
cd ../frontend
npm install
npm run dev
```

- Open `http://localhost:5173` in your browser.

---

## 🧪 Judge Walkthrough & Test Guide

1. **User Registration & Onboarding**:
   - Open `http://localhost:5173` → Click **Create Account**.
   - Enter your Name, University, Email, and Password.
2. **Submit a Daily Check-In**:
   - Adjust the sliders (Mood, Stress, Sleep, Energy, Screen Time).
   - Watch the **Live Readiness Gauge** animate dynamically.
   - Click **Submit Check-In** → The 6-Agent AI pipeline executes in ~3 seconds.
3. **Explore Today's RESET Plan**:
   - View the 3 tailored micro-actions generated for your strain profile.
   - Click **Start** on any step to activate the **SVG Circular Countdown Timer**.
   - Complete the closing reflection and finish the plan.
4. **Inspect "What Changed?" Diagnostic**:
   - Navigate to **Weekly Insights** → Click **"Why do I feel different?"**.
   - The diagnostic agent explains which lifestyle dimension shifted from your baseline.
5. **Campus Mode (Institutional Aggregate)**:
   - Click **Campus Mode** in the navbar to see anonymized cohort wellbeing trends.
6. **Safety Agent Crisis Test**:
   - In the check-in note, enter: _"I feel completely overwhelmed and want to die"_.
   - The **Safety Agent** intercepts immediately, suppresses LLM generation, and renders the 24/7 crisis emergency helpline modal.

---

## 🏆 CS Girlies Hackathon 2025 Submission Details

- **Hackathon**: [CS Girlies Annual Hackathon: Technology For Wellness](https://cs-girlies-wellness-hackathon.devpost.com/)
- **Primary Track**: **Health (Advanced Track)**
- **Bonus Track**: **Best Use of AI** (Multi-agent structured reasoning with safety guardrails)
- **Repository**: [GitHub Repository](https://github.com/codedbyasim/RE-SET-AI-Powered-Early-Wellness-Intervention-System)

---

<div align="center">
  <sub>Built with ❤️ for student wellness, resilience, and early recovery.</sub>
</div>
