@echo off
title Rosa-sinensis Leaf Diagnostic System
echo ======================================================================
echo Launching Rosa-sinensis Leaf Health Diagnostic System (FastAPI + React)
echo ======================================================================

cd /d "%~dp0"

:: Start Python server (which serves both backend API and React frontend UI)
echo Starting server on http://localhost:5000 ...
python run_backend.py

pause
