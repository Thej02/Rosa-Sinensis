@echo off
title Rosa-sinensis Dev Environment
echo ======================================================================
echo Starting Development Mode (FastAPI Backend + Vite Hot-Reload Frontend)
echo ======================================================================

cd /d "%~dp0"

:: Start FastAPI server in a new window
start "FastAPI Backend (Port 5000)" cmd /k "cd backend && uvicorn app:app --reload --port 5000"

:: Start Vite dev server in the current window
cd frontend
echo Starting Vite Dev Server on http://localhost:5173 ...
npm run dev
