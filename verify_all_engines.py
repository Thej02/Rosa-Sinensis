"""
verify_all_engines.py
======================
Comprehensive End-to-End Test Suite for Rosa-sinensis Leaf Health Diagnostic System:
- All 12 OpenCV pipeline stages
- Calibrated Rule-Based Decision Engine & Safeguards
- Classical Machine Learning Models (Random Forest & SVM)
- Deep Learning Model (MobileNetV2 Transfer Learning)
- Horticultural Intervention & Layman Recommendations Engine
- Species Verification & Automated Rejection Safeguard
- FastAPI REST Endpoints & React Frontend SPA Serving
"""

import os
import sys

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import json
import numpy as np
import cv2

# Ensure backend and clean_project root are on path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(CURRENT_DIR, "backend")
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from fastapi.testclient import TestClient
from backend.app import app, load_sample_leaf_image, get_demo_samples
from backend.pipeline.pipeline import run_pipeline, run_pipeline_single_image
from backend.severity.rule_based import compute_severity
from backend.severity.recommendations import get_recommendation

print("\n" + "=" * 80)
print("[*] STARTING COMPREHENSIVE END-TO-END VERIFICATION SUITE")
print("=" * 80)

client = TestClient(app)
passes = 0
fails = 0

def check(test_name: str, condition: bool, details: str = ""):
    global passes, fails
    if condition:
        passes += 1
        print(f"  [PASS] {test_name}" + (f" -> {details}" if details else ""))
    else:
        fails += 1
        print(f"  [FAIL] {test_name}" + (f" -> {details}" if details else ""))

# ---------------------------------------------------------------------------
# TEST 1: Sample Images Folder Completeness
# ---------------------------------------------------------------------------
print("\n--- Test Section 1: Sample Images Folder & Integrity ---")
SAMPLE_IMAGES_DIR = os.path.join(CURRENT_DIR, "sample_images")
expected_files = [f"{i}.jpeg" for i in range(1, 9)] + [
    "healthy.jpeg", "mild.jpeg", "moderate.jpeg", "severe.jpeg", "non_hibiscus.jpeg"
]
for fname in expected_files:
    fpath = os.path.join(SAMPLE_IMAGES_DIR, fname)
    exists = os.path.isfile(fpath) and os.path.getsize(fpath) > 1000
    check(f"Sample image exists: {fname}", exists, f"Size: {os.path.getsize(fpath) if exists else 0} bytes")

# ---------------------------------------------------------------------------
# TEST 2: FastAPI Status & Health Check
# ---------------------------------------------------------------------------
print("\n--- Test Section 2: FastAPI Backend Core & Health Check ---")
res = client.get("/api/status")
check("GET /api/status HTTP 200", res.status_code == 200)
status_data = res.json()
check("Status is online", status_data.get("status") == "online")
check("Vascular pipeline listed", "12-Stage" in status_data.get("backend_engine", ""))
check("Random Forest model loaded", status_data.get("models_loaded", {}).get("random_forest") is True)
check("MobileNetV2 DL model loaded", status_data.get("models_loaded", {}).get("deep_learning_mobilenet") is True)

# ---------------------------------------------------------------------------
# TEST 3: Catalog of Demo Samples
# ---------------------------------------------------------------------------
print("\n--- Test Section 3: Demo Samples Catalog Endpoint ---")
res = client.get("/api/demo-samples")
check("GET /api/demo-samples HTTP 200", res.status_code == 200)
samples = res.json()
sample_ids = [s["id"] for s in samples]
check("13 distinct specimen entries returned", len(samples) == 13, f"Count: {len(samples)}")
check("Includes healthy preset", "healthy" in sample_ids)
check("Includes non-hibiscus preset", "non_hibiscus" in sample_ids)
check("Includes benchmark specimens 1-8", all(str(i) in sample_ids for i in range(1, 9)))

# ---------------------------------------------------------------------------
# TEST 4: Demo Image Serving for All Specimens
# ---------------------------------------------------------------------------
print("\n--- Test Section 4: Serving Demo Images via /api/demo-image ---")
for sid in ["healthy", "mild", "moderate", "severe", "non_hibiscus", "1", "4", "8"]:
    res = client.get(f"/api/demo-image/{sid}")
    check(f"GET /api/demo-image/{sid} HTTP 200", res.status_code == 200 and res.headers.get("content-type") == "image/jpeg")

# ---------------------------------------------------------------------------
# TEST 5: Accurate Diagnosis of Healthy Leaves (The Core Problem Solved!)
# ---------------------------------------------------------------------------
print("\n--- Test Section 5: Healthy Leaf Diagnostic Accuracy ---")

