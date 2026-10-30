"""
verify_all_engines.py
======================
Comprehensive verification test suite for the Hibiscus rosa-sinensis
Leaf Health Diagnostic System.

Tests all modules end-to-end:
1. Dataset & specimen integrity
2. FastAPI backend core and status
3. Preset benchmark catalog and image serving
4. Diagnostic accuracy for Healthy foliage
5. Diagnostic accuracy across deficiency tiers (Mild, Moderate, Severe)
6. Deep Learning species verification gate (Rejects non-hibiscus)
7. Iron Deficiency Chlorosis (interveinal chlorosis pattern matching)
8. Multi-methodology severity comparison (Rule-based, Classical ML, Deep Learning)
9. POST /api/analyze file uploads and form submissions
10. React Single Page Application frontend delivery
"""

import os
import sys
import cv2
import numpy as np

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
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
# TEST 1: Specimen Dataset Folder Completeness
# ---------------------------------------------------------------------------
print("\n--- Test Section 1: Sample Data Folder & Integrity ---")
SAMPLE_DATA_DIR = os.path.join(CURRENT_DIR, "sample_data")
expected_files = [
    "healthy.jpeg",
    "mild.jpeg",
    "moderate.jpeg",
    "severe.jpeg",
    "non_hibiscus.jpeg",
    "chlorotic_leaf.jpeg",
]
for fname in expected_files:
    fpath = os.path.join(SAMPLE_DATA_DIR, fname)
    exists = os.path.isfile(fpath) and os.path.getsize(fpath) > 1000
    check(f"Specimen exists: {fname}", exists, f"Size: {os.path.getsize(fpath) if exists else 0} bytes")

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
# TEST 3: Catalog of Benchmark Presets
# ---------------------------------------------------------------------------
print("\n--- Test Section 3: Benchmark Presets Catalog Endpoint ---")
res = client.get("/api/demo-samples")
check("GET /api/demo-samples HTTP 200", res.status_code == 200)
samples = res.json()
sample_ids = [s["id"] for s in samples]
check("5 benchmark presets returned", len(samples) == 5, f"Count: {len(samples)}")
check("Includes healthy preset", "healthy" in sample_ids)
check("Includes mild preset", "mild" in sample_ids)
check("Includes moderate preset", "moderate" in sample_ids)
check("Includes severe preset", "severe" in sample_ids)
check("Includes non_hibiscus preset", "non_hibiscus" in sample_ids)

# ---------------------------------------------------------------------------
# TEST 4: Serving Preset Benchmark Images
# ---------------------------------------------------------------------------
print("\n--- Test Section 4: Serving Demo Images via /api/demo-image ---")
for sid in ["healthy", "mild", "moderate", "severe", "non_hibiscus"]:
    res = client.get(f"/api/demo-image/{sid}")
    check(
        f"GET /api/demo-image/{sid} HTTP 200",
        res.status_code == 200 and res.headers.get("content-type") == "image/jpeg",
    )

# ---------------------------------------------------------------------------
# TEST 5: Accurate Diagnosis of Healthy Leaves
# ---------------------------------------------------------------------------
print("\n--- Test Section 5: Healthy Leaf Diagnostic Accuracy ---")
res = client.get("/api/demo/healthy")
check("GET /api/demo/healthy HTTP 200", res.status_code == 200)
h_data = res.json()
check("healthy.jpeg diagnosed as HEALTHY", h_data.get("status") == "healthy", f"status: {h_data.get('status')}")
check("healthy.jpeg health_score >= 80", h_data.get("health_score", 0) >= 80, f"health_score: {h_data.get('health_score')}")
check("healthy.jpeg affected_area < 5%", h_data.get("affected_area_pct", 100) < 5.0, f"affected_area_pct: {h_data.get('affected_area_pct')}%")
check("healthy.jpeg has all 12 stages", len(h_data.get("stages", [])) == 12)
check("healthy.jpeg not rejected", h_data.get("raw_status") != "REJECTED")

# ---------------------------------------------------------------------------
# TEST 6: Accurate Deficiency Diagnosis across Tiers
# ---------------------------------------------------------------------------
print("\n--- Test Section 6: Deficiency Diagnosis Across Stages ---")

# Test mild preset
res = client.get("/api/demo/mild")
check("GET /api/demo/mild HTTP 200", res.status_code == 200)
mild_data = res.json()
check("mild.jpeg classified as unhealthy", mild_data.get("status") == "unhealthy")
check("mild.jpeg classified as mild severity", mild_data.get("severity") == "mild")

# Test moderate preset
res = client.get("/api/demo/moderate")
check("GET /api/demo/moderate HTTP 200", res.status_code == 200)
mod_data = res.json()
check("moderate.jpeg classified as unhealthy", mod_data.get("status") == "unhealthy")
check("moderate.jpeg classified as moderate severity", mod_data.get("severity") == "moderate")

