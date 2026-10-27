# 🌿 Rosa-sinensis Leaf Health Diagnostic System

> **Early Detection of Nutrient Deficiencies in *Hibiscus rosa-sinensis* using Multi-Stage Vascular & Chlorosis Computer Vision Architecture**

---

## 📁 Clean Project Architecture

```
clean_project/
├── backend/                       # Python FastAPI Backend
│   ├── app.py                     # Main FastAPI application & REST endpoints
│   ├── requirements.txt           # Pinned backend dependencies
│   ├── config/
│   │   ├── __init__.py
│   │   └── thresholds.py          # Calibrated botanical thresholds & baselines
│   ├── pipeline/                  # 12-Stage Computer Vision & Vascular Engine
│   │   ├── preprocessing.py       # Denoising, CLAHE, luminance normalization
│   │   ├── segmentation.py        # Leaf lamina Otsu/HSV contour segmentation
│   │   ├── vein_extraction.py     # Canny, adaptive thresholding, skeletonization
│   │   ├── feature_extraction.py  # Vein density, thickness, contrast, DGCI, ExG
│   │   ├── decision_engine.py     # Rule-based botanical verdict engine
│   │   ├── species_check.py       # Hibiscus rosa-sinensis species verification
│   │   ├── deficiency_typing.py   # Nutrient deficiency pattern classification (N, Fe, Mg)
│   │   ├── report_generator.py    # Report assembly & visual heatmap overlays
│   │   └── pipeline.py            # End-to-end pipeline orchestrator
│   ├── severity/                  # Multi-Paradigm Severity Classification Engine
│   │   ├── rule_based.py          # Mathematical severity scoring formula (0-100)
│   │   ├── recommendations.py     # Actionable horticultural interventions
│   │   ├── ml_model.py            # Random Forest & SVM classifiers
│   │   ├── dl_model.py            # MobileNetV2 deep learning classifier + Grad-CAM
│   │   └── compare.py             # Multi-methodology consensus & benchmark runner
│   └── models/                    # Saved machine learning models & weights
│       ├── rf_severity_model.joblib
│       ├── svm_severity_model.joblib
│       └── mobilenetv2_severity.pth
├── frontend/                      # Modern React Single Page Application (SPA)
│   ├── index.html                 # HTML entry point with Google Fonts
│   ├── package.json               # React, Vite, Tailwind CSS, Lucide icons
│   ├── vite.config.js             # Vite configuration
│   ├── tailwind.config.js         # Tailwind theme & color tokens
│   ├── src/                       # React components & state management
│   │   ├── App.jsx                # Main dashboard & view switcher
│   │   ├── api.js                 # Unified backend API connector
│   │   └── components/            # Reusable UI components
│   │       ├── Header.jsx         # Navigation & backend status indicator
│   │       ├── UploadSection.jsx  # Drag-and-drop file upload & preset picker
│   │       ├── CameraModal.jsx    # Real-time web camera specimen capture
│   │       ├── RoiOutliner.jsx    # Interactive canvas polygon ROI tracing
│   │       ├── ScanningView.jsx   # Radar pulse scan animation during analysis
│   │       ├── DiagnosticReport.jsx # Full report, 12-stage viewer, recommendations
│   │       └── LightboxModal.jsx  # Fullscreen high-res stage inspection
│   └── dist/                      # Pre-built production bundle (served directly by FastAPI)
├── sample_data/                   # Curated specimen images for one-click testing
│   ├── healthy.jpeg               # Baseline healthy hibiscus leaf
│   ├── mild.jpeg                  # Early interveinal chlorosis (Fe deficiency)
│   ├── moderate.jpeg              # Established chlorosis across lamina (Mg/N)
│   ├── severe.jpeg                # Critical chlorosis with vascular breakdown
│   ├── non_hibiscus.jpeg          # Specimen rejection control (smooth margins)
│   └── sample_images/             # Additional numbered specimens (1.jpeg - 8.jpeg)
├── run_backend.py                 # Single Python launcher (FastAPI + React SPA)
├── start_app.bat                  # One-click Windows desktop launcher
├── start_dev.bat                  # One-click developer launcher (Vite + FastAPI reload)
├── .gitignore                     # Git ignore rules for Python, Node, and cache
└── README.md                      # Documentation & Viva Reference
```