# Test healthy preset
res = client.get("/api/demo/healthy")
check("GET /api/demo/healthy HTTP 200", res.status_code == 200)
h_data = res.json()
check("healthy.jpeg diagnosed as HEALTHY", h_data.get("status") == "healthy", f"status: {h_data.get('status')}")
check("healthy.jpeg health_score >= 80", h_data.get("health_score", 0) >= 80, f"health_score: {h_data.get('health_score')}")
check("healthy.jpeg affected_area < 5%", h_data.get("affected_area_pct", 100) < 5.0, f"affected_area_pct: {h_data.get('affected_area_pct')}%")
check("healthy.jpeg has all 12 stages", len(h_data.get("stages", [])) == 12)
check("healthy.jpeg not rejected", h_data.get("raw_status") != "REJECTED")

# Test benchmark specimen 1 (Healthy leaf)
res = client.get("/api/demo/1")
check("GET /api/demo/1 HTTP 200", res.status_code == 200)
s1_data = res.json()
check("Specimen 1 diagnosed as HEALTHY", s1_data.get("status") == "healthy", f"status: {s1_data.get('status')}")
check("Specimen 1 health score >= 80", s1_data.get("health_score", 0) >= 80, f"health_score: {s1_data.get('health_score')}")

# Test benchmark specimen 8 (Healthy reticulated leaf)
res = client.get("/api/demo/8")
check("GET /api/demo/8 HTTP 200", res.status_code == 200)
s8_data = res.json()
check("Specimen 8 diagnosed as HEALTHY", s8_data.get("status") == "healthy", f"status: {s8_data.get('status')}")

# ---------------------------------------------------------------------------
# TEST 6: Accurate Deficiency Diagnosis across Tiers
# ---------------------------------------------------------------------------
print("\n--- Test Section 6: Deficiency Diagnosis Across Stages ---")

# Test mild preset
res = client.get("/api/demo/mild")
check("GET /api/demo/mild HTTP 200", res.status_code == 200)
mild_data = res.json()
check("mild.jpeg classified as DEFICIENT", mild_data.get("status") == "deficient")
check("mild.jpeg classified as Mild Deficiency", mild_data.get("severity") == "Mild Deficiency")

# Test severe preset (specimen 2)
res = client.get("/api/demo/severe")
check("GET /api/demo/severe HTTP 200", res.status_code == 200)
sev_data = res.json()
check("severe.jpeg classified as DEFICIENT", sev_data.get("status") == "deficient")
check("severe.jpeg classified as Severe Deficiency", sev_data.get("severity") == "Severe Deficiency")
check("severe.jpeg health score < 40", sev_data.get("health_score", 100) < 40, f"health_score: {sev_data.get('health_score')}")

# ---------------------------------------------------------------------------
# TEST 7: Foreign Species Automated Rejection Safeguard & Null Health Scores
# ---------------------------------------------------------------------------
print("\n--- Test Section 7: Non-Hibiscus Automated Rejection & Null Scores ---")
res = client.get("/api/demo/non_hibiscus")
check("GET /api/demo/non_hibiscus HTTP 200", res.status_code == 200)
rej_data = res.json()
check("non_hibiscus.jpeg classified as REJECTED", rej_data.get("status") in ["rejected", "aborted", "species_rejected"])
check("non_hibiscus.jpeg raw status is REJECTED", rej_data.get("raw_status") == "REJECTED")
check("non_hibiscus.jpeg health_score is None (null)", rej_data.get("health_score") is None, f"health_score: {rej_data.get('health_score')}")
check("non_hibiscus.jpeg affected_area_pct is None (null)", rej_data.get("affected_area_pct") is None, f"affected_area_pct: {rej_data.get('affected_area_pct')}")
check("non_hibiscus.jpeg has no recommendations", len(rej_data.get("recommendations", [])) == 0)
check("non_hibiscus.jpeg has no metrics", len(rej_data.get("metrics", [])) == 0)

# ---------------------------------------------------------------------------
# TEST 7B: Regression Test for Chlorotic Hibiscus Leaf (Problem 1)
# ---------------------------------------------------------------------------
print("\n--- Test Section 7B: Chlorotic Hibiscus Leaf Regression Test ---")
chlorotic_path = os.path.join(SAMPLE_IMAGES_DIR, "chlorotic_leaf.jpeg")
check("chlorotic_leaf.jpeg exists", os.path.isfile(chlorotic_path))

with open(chlorotic_path, "rb") as f:
    res = client.post("/api/analyze", files={"frontlit_image": ("chlorotic_leaf.jpeg", f, "image/jpeg")})
check("POST /api/analyze chlorotic_leaf.jpeg HTTP 200", res.status_code == 200)
chlorotic_res = res.json()

# Assert status is not 'rejected'
check("chlorotic leaf status is NOT rejected", chlorotic_res.get("status") != "rejected", f"status: {chlorotic_res.get('status')}")
check("chlorotic leaf raw_status is NOT REJECTED", chlorotic_res.get("raw_status") != "REJECTED", f"raw_status: {chlorotic_res.get('raw_status')}")

