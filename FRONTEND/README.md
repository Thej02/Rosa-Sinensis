# Rosa-sinensis Leaf Health Diagnostic - React Frontend

Modern React application built with **Vite**, **Tailwind CSS v3**, and **Lucide React Icons**, providing a diagnostic UI for the *Hibiscus rosa-sinensis* Computer Vision backend.

## Tech Stack
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS v3 + Botanical Theme Tokens (Plus Jakarta Sans & JetBrains Mono)
- **Icons**: Lucide React
- **Backend API**: Flask (`/api/...`) connecting to `leafvein_rework` OpenCV pipeline

## Features
1. **Interactive Specimen Input**:
   - Drag-and-drop file upload
   - Live camera picture capture modal with real HTML5 `<video>` stream
   - 5 calibrated benchmark sample presets (`Healthy`, `Mild`, `Moderate`, `Severe`, `Non-Hibiscus Species`)
2. **Interactive Leaf ROI Outlining**:
   - Freehand canvas lasso with touch & mouse tracking
   - Clear, Redo, Use Whole Image, and Confirm Leaf Area
3. **Animated Laser Scanning**:
   - Specimen preview with laser beam animation & spinning indicator
4. **Comprehensive Layman & Diagnostic Report**:
   - Large status banner (Healthy, Unhealthy with Severity badge or Species Rejection)
   - 3 Plain-Language Layman Cards (Health Score, Affected Area, Care Recommendation)
   - Flagged Signals Callout Cards (measured value vs calibrated threshold)
   - Deterministic Decision Engine Reasoning Box
   - 4 Visual Inspection Panels with Lightbox Zoom (Original Photo, Stage 12 Vein Skeleton, Flagged Unhealthy Regions, Annotated Composite)
   - 10 Biophysical Metrics Accordion (`config/thresholds.py`)
   - All 12 Preprocessing Stages Gallery
   - Complete Console ASCII Assessment Report with copy button
   - Actions: Download `.txt` Report, Print, and Scan Another Leaf

## Running the Application

### Option A: Standard Production Mode (via Flask Server)
Run from project root:
```bash
python run_app.py
```
Or double-click `start_project.bat`. The app opens at `http://localhost:5000`.

### Option B: Development Mode with Hot-Module Replacement (HMR)
1. Start Flask API server on port 5000:
   ```bash
   python run_app.py
   ```
2. Start Vite dev server on port 5173:
   ```bash
   cd frontend-react
   npm run dev
   ```
   Or double-click `start_react_dev.bat` from the root directory.
   The Vite dev server opens at `http://localhost:5173` with automatic proxying to `/api` on port 5000.