---

## 🚀 How to Run

### Option 1: One-Click Startup (Recommended)
Double-click **`start_app.bat`**.
* Launches the FastAPI server at `http://localhost:5000`.
* Automatically opens your browser displaying the full React web dashboard.

### Option 2: Python Command Line
```bash
python run_backend.py
```

### Option 3: Developer Mode (Live Hot Reload)
Double-click **`start_dev.bat`** or run:
```bash
# Terminal 1: Backend
cd backend
uvicorn app:app --reload --port 5000

# Terminal 2: Frontend
cd frontend
npm run dev
```

---

## 🔬 The 12 Computer Vision Preprocessing Stages

Each leaf specimen passes through 12 distinct, inspectable image processing stages:

| Stage # | Stage Name | Technical Method | Botanical Purpose |
|---|---|---|---|
| **01** | Raw Input Leaf | RGB Photographic Acquisition | Baseline captured specimen under transmitted light. |
| **02** | Resized Specimen | Aspect-preserved bilinear scale (1024px) | Standardizes pixel metrics across camera sensors. |
| **03** | Bilateral Denoised | Non-local means bilateral filtering | Suppresses surface sensor noise while preserving vascular edges. |
| **04** | CLAHE Normalization | Contrast Limited Adaptive Histogram Equalization | Enhances local vein luminance against lamina tissue. |
| **05** | Leaf Segmentation Mask | Otsu & HSV chromatic thresholding | Isolates foliar tissue from experimental background. |
| **06** | Grayscale Lamina | Single-channel luminance isolation | Prepares specimen for multi-scale gradient filtering. |
| **07** | Local Enhancement | High-clip local CLAHE ($clip=4.0$) | Amplifies minor secondary and tertiary vascular contrast. |
| **08** | Adaptive Veins | Gaussian adaptive local thresholding | Extracts fine, low-contrast lateral veins. |
| **09** | Frangi Vesselness | Hessian eigenvalue tubular filter | Detects continuous tubular vascular ridge structures. |
| **10** | Combined Vascular Net | Morphological union & closing | Unifies primary, secondary, and fine lateral veins. |
| **11** | Vein Skeleton | Morphological thinning / medial axis | Reduces vascular network to 1-pixel topological skeleton. |
| **12** | Vein Overlay | Multi-spectral BGR composite | Overlays vascular architecture onto original lamina. |

---

## 📊 Performance Metrics

* **Diagnostic Accuracy**:
  * **Rule-Based Engine:** $85.7\%$ *(100% transparent, 0 training)*
  * **Classical ML (Random Forest & SVM):** $100.0\%$ *(on reference set, 71.4% LOOCV)*
  * **Deep Learning (MobileNetV2):** $92.9\%$
* **Model Consensus**: $78.6\%$ 4-way unanimous consensus across all paradigms.
* **Botanical Metrics**:
  * **Vein Density ($V_\rho$):** Ratio of skeleton pixels to total lamina area.
  * **Yellow Pixel Ratio ($Y_r$):** Percentage of chlorotic tissue.
  * **DGCI (Dark Green Color Index):** Foliar chlorophyll & nitrogen correlation.
  * **ExG (Excess Green Index):** Vegetation extraction index ($2G - R - B$).
  * **Vascular Branch Points ($N_{bp}$):** Topological complexity measure.

---

## 🌍 UN Sustainable Development Goals (SDGs)

* **Primary SDGs**:
  * **SDG 2: Zero Hunger** *(Target 2.4 — Sustainable Agriculture & Crop Health)*
  * **SDG 15: Life on Land** *(Target 15.5 — Terrestrial Ecosystems & Flora Conservation)*
* **Secondary SDGs**:
  * **SDG 12: Responsible Consumption and Production** *(Target 12.4 — Reducing chemical over-fertilization)*
  * **SDG 9: Industry, Innovation, and Infrastructure** *(Target 9.5 — Accessible digital diagnostic tools)*