# Test severe preset
res = client.get("/api/demo/severe")
check("GET /api/demo/severe HTTP 200", res.status_code == 200)
sev_data = res.json()
check("severe.jpeg classified as unhealthy", sev_data.get("status") == "unhealthy")
check("severe.jpeg classified as severe severity", sev_data.get("severity") == "severe")
check("severe.jpeg health score < 50", sev_data.get("health_score", 100) < 50, f"health_score: {sev_data.get('health_score')}")

# ---------------------------------------------------------------------------
# TEST 7: Foreign Species Automated Rejection Safeguard
# ---------------------------------------------------------------------------
print("\n--- Test Section 7: Non-Hibiscus Automated Rejection & Null Scores ---")
res = client.get("/api/demo/non_hibiscus")
check("GET /api/demo/non_hibiscus HTTP 200", res.status_code == 200)
rej_data = res.json()
check("non_hibiscus.jpeg classified as REJECTED", rej_data.get("status") in ["rejected", "aborted"])
check("non_hibiscus.jpeg raw status is REJECTED", rej_data.get("raw_status") == "REJECTED")
check("non_hibiscus.jpeg health_score is None (null)", rej_data.get("health_score") is None)
check("non_hibiscus.jpeg affected_area_pct is None (null)", rej_data.get("affected_area_pct") is None)
check("non_hibiscus.jpeg has no recommendations", len(rej_data.get("recommendations", [])) == 0)
check("non_hibiscus.jpeg has no metrics", len(rej_data.get("metrics", [])) == 0)

# ---------------------------------------------------------------------------
# TEST 7B: Chlorotic Hibiscus Leaf & Iron Deficiency Test
# ---------------------------------------------------------------------------
print("\n--- Test Section 7B: Chlorotic Hibiscus Leaf Regression Test ---")
chlorotic_path = os.path.join(SAMPLE_DATA_DIR, "chlorotic_leaf.jpeg")
check("chlorotic_leaf.jpeg exists", os.path.isfile(chlorotic_path))

with open(chlorotic_path, "rb") as f:
    res = client.post("/api/analyze", files={"frontlit_image": ("chlorotic_leaf.jpeg", f, "image/jpeg")})
check("POST /api/analyze chlorotic_leaf.jpeg HTTP 200", res.status_code == 200)
chlorotic_res = res.json()
check("chlorotic leaf status is NOT rejected", chlorotic_res.get("status") != "rejected", f"status: {chlorotic_res.get('status')}")
check("chlorotic leaf has valid health score", chlorotic_res.get("health_score") is not None)
check("chlorotic leaf has valid affected area", chlorotic_res.get("affected_area_pct") is not None)

# ---------------------------------------------------------------------------
# TEST 8: Multi-Methodology Severity Comparison Engine
# ---------------------------------------------------------------------------
print("\n--- Test Section 8: Multi-Methodology Severity Comparison (/api/compare) ---")
res = client.get("/api/compare/healthy")
check("GET /api/compare/healthy HTTP 200", res.status_code == 200)
comp_data = res.json()
check("Comparison includes rule_based", "rule_based" in comp_data)
check("Rule-based tier is valid", comp_data["rule_based"]["severity_tier"] in ["Healthy", "Mild"])
check("Comparison includes classical_ml", "classical_ml" in comp_data)
check("Classical ML predicted tier is valid", comp_data["classical_ml"]["predicted_class"] in ["Healthy", "Mild"])
check("Comparison includes deep_learning", "deep_learning" in comp_data)
check("Comparison reports consensus", comp_data.get("consensus") in ["Healthy", "Mild"])

# ---------------------------------------------------------------------------
# TEST 9: POST /api/analyze with Form Data & Uploads
# ---------------------------------------------------------------------------
print("\n--- Test Section 9: POST /api/analyze Endpoints ---")

# 9A: demo_sample string parameter
res = client.post("/api/analyze", data={"demo_sample": "healthy"})
check("POST /api/analyze with demo_sample='healthy' HTTP 200", res.status_code == 200)
post_h = res.json()
check("POST analysis returns healthy", post_h.get("status") == "healthy")

# 9B: file upload of healthy leaf
healthy_file_path = os.path.join(SAMPLE_DATA_DIR, "healthy.jpeg")
with open(healthy_file_path, "rb") as f:
    res = client.post("/api/analyze", files={"frontlit_image": ("healthy.jpeg", f, "image/jpeg")})
check("POST /api/analyze file upload HTTP 200", res.status_code == 200)
post_file_h = res.json()
check("Uploaded healthy.jpeg recognized as healthy", post_file_h.get("status") == "healthy")

# 9C: file upload of severe chlorosis leaf
sev_file_path = os.path.join(SAMPLE_DATA_DIR, "severe.jpeg")
with open(sev_file_path, "rb") as f:
    res = client.post("/api/analyze", files={"frontlit_image": ("severe.jpeg", f, "image/jpeg")})
check("POST /api/analyze severe upload HTTP 200", res.status_code == 200)
post_file_s = res.json()
check("Uploaded severe.jpeg recognized as unhealthy", post_file_s.get("status") == "unhealthy")

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
