/**
 * API Service for Rosa-sinensis Leaf Health Diagnostic System
 * Connects React frontend (running on port 5174) to FastAPI backend (port 8000 / 5000).
 */

const CANDIDATE_BASES = ['', 'http://localhost:5000', 'http://127.0.0.1:5000', 'http://localhost:8000', 'http://127.0.0.1:8000'];
let activeBase = '';


async function getWorkingBase() {
  if (activeBase !== null && activeBase !== undefined && activeBase !== '') {
    return activeBase;
  }
  for (const base of CANDIDATE_BASES) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`${base}/api/status`, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(id);
      if (res.ok) {
        activeBase = base;
        return base;
      }
    } catch {
      // try next
    }
  }
  return '';
}

export async function fetchBackendStatus() {
  for (const base of CANDIDATE_BASES) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${base}/api/status`, { signal: controller.signal, cache: 'no-store' });
      clearTimeout(id);
      if (res.ok) {
        activeBase = base;
        return await res.json();
      }
    } catch {
      // try next
    }
  }
  throw new Error('Backend not reachable on port 8000 or 5000. Please start Uvicorn (uvicorn app:app --reload).');
}

export async function fetchDemoSamples() {
  const base = await getWorkingBase();
  const res = await fetch(`${base}/api/demo-samples`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}

export function getDemoImageUrl(sampleId) {
  const base = activeBase || '';
  return `${base}/api/demo-image/${sampleId}?t=${Date.now()}`;
}

export async function analyzeLeaf(formData) {
  const base = await getWorkingBase();
  const res = await fetch(`${base}/api/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Analysis failed with status ${res.status}`);
  }

  return await res.json();
}
