# RE:SET — Deployment Guide

## Architecture
- **Frontend**: Vercel (React/Vite static site)
- **Backend**: Render.com (FastAPI Python web service)
- **Database**: Supabase PostgreSQL (already configured)
- **AI**: AIML API (already configured)

---

## Step 1 — Push to GitHub

```bash
cd H:\Hackthon1
git init
git add .
git commit -m "feat: RE:SET Wellness Engine v1.0 - CS Girlies Hackathon"
```

Then create a **public** repo on GitHub and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/reset-wellness.git
git branch -M main
git push -u origin main
```

---

## Step 2 — Deploy Backend on Render

1. Go to **https://render.com** → Sign up with GitHub
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repo
4. Fill in the settings:
   - **Name**: `reset-wellness-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: Free
5. Under **"Environment Variables"**, add:

   | Key | Value |
   |-----|-------|
   | `SECRET_KEY` | `any-random-long-string-here` |
   | `DATABASE_URL` | `postgresql://postgres.nwlypyjuxqfhzpymiytd:3SM49hyFv%3F%2BC%23FL@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres` |
   | `AIML_API_KEY` | `cb3d6e4d523dc160267fc08c631e210e` |
   | `AIML_API_BASE_URL` | `https://api.aimlapi.com/v1` |
   | `AIML_MODEL` | `gpt-4o-mini` |
   | `ALLOW_ALL_ORIGINS` | `true` (temporary, change after Vercel deploy) |

6. Click **"Create Web Service"** — Wait ~3 minutes for build
7. Your backend URL will be: `https://reset-wellness-api.onrender.com`
8. Test it: `https://reset-wellness-api.onrender.com/health` → should return `{"status":"healthy"}`

---

## Step 3 — Deploy Frontend on Vercel

1. Go to **https://vercel.com** → Sign up with GitHub
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repo
4. Configure:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Under **"Environment Variables"**, add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://reset-wellness-api.onrender.com` |

6. Click **"Deploy"** — Wait ~1 minute
7. Your frontend URL will be: `https://reset-wellness-XXXX.vercel.app`

---

## Step 4 — Connect Frontend ↔ Backend (CORS)

After Vercel gives you the URL:

1. Go to **Render Dashboard** → Your backend service → **Environment**
2. Update `FRONTEND_URL` to your Vercel URL:
   ```
   https://reset-wellness-XXXX.vercel.app,http://localhost:5173
   ```
3. Change `ALLOW_ALL_ORIGINS` to `false`
4. Click **"Save Changes"** → Render will redeploy automatically

---

## Step 5 — Verify Everything Works

Open your Vercel URL and:
1. ✅ Auth page loads (split-screen design)
2. ✅ Register a new account
3. ✅ Submit a check-in → AI pipeline runs
4. ✅ RESET Plan appears
5. ✅ Weekly Insights loads

---

## Useful URLs After Deployment

| Service | URL |
|---------|-----|
| Frontend (Live App) | `https://reset-wellness-XXXX.vercel.app` |
| Backend API | `https://reset-wellness-api.onrender.com` |
| API Documentation | `https://reset-wellness-api.onrender.com/docs` |
| Health Check | `https://reset-wellness-api.onrender.com/health` |

---

## ⚠️ Important Notes

- **Render free tier sleeps after 15 min of inactivity.** First request after sleep takes ~30 seconds to wake up. This is normal for hackathons.
- **Supabase** is already in production — your data persists across redeploys.
- **Never commit `.env.local` or `.env.production`** — they're in `.gitignore`.
