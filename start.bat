@echo off
echo ===================================================
echo   Starting RE:SET Student Wellness System
echo ===================================================
echo.

echo [1/2] Starting FastAPI Backend on port 8000...
start cmd /k "cd backend && uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React + Vite Frontend on port 5173...
start cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo   RE:SET is running!
echo   Frontend: http://localhost:5173
echo   Backend Docs: http://127.0.0.1:8000/docs
echo ===================================================