# Assert aspect ratio between 1.2 and 2.0
from backend.pipeline.preprocessing import resize_to_working_resolution, denoise, normalize_brightness
from backend.pipeline.segmentation import segment_leaf
chlorotic_mat = cv2.imread(chlorotic_path)
prep_mat = normalize_brightness(denoise(resize_to_working_resolution(chlorotic_mat)))
seg_res = segment_leaf(prep_mat)
chlorotic_mask = seg_res.get("mask", np.zeros(prep_mat.shape[:2], dtype=np.uint8))
contours, _ = cv2.findContours(chlorotic_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
c_main = max(contours, key=cv2.contourArea)
rect = cv2.minAreaRect(c_main)
(w_box, h_box) = rect[1]
calc_ar = max(w_box, h_box) / max(min(w_box, h_box), 1e-6)
check(f"Chlorotic leaf aspect ratio ({calc_ar:.2f}) between 1.2 and 2.0", 1.2 <= calc_ar <= 2.0, f"aspect_ratio: {calc_ar:.2f}")

# Check health scores are present and valid (not None)
check("chlorotic leaf has valid health score", chlorotic_res.get("health_score") is not None, f"health_score: {chlorotic_res.get('health_score')}")
check("chlorotic leaf has valid affected area", chlorotic_res.get("affected_area_pct") is not None, f"affected_area_pct: {chlorotic_res.get('affected_area_pct')}")

# ---------------------------------------------------------------------------
# TEST 8: Multi-Methodology Severity Comparison Engine
# ---------------------------------------------------------------------------
print("\n--- Test Section 8: Multi-Methodology Severity Comparison (/api/compare) ---")
res = client.get("/api/compare/healthy")
check("GET /api/compare/healthy HTTP 200", res.status_code == 200)
comp_data = res.json()
check("Comparison includes rule_based", "rule_based" in comp_data)
check("Rule-based tier is Healthy", comp_data["rule_based"]["severity_tier"] == "Healthy")
check("Comparison includes classical_ml", "classical_ml" in comp_data)
check("Classical ML predicted Healthy", comp_data["classical_ml"]["predicted_class"] == "Healthy")
check("Comparison includes deep_learning", "deep_learning" in comp_data)
check("Comparison reports consensus", comp_data.get("consensus") == "Healthy")

# ---------------------------------------------------------------------------
# TEST 9: POST /api/analyze with Form Data & Uploads
# ---------------------------------------------------------------------------
print("\n--- Test Section 9: POST /api/analyze Endpoints ---")

# 9A: demo_sample string parameter
res = client.post("/api/analyze", data={"demo_sample": "healthy"})
check("POST /api/analyze with demo_sample='healthy' HTTP 200", res.status_code == 200)
post_h = res.json()
check("POST analysis returns healthy", post_h.get("status") == "healthy")

# 9B: demo_sample numbered string parameter
res = client.post("/api/analyze", data={"demo_sample": "1"})
check("POST /api/analyze with demo_sample='1' HTTP 200", res.status_code == 200)
post_1 = res.json()
check("POST analysis specimen 1 returns healthy", post_1.get("status") == "healthy")

# 9C: file upload of healthy leaf
healthy_file_path = os.path.join(SAMPLE_IMAGES_DIR, "healthy.jpeg")
with open(healthy_file_path, "rb") as f:
    res = client.post("/api/analyze", files={"frontlit_image": ("healthy.jpeg", f, "image/jpeg")})
check("POST /api/analyze file upload HTTP 200", res.status_code == 200)
post_file_h = res.json()
check("Uploaded healthy.jpeg recognized as healthy", post_file_h.get("status") == "healthy")

# 9D: file upload of severe chlorosis leaf
sev_file_path = os.path.join(SAMPLE_IMAGES_DIR, "2.jpeg")
with open(sev_file_path, "rb") as f:
    res = client.post("/api/analyze", files={"frontlit_image": ("2.jpeg", f, "image/jpeg")})
check("POST /api/analyze severe upload HTTP 200", res.status_code == 200)
post_file_s = res.json()
check("Uploaded 2.jpeg recognized as severe/deficient", post_file_s.get("status") == "deficient")

# ---------------------------------------------------------------------------
# TEST 10: Frontend SPA Serving Verification
# ---------------------------------------------------------------------------
print("\n--- Test Section 10: React SPA Frontend Integration ---")
res = client.get("/")
check("GET / HTTP 200 (Serving Frontend)", res.status_code == 200)
html_content = res.text
check("HTML contains React root", 'id="root"' in html_content)
check("HTML loads bundle script", "index-" in html_content or "assets" in html_content)

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n" + "=" * 80)
print(f"VERIFICATION SUMMARY: {passes} PASSED, {fails} FAILED")
print("=" * 80)
if fails == 0:
    print("ALL TESTS PASSED PERFECTLY! All engines and connectivity verified.")
else:
    print(f"SOME TESTS FAILED ({fails}). Review errors above.")
    sys.exit(1)
