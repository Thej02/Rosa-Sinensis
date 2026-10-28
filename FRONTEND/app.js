/**
 * Rosa-sinensis Leaf Health Diagnostic - Frontend Logic
 * Features:
 * - Interactive Leaf ROI Outlining (freehand lasso with Clear, Redo, Whole Image, Confirm)
 * - Plain-language Layman Result Page with large status banner driven strictly by backend
 * - Collapsible Technical Details (Vein density, Yellow ratio, ExG, DGCI, Branch points)
 * - Dynamic 12 Preprocessing Stages Grid with Lightbox preview and missing-stage fallback
 * - Dual Upload, Live Camera Picture Capture, and Demo Calibration Presets
 */

// Dynamically determine API Base URL:
function getApiBaseUrl() {
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    if (window.location.port === '5000') {
      return '';
    }
    const host = window.location.hostname || '127.0.0.1';
    return `http://${host}:5000`;
  }
  return 'http://127.0.0.1:5000';
}
const API_BASE = getApiBaseUrl();

// Application State
const state = {
  selectedFile: null,
  selectedSampleId: null,
  previewDataUrl: null,
  activeImageObj: null,
  lastResult: null,
  isScanning: false,
  cameraStream: null,
  capturedBlob: null,
  capturedDataUrl: null,
};

// ROI Drawing State
const roiState = {
  canvas: null,
  ctx: null,
  img: null,
  imgScale: 1,
  offsetX: 0,
  offsetY: 0,
  renderWidth: 0,
  renderHeight: 0,
  isDrawing: false,
  currentStroke: [], // points while pointer is down [{x, y}] in natural image px
  roiPoints: null,   // finalized closed polygon [{x, y}]
  redoStack: [],     // points saved for Redo
};

// DOM References
const DOM = {
  uploadSection: document.getElementById('uploadSection'),
  roiSection: document.getElementById('roiSection'),
  scanningSection: document.getElementById('scanningSection'),
  reportSection: document.getElementById('reportSection'),

  // Backend status indicator
  backendStatusPill: document.getElementById('backendStatusPill'),
  backendStatusText: document.getElementById('backendStatusText'),

  // Upload & Camera elements
  tabUpload: document.getElementById('tabUpload'),
  btnOpenCamera: document.getElementById('btnOpenCamera'),
  dropzone: document.getElementById('dropzone'),
  fileInput: document.getElementById('fileInput'),
  mobileCameraInput: document.getElementById('mobileCameraInput'),
  previewBox: document.getElementById('previewBox'),
  previewImg: document.getElementById('previewImg'),
  previewName: document.getElementById('previewName'),
  previewSize: document.getElementById('previewSize'),
  btnRemove: document.getElementById('btnRemove'),
  btnScan: document.getElementById('btnScan'),
  sampleButtons: document.querySelectorAll('.btn-sample'),

  // Camera Modal elements
  cameraModal: document.getElementById('cameraModal'),
  cameraVideo: document.getElementById('cameraVideo'),
  cameraSnapshotPreview: document.getElementById('cameraSnapshotPreview'),
  btnCloseCamera: document.getElementById('btnCloseCamera'),
  btnShutter: document.getElementById('btnShutter'),
  liveCaptureControls: document.getElementById('liveCaptureControls'),
  confirmCaptureControls: document.getElementById('confirmCaptureControls'),
  btnRetakePhoto: document.getElementById('btnRetakePhoto'),
  btnUseCapturedPhoto: document.getElementById('btnUseCapturedPhoto'),

  // ROI Canvas elements
  roiCanvas: document.getElementById('roiCanvas'),
  roiCanvasContainer: document.getElementById('roiCanvasContainer'),
  roiPromptOverlay: document.getElementById('roiPromptOverlay'),
  roiMessage: document.getElementById('roiMessage'),
  btnRoiClear: document.getElementById('btnRoiClear'),
  btnRoiRedo: document.getElementById('btnRoiRedo'),
  btnRoiFullLeaf: document.getElementById('btnRoiFullLeaf'),
  btnRoiConfirm: document.getElementById('btnRoiConfirm'),

  // Scanning animation elements
  scanningThumb: document.getElementById('scanningThumb'),
  scanStatusTitle: document.getElementById('scanStatusTitle'),
  scanStatusSub: document.getElementById('scanStatusSub'),

  // Simplified Result Banner
  statusBanner: document.getElementById('statusBanner'),
  statusBannerIcon: document.getElementById('statusBannerIcon'),
  statusBannerTitle: document.getElementById('statusBannerTitle'),
  statusSeverityBadge: document.getElementById('statusSeverityBadge'),
  statusBannerSummary: document.getElementById('statusBannerSummary'),

  // Simplified Layman Cards
  laymanScoreValue: document.getElementById('laymanScoreValue'),
  laymanScoreBar: document.getElementById('laymanScoreBar'),
  laymanScoreSub: document.getElementById('laymanScoreSub'),
  laymanAffectedAreaPill: document.getElementById('laymanAffectedAreaPill'),
  laymanAffectedAreaText: document.getElementById('laymanAffectedAreaText'),
  laymanTipText: document.getElementById('laymanTipText'),

  // Visual Verification Elements
  imgOriginal: document.getElementById('imgOriginal'),
  imgVeins: document.getElementById('imgVeins'),
  imgChlorosis: document.getElementById('imgChlorosis'),
  itemOriginal: document.getElementById('itemOriginal'),
  itemVeins: document.getElementById('itemVeins'),
  itemChlorosis: document.getElementById('itemChlorosis'),

  // Technical Accordion
  accordionTechnical: document.getElementById('accordionTechnical'),
  btnToggleTechnical: document.getElementById('btnToggleTechnical'),
  technicalArrow: document.getElementById('technicalArrow'),
  technicalPanel: document.getElementById('technicalPanel'),
  metricsGrid: document.getElementById('metricsGrid'),
  technicalSummaryBox: document.getElementById('technicalSummaryBox'),

  // 12 Stages Accordion & Grid
  accordionStages: document.getElementById('accordionStages'),
  btnToggleStages: document.getElementById('btnToggleStages'),
  stagesArrow: document.getElementById('stagesArrow'),
  stagesPanel: document.getElementById('stagesPanel'),
  stagesGrid: document.getElementById('stagesGrid'),

  // Report Actions
  btnDownload: document.getElementById('btnDownload'),
  btnPrint: document.getElementById('btnPrint'),
  btnScanAnother: document.getElementById('btnScanAnother'),

  // Lightbox Modal
  modalOverlay: document.getElementById('modalOverlay'),
  modalImg: document.getElementById('modalImg'),
  modalTitle: document.getElementById('modalTitle'),
  modalDesc: document.getElementById('modalDesc'),
  modalClose: document.getElementById('modalClose'),
};

// ============================================================================
// Initialization & Backend Health Check
// ============================================================================
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initRoiCanvas();
  checkBackendConnection();
  setInterval(checkBackendConnection, 12000);
});

async function checkBackendConnection() {
  const pill = DOM.backendStatusPill;
  const text = DOM.backendStatusText;
  const dot = pill ? pill.querySelector('.status-dot') : null;
  if (!pill || !text) return;

  try {
    const res = await fetch(`${API_BASE}/api/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    pill.className = 'pill-tag backend-status online';
    if (dot) dot.className = 'status-dot online';
    const engineLabel = data.leafvein_rework_connected ? 'CV Pipeline Active' : 'Fallback Engine';
    text.textContent = `Backend Connected • ${engineLabel}`;
    pill.title = `Connected to ${API_BASE || window.location.origin}/api/status (Status: ${data.status})`;
  } catch (err) {
    pill.className = 'pill-tag backend-status offline';
    if (dot) dot.className = 'status-dot offline';
    text.textContent = 'Backend Offline (Port 5000)';
    pill.title = `Could not reach ${API_BASE}/api/status. Start backend with python run_app.py`;
  }
}

// ============================================================================
// Event Listeners Setup
// ============================================================================
function setupEventListeners() {
  // Tab Upload click
  DOM.tabUpload.addEventListener('click', () => {
    DOM.tabUpload.classList.add('active');
    DOM.btnOpenCamera.classList.remove('active');
    DOM.fileInput.click();
  });

  // Dropzone click & file picking
  DOM.dropzone.addEventListener('click', () => DOM.fileInput.click());

  DOM.fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  DOM.mobileCameraInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  // Drag and drop events
  ['dragenter', 'dragover'].forEach((name) => {
    DOM.dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      DOM.dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach((name) => {
    DOM.dropzone.addEventListener(name, (e) => {
      e.preventDefault();
      e.stopPropagation();
      DOM.dropzone.classList.remove('dragover');
    });
  });

  DOM.dropzone.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  });

  // Remove preview
  DOM.btnRemove.addEventListener('click', (e) => {
    e.stopPropagation();
    clearSelectedFile();
  });

  // Camera Open & Close
  DOM.btnOpenCamera.addEventListener('click', openCameraViewfinder);
  DOM.btnCloseCamera.addEventListener('click', closeCameraViewfinder);

  // Shutter controls
  DOM.btnShutter.addEventListener('click', captureCameraPhoto);
  DOM.btnRetakePhoto.addEventListener('click', retakeCameraPhoto);
  DOM.btnUseCapturedPhoto.addEventListener('click', useCapturedPhoto);

  // Preset Sample leaf buttons
  DOM.sampleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const sampleId = btn.dataset.sample;
      selectSample(sampleId);
    });
  });

  // Main scan button (transitions from upload to ROI)
  DOM.btnScan.addEventListener('click', () => {
    if (state.previewDataUrl) {
      openRoiScreen(state.previewDataUrl);
    } else if (state.selectedSampleId) {
      loadSampleIntoRoi(state.selectedSampleId);
    } else {
      selectSample('healthy');
    }
  });

  // ROI Screen Buttons
  DOM.btnRoiClear.addEventListener('click', handleRoiClear);
  DOM.btnRoiRedo.addEventListener('click', handleRoiRedo);
  DOM.btnRoiFullLeaf.addEventListener('click', handleRoiUseWholeImage);
  DOM.btnRoiConfirm.addEventListener('click', handleRoiConfirm);

  // Technical Accordion Toggle
  DOM.btnToggleTechnical.addEventListener('click', () => {
    const isExpanded = DOM.btnToggleTechnical.getAttribute('aria-expanded') === 'true';
    DOM.btnToggleTechnical.setAttribute('aria-expanded', !isExpanded);
    DOM.technicalPanel.style.display = isExpanded ? 'none' : 'block';
    DOM.technicalArrow.textContent = isExpanded ? '▼' : '▲';
    DOM.technicalArrow.classList.toggle('open', !isExpanded);
  });

  // 12 Stages Accordion Toggle
  DOM.btnToggleStages.addEventListener('click', () => {
    const isExpanded = DOM.btnToggleStages.getAttribute('aria-expanded') === 'true';
    DOM.btnToggleStages.setAttribute('aria-expanded', !isExpanded);
    DOM.stagesPanel.style.display = isExpanded ? 'none' : 'block';
    DOM.stagesArrow.textContent = isExpanded ? '▼' : '▲';
    DOM.stagesArrow.classList.toggle('open', !isExpanded);
  });

  // Visual Inspection items lightbox
  DOM.itemOriginal.addEventListener('click', () => {
    if (DOM.imgOriginal.src) {
      openModal(DOM.imgOriginal.src, 'Original Leaf Photo', 'Input specimen photograph captured or uploaded');
    }
  });
  DOM.itemVeins.addEventListener('click', () => {
    if (DOM.imgVeins.src) {
      openModal(DOM.imgVeins.src, 'Vein Architecture', 'Segmented medial vascular network overlaid in red');
    }
  });
  DOM.itemChlorosis.addEventListener('click', () => {
    if (DOM.imgChlorosis.src) {
      openModal(DOM.imgChlorosis.src, 'Discolored Regions', 'Chlorotic interveinal tissue distribution map in amber');
    }
  });

  // Action buttons
  DOM.btnDownload.addEventListener('click', downloadReport);
  DOM.btnPrint.addEventListener('click', () => window.print());
  DOM.btnScanAnother.addEventListener('click', resetToUpload);

  // Lightbox Modal Close
  DOM.modalClose.addEventListener('click', closeModal);
  DOM.modalOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.modalOverlay) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeCameraViewfinder();
    }
  });

  // Handle window resizing for responsive ROI canvas
  window.addEventListener('resize', debounce(() => {
    if (DOM.roiSection.style.display !== 'none' && roiState.img) {
      resizeAndRedrawRoiCanvas();
    }
  }, 150));
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// ============================================================================
// Camera / "Click Picture" Feature
// ============================================================================
async function openCameraViewfinder() {
  DOM.btnOpenCamera.classList.add('active');
  DOM.tabUpload.classList.remove('active');

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    DOM.mobileCameraInput.click();
    return;
  }

  try {
    const constraints = {
      video: {
        facingMode: { ideal: 'environment' },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };

    state.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    DOM.cameraVideo.srcObject = state.cameraStream;
    DOM.cameraVideo.style.display = 'block';
    DOM.cameraSnapshotPreview.style.display = 'none';

    DOM.liveCaptureControls.style.display = 'block';
    DOM.confirmCaptureControls.style.display = 'none';
    DOM.cameraModal.classList.add('active');
  } catch (err) {
    console.warn('Camera stream error, using native fallback:', err);
    DOM.mobileCameraInput.click();
  }
}

function captureCameraPhoto() {
  if (!state.cameraStream) return;

  const video = DOM.cameraVideo;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 640;
  canvas.height = video.videoHeight || 480;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  state.capturedDataUrl = canvas.toDataURL('image/jpeg', 0.92);

  canvas.toBlob((blob) => {
    state.capturedBlob = blob;
  }, 'image/jpeg', 0.92);

  DOM.cameraSnapshotPreview.src = state.capturedDataUrl;
  DOM.cameraSnapshotPreview.style.display = 'block';
  DOM.cameraVideo.style.display = 'none';

  DOM.liveCaptureControls.style.display = 'none';
  DOM.confirmCaptureControls.style.display = 'flex';
}

function retakeCameraPhoto() {
  DOM.cameraSnapshotPreview.style.display = 'none';
  DOM.cameraVideo.style.display = 'block';

  DOM.liveCaptureControls.style.display = 'block';
  DOM.confirmCaptureControls.style.display = 'none';
  state.capturedBlob = null;
  state.capturedDataUrl = null;
}

function useCapturedPhoto() {
  if (!state.capturedBlob) return;

  const photoFile = new File([state.capturedBlob], `camera_leaf_${Date.now()}.jpg`, {
    type: 'image/jpeg',
  });

  handleFileSelected(photoFile);
  closeCameraViewfinder();
}

function closeCameraViewfinder() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach((track) => track.stop());
    state.cameraStream = null;
  }
  DOM.cameraModal.classList.remove('active');
  DOM.btnOpenCamera.classList.remove('active');
  DOM.tabUpload.classList.add('active');
}

// ============================================================================
// File Selection Handler & Transition to ROI
// ============================================================================
function handleFileSelected(file) {
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file (JPEG or PNG).');
    return;
  }

  state.selectedFile = file;
  state.selectedSampleId = null;
  DOM.sampleButtons.forEach((b) => b.classList.remove('active'));

  const reader = new FileReader();
  reader.onload = (e) => {
    state.previewDataUrl = e.target.result;
    DOM.previewImg.src = state.previewDataUrl;
    DOM.previewName.textContent = file.name;
    DOM.previewSize.textContent = `${(file.size / 1024).toFixed(1)} KB • Ready to outline`;
    DOM.previewBox.classList.add('active');

    // Automatically transition to ROI screen as requested
    openRoiScreen(state.previewDataUrl);
  };
  reader.readAsDataURL(file);
}

// Preset Sample Selection
async function selectSample(sampleId) {
  state.selectedSampleId = sampleId;
  state.selectedFile = null;
  DOM.fileInput.value = '';
  DOM.mobileCameraInput.value = '';
  DOM.previewBox.classList.remove('active');

  DOM.sampleButtons.forEach((b) => {
    b.classList.toggle('active', b.dataset.sample === sampleId);
  });

  await loadSampleIntoRoi(sampleId);
}

async function loadSampleIntoRoi(sampleId) {
  try {
    // Show quick status
    DOM.dropzone.classList.add('dragover');
    const imgUrl = `${API_BASE}/api/demo-image/${sampleId}`;
    const res = await fetch(imgUrl);
    if (!res.ok) throw new Error(`Could not load sample image: HTTP ${res.status}`);
    const blob = await res.blob();
    const dataUrl = URL.createObjectURL(blob);
    state.previewDataUrl = dataUrl;

    // Transition to ROI Screen
    openRoiScreen(dataUrl);
  } catch (err) {
    console.warn('Fallback loading demo sample directly:', err);
    // Directly scan if image route is unavailable
    startAnalysisWithRoi(null, null);
  } finally {
    DOM.dropzone.classList.remove('dragover');
  }
}

function clearSelectedFile() {
  state.selectedFile = null;
  state.selectedSampleId = null;
  state.previewDataUrl = null;
  state.activeImageObj = null;
  DOM.fileInput.value = '';
  DOM.mobileCameraInput.value = '';
  DOM.previewBox.classList.remove('active');
  DOM.sampleButtons.forEach((b) => b.classList.remove('active'));
}

// ============================================================================
// ROI FLOW: Interactive Canvas Freehand Outlining
// ============================================================================
function initRoiCanvas() {
  const canvas = DOM.roiCanvas;
  if (!canvas) return;
  roiState.canvas = canvas;
  roiState.ctx = canvas.getContext('2d');

  // Pointer Events (supports mouse, stylus, and touch cleanly)
  canvas.addEventListener('pointerdown', handlePointerDown);
  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerup', handlePointerUp);
  canvas.addEventListener('pointercancel', handlePointerUp);
}

function openRoiScreen(imageSrc) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    roiState.img = img;
    state.activeImageObj = img;
    roiState.roiPoints = null;
    roiState.currentStroke = [];
    roiState.redoStack = [];

    // Switch UI from upload to ROI screen
    DOM.uploadSection.style.display = 'none';
    DOM.scanningSection.classList.remove('active');
    DOM.reportSection.classList.remove('active');
    DOM.roiSection.style.display = 'block';

    // Reset controls
    DOM.btnRoiConfirm.disabled = true;
    DOM.roiPromptOverlay.style.display = 'flex';
    DOM.roiMessage.className = 'roi-status-message';
    DOM.roiMessage.textContent = '💡 Click and drag to outline the leaf blade. When finished, release to close the area.';

    resizeAndRedrawRoiCanvas();
    DOM.roiSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  img.src = imageSrc;
}

function resizeAndRedrawRoiCanvas() {
  const container = DOM.roiCanvasContainer;
  const canvas = roiState.canvas;
  const img = roiState.img;
  if (!container || !canvas || !img) return;

  const maxW = Math.min(container.clientWidth || 720, 720);
  const aspect = img.naturalHeight / img.naturalWidth;
  const renderW = maxW;
  const renderH = Math.round(maxW * aspect);

  // Set CSS display size
  canvas.style.width = `${renderW}px`;
  canvas.style.height = `${renderH}px`;

  // Use natural resolution for backing canvas for crisp sub-pixel rendering
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  roiState.renderWidth = renderW;
  roiState.renderHeight = renderH;
  roiState.imgScale = img.naturalWidth / renderW;

  redrawRoiCanvas();
}

function getCanvasPointerPos(e) {
  const canvas = roiState.canvas;
  const rect = canvas.getBoundingClientRect();
  const cssX = e.clientX - rect.left;
  const cssY = e.clientY - rect.top;

  // Convert CSS pixel coordinates to natural image pixel coordinates
  const natX = Math.round(cssX * (canvas.width / rect.width));
  const natY = Math.round(cssY * (canvas.height / rect.height));

  return {
    x: Math.max(0, Math.min(canvas.width, natX)),
    y: Math.max(0, Math.min(canvas.height, natY)),
  };
}

function handlePointerDown(e) {
  e.preventDefault();
  roiState.canvas.setPointerCapture(e.pointerId);

  const pos = getCanvasPointerPos(e);
  roiState.isDrawing = true;
  roiState.currentStroke = [pos];
  roiState.roiPoints = null;

  DOM.btnRoiConfirm.disabled = true;
  DOM.roiPromptOverlay.style.display = 'none';

  redrawRoiCanvas();
}

function handlePointerMove(e) {
  if (!roiState.isDrawing) return;
  e.preventDefault();

  const pos = getCanvasPointerPos(e);
  const stroke = roiState.currentStroke;
  const last = stroke[stroke.length - 1];

  // Throttle points: add point if moved at least 3 natural pixels
  if (!last || Math.hypot(pos.x - last.x, pos.y - last.y) >= 3) {
    stroke.push(pos);
    redrawRoiCanvas();
  }
}

function handlePointerUp(e) {
  if (!roiState.isDrawing) return;
  e.preventDefault();
  roiState.isDrawing = false;

  try {
    roiState.canvas.releasePointerCapture(e.pointerId);
  } catch (err) {
    // Ignore if pointer capture already lost
  }

  const stroke = roiState.currentStroke;
  if (stroke.length < 5) {
    // Too few points
    roiState.currentStroke = [];
    DOM.roiPromptOverlay.style.display = 'flex';
    DOM.btnRoiConfirm.disabled = true;
    DOM.roiMessage.className = 'roi-status-message warning';
    DOM.roiMessage.textContent = '⚠️ Outline was too short. Click and drag around the entire leaf blade.';
    redrawRoiCanvas();
    return;
  }

  // Auto-close outline loop back to start point
  stroke.push({ x: stroke[0].x, y: stroke[0].y });

  // Calculate enclosed area using Shoelace formula
  const area = calculatePolygonArea(stroke);
  const totalArea = roiState.img.naturalWidth * roiState.img.naturalHeight;
  const areaRatio = area / totalArea;

  if (areaRatio < 0.005 || area < 400) {
    // Error condition: very small ROI
    roiState.currentStroke = [];
    roiState.roiPoints = null;
    DOM.btnRoiConfirm.disabled = true;
    DOM.roiPromptOverlay.style.display = 'flex';
    DOM.roiMessage.className = 'roi-status-message warning';
    DOM.roiMessage.textContent = '⚠️ Selected area is too small. Please trace around the full leaf blade.';
    redrawRoiCanvas();
    return;
  }

  // Valid closed outline exists!
  roiState.roiPoints = stroke;
  roiState.currentStroke = [];
  roiState.redoStack = [];

  // Enable Confirm button
  DOM.btnRoiConfirm.disabled = false;
  DOM.roiPromptOverlay.style.display = 'none';
  DOM.roiMessage.className = 'roi-status-message success';
  const pct = (areaRatio * 100).toFixed(1);
  DOM.roiMessage.textContent = `✓ Leaf area outlined (${pct}% of image). Click 'Confirm Leaf Area' to start diagnosis.`;

  redrawRoiCanvas();
}

function calculatePolygonArea(points) {
  let area = 0;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }
  return Math.abs(area) / 2;
}

function redrawRoiCanvas() {
  const ctx = roiState.ctx;
  const canvas = roiState.canvas;
  const img = roiState.img;
  if (!ctx || !canvas || !img) return;

  // 1. Draw base photo
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const pointsToDraw = roiState.roiPoints || (roiState.currentStroke.length > 0 ? roiState.currentStroke : null);

  if (pointsToDraw && pointsToDraw.length > 1) {
    // 2. Draw darkened backdrop outside selection if closed outline exists
    if (roiState.roiPoints) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, canvas.width, canvas.height);
      ctx.moveTo(pointsToDraw[0].x, pointsToDraw[0].y);
      for (let i = 1; i < pointsToDraw.length; i++) {
        ctx.lineTo(pointsToDraw[i].x, pointsToDraw[i].y);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fill('evenodd');
      ctx.restore();
    }

    // 3. Draw outlined polygon with vibrant mint / emerald stroke
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(pointsToDraw[0].x, pointsToDraw[0].y);
    for (let i = 1; i < pointsToDraw.length; i++) {
      ctx.lineTo(pointsToDraw[i].x, pointsToDraw[i].y);
    }

    if (roiState.roiPoints) {
      ctx.closePath();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
      ctx.fill();
    }

    // Glowing outline
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = Math.max(3, Math.round(canvas.width / 220));
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.stroke();

    // Secondary dashed inner line for accessibility
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(1.5, Math.round(canvas.width / 440));
    ctx.stroke();
    ctx.restore();
  }
}

// ROI Button Handlers
function handleRoiClear() {
  if (roiState.roiPoints) {
    roiState.redoStack.push(roiState.roiPoints);
  }
  roiState.roiPoints = null;
  roiState.currentStroke = [];
  DOM.btnRoiConfirm.disabled = true;
  DOM.roiPromptOverlay.style.display = 'flex';
  DOM.roiMessage.className = 'roi-status-message';
  DOM.roiMessage.textContent = 'Outline cleared. Click and drag to outline the leaf blade.';
  redrawRoiCanvas();
}

function handleRoiRedo() {
  if (roiState.redoStack.length > 0) {
    roiState.roiPoints = roiState.redoStack.pop();
    DOM.btnRoiConfirm.disabled = false;
    DOM.roiPromptOverlay.style.display = 'none';
    DOM.roiMessage.className = 'roi-status-message success';
    DOM.roiMessage.textContent = 'Outline restored. Click "Confirm Leaf Area" to proceed.';
    redrawRoiCanvas();
  } else {
    DOM.roiMessage.className = 'roi-status-message';
    DOM.roiMessage.textContent = 'Nothing to redo. Click and drag on the leaf to outline.';
  }
}

function handleRoiUseWholeImage() {
  const w = roiState.img.naturalWidth;
  const h = roiState.img.naturalHeight;
  roiState.roiPoints = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
    { x: 0, y: 0 },
  ];
  roiState.currentStroke = [];
  roiState.redoStack = [];
  DOM.btnRoiConfirm.disabled = false;
  DOM.roiPromptOverlay.style.display = 'none';
  DOM.roiMessage.className = 'roi-status-message success';
  DOM.roiMessage.textContent = 'Whole image selected. Click "Confirm Leaf Area" to start diagnosis.';
  redrawRoiCanvas();
}

function handleRoiConfirm() {
  if (!roiState.roiPoints || roiState.roiPoints.length < 3) {
    DOM.roiMessage.className = 'roi-status-message warning';
    DOM.roiMessage.textContent = '⚠️ Please draw a closed outline around the leaf before confirming.';
    return;
  }

  // Build binary mask canvas (Black background, White inside polygon)
  const w = roiState.img.naturalWidth;
  const h = roiState.img.naturalHeight;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = w;
  maskCanvas.height = h;
  const mctx = maskCanvas.getContext('2d');

  // Fill black
  mctx.fillStyle = '#000000';
  mctx.fillRect(0, 0, w, h);

  // Fill polygon white
  mctx.beginPath();
  mctx.moveTo(roiState.roiPoints[0].x, roiState.roiPoints[0].y);
  for (let i = 1; i < roiState.roiPoints.length; i++) {
    mctx.lineTo(roiState.roiPoints[i].x, roiState.roiPoints[i].y);
  }
  mctx.closePath();
  mctx.fillStyle = '#ffffff';
  mctx.fill();

  maskCanvas.toBlob((maskBlob) => {
    startAnalysisWithRoi(maskBlob, roiState.roiPoints);
  }, 'image/png');
}

// ============================================================================
// Scanning & Backend Analysis Pipeline Execution
// ============================================================================
async function startAnalysisWithRoi(maskBlob, polygonPoints) {
  if (state.isScanning) return;
  state.isScanning = true;

  // Transition UI: hide ROI, show scanning card
  DOM.roiSection.style.display = 'none';
  DOM.uploadSection.style.display = 'none';
  DOM.reportSection.classList.remove('active');
  DOM.scanningSection.classList.add('active');

  // Set scanning thumbnail
  if (state.previewDataUrl) {
    DOM.scanningThumb.src = state.previewDataUrl;
  } else {
    DOM.scanningThumb.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 24 24' fill='%234a8b64'%3E%3Cpath d='M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z'/%3E%3C/svg%3E";
  }

  DOM.scanStatusTitle.textContent = 'Analyzing leaf...';
  DOM.scanStatusSub.textContent = 'Running 12-stage vascular extraction & health diagnostic within leaf ROI';

  try {
    const formData = new FormData();

    if (state.selectedSampleId) {
      formData.append('demo_sample', state.selectedSampleId);
    } else if (state.selectedFile) {
      formData.append('frontlit_image', state.selectedFile);
    }

    if (maskBlob) {
      formData.append('roi_mask', maskBlob, 'leaf_roi_mask.png');
    }
    if (polygonPoints) {
      formData.append('roi_polygon', JSON.stringify(polygonPoints));
    }

    const fetchPromise = fetch(`${API_BASE}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    // 1.0s pleasant scanning delay for visual feedback
    const [response] = await Promise.all([
      fetchPromise,
      new Promise((r) => setTimeout(r, 1000)),
    ]);

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.detail || 'Analysis could not be completed.');
    }

    const data = await response.json();
    state.lastResult = data;

    // Render results to the user!
    renderReport(data);
  } catch (error) {
    console.error('Scan failed:', error);
    alert(`Could not complete diagnosis: ${error.message}\nReturning to the leaf outline screen so you can retry.`);
    // Return to ROI section for retry
    DOM.scanningSection.classList.remove('active');
    DOM.roiSection.style.display = 'block';
  } finally {
    state.isScanning = false;
  }
}

// ============================================================================
// Render Diagnostic Result Page
// ============================================================================
function renderReport(data) {
  DOM.scanningSection.classList.remove('active');
  DOM.roiSection.style.display = 'none';
  DOM.uploadSection.style.display = 'none';
  DOM.reportSection.classList.add('active');

  // --------------------------------------------------------------------------
  // 1. Large Status Banner (Driven ONLY by backend response)
  // --------------------------------------------------------------------------
  const status = (data.status || 'healthy').toLowerCase();
  const severity = data.severity ? data.severity.toLowerCase() : null;

  // Reset classes
  DOM.statusBanner.className = 'status-banner';

  if (status === 'healthy') {
    DOM.statusBanner.classList.add('status-healthy');
    DOM.statusBannerTitle.textContent = 'Healthy Leaf';
    DOM.statusSeverityBadge.style.display = 'none';
    DOM.statusBannerSummary.textContent = data.summary || 'No signs of deficiency detected.';
    DOM.statusBannerIcon.innerHTML = `
      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 6 9 17l-5-5"/>
      </svg>
    `;
  } else {
    // Unhealthy leaf
    DOM.statusBanner.classList.add('status-unhealthy');
    const sevClass = severity === 'severe' ? 'severity-severe' : (severity === 'moderate' ? 'severity-moderate' : 'severity-mild');
    DOM.statusBanner.classList.add(sevClass);

    DOM.statusBannerTitle.textContent = 'Unhealthy Leaf';
    DOM.statusSeverityBadge.style.display = 'inline-block';
    DOM.statusSeverityBadge.textContent = severity ? (severity.charAt(0).toUpperCase() + severity.slice(1)) : 'Stress';
    DOM.statusBannerSummary.textContent = data.summary || `Your plant shows signs of nutrient stress.`;

    // High contrast icon with accessible shape differentiation
    if (severity === 'severe') {
      DOM.statusBannerIcon.innerHTML = `
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      `;
    } else {
      DOM.statusBannerIcon.innerHTML = `
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `;
    }
  }

  // --------------------------------------------------------------------------
  // 2. Simplified Layman Overview (At most 3 items in plain words)
  // --------------------------------------------------------------------------
  // Item A: Leaf Health Score
  const score = typeof data.health_score === 'number' ? data.health_score : (status === 'healthy' ? 95 : 55);
  DOM.laymanScoreValue.textContent = `${Math.round(score)}%`;
  DOM.laymanScoreBar.style.width = `${Math.max(5, Math.min(100, score))}%`;
  if (score >= 85) {
    DOM.laymanScoreBar.style.background = '#10b981';
    DOM.laymanScoreSub.textContent = 'Optimal foliar health and vitality';
  } else if (score >= 60) {
    DOM.laymanScoreBar.style.background = '#f59e0b';
    DOM.laymanScoreSub.textContent = 'Mild stress observed in lamina';
  } else if (score >= 35) {
    DOM.laymanScoreBar.style.background = '#ea580c';
    DOM.laymanScoreSub.textContent = 'Moderate nutritional stress';
  } else {
    DOM.laymanScoreBar.style.background = '#e11d48';
    DOM.laymanScoreSub.textContent = 'Severe foliar degradation detected';
  }

  // Item B: Affected Area
  const affPct = data.affected_area_pct != null ? data.affected_area_pct : (data.metrics?.find((m) => m.id === 'yellow_ratio')?.value || 0);
  DOM.laymanAffectedAreaPill.textContent = `${affPct}%`;
  DOM.laymanAffectedAreaText.textContent = data.affected_area_text || `${affPct}% of the leaf shows yellowing`;

  // Item C: Short Care Tip
  const tip = data.tip || (data.recommendations && data.recommendations[0]) || 'Consider checking soil nutrients, pH, and light exposure.';
  DOM.laymanTipText.textContent = tip;

  // --------------------------------------------------------------------------
  // 3. Visual Verification Strip (3 Comparison Cards)
  // --------------------------------------------------------------------------
  const g = data.gallery || {};
  DOM.imgOriginal.src = g.original_frontlit || state.previewDataUrl || '';
  DOM.imgVeins.src = g.vein_skeleton_overlay || '';
  DOM.imgChlorosis.src = g.chlorosis_overlay || '';

  // --------------------------------------------------------------------------
  // 4. Collapsible Technical Details (Closed by default)
  // --------------------------------------------------------------------------
  renderTechnicalDetails(data);

  // --------------------------------------------------------------------------
  // 5. Preprocessing Stages Section (Dynamic 12 stages from backend)
  // --------------------------------------------------------------------------
  renderStages(data.stages || []);

  DOM.reportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================================
// Render Technical Details Accordion (Metrics)
// ============================================================================
function renderTechnicalDetails(data) {
  DOM.metricsGrid.innerHTML = '';
  const metrics = data.metrics || [];

  metrics.forEach((m) => {
    const card = document.createElement('div');
    card.className = 'metric-pill';

    const statusType = m.status_type || 'optimal';

    card.innerHTML = `
      <div class="metric-pill-label">${m.name}</div>
      <div class="metric-pill-val">${m.value} <span>${m.unit}</span></div>
      <div class="metric-pill-status ${statusType}">${m.status}</div>
    `;
    DOM.metricsGrid.appendChild(card);
  });

  // Diagnostic etiology summary box inside accordion
  if (DOM.technicalSummaryBox) {
    const etiology = data.etiology || 'Physiological Foliar Balance';
    const explanation = data.explanation || '';
    DOM.technicalSummaryBox.innerHTML = `
      <strong>Etiology Classification:</strong> ${etiology}<br>
      ${explanation ? `<span style="font-size:0.84rem; display:block; margin-top:4px;">${explanation}</span>` : ''}
    `;
  }
}

// ============================================================================
// Render 12 Preprocessing Stages (Dynamically Loaded & Sorted)
// ============================================================================
function renderStages(stages) {
  DOM.stagesGrid.innerHTML = '';

  if (!stages || stages.length === 0) {
    DOM.stagesGrid.innerHTML = `<div class="stage-unavailable-msg" style="grid-column: 1 / -1; padding: 20px; text-align: center; color: var(--text-muted);">Processing stage previews not available for this scan.</div>`;
    return;
  }

  // Sort strictly by stage index (1 to 12)
  const sortedStages = [...stages].sort((a, b) => (a.index || a.stage || 0) - (b.index || b.stage || 0));

  // Unique scan timestamp parameter to bust cache
  const cacheBuster = `t=${Date.now()}`;

  sortedStages.forEach((st) => {
    const stageNum = st.index || st.stage || 1;
    const stageTitle = st.title || st.name || `Stage ${stageNum}`;
    const stageDesc = st.description || '';
    let imgSrc = st.image_url || st.image || '';

    if (imgSrc && !imgSrc.startsWith('data:') && !imgSrc.includes('?')) {
      imgSrc += `?${cacheBuster}`;
    }

    const tile = document.createElement('div');
    tile.className = 'stage-tile';
    tile.tabIndex = 0;
    tile.setAttribute('role', 'button');
    tile.setAttribute('aria-label', `View Stage ${stageNum}: ${stageTitle}`);

    if (imgSrc) {
      tile.innerHTML = `
        <div class="stage-thumb-wrap">
          <img class="stage-thumb loading" src="${imgSrc}" alt="${stageTitle}" loading="lazy">
        </div>
        <div class="stage-meta-row">
          <span class="stage-num">#${stageNum}</span>
          <span class="stage-name">${stageTitle}</span>
        </div>
      `;

      const imgEl = tile.querySelector('img');
      imgEl.onload = () => {
        imgEl.classList.remove('loading');
      };
      imgEl.onerror = () => {
        // Fallback gracefully so page never crashes
        tile.querySelector('.stage-thumb-wrap').innerHTML = `
          <div class="stage-unavailable">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            <span>Unavailable</span>
          </div>
        `;
      };

      tile.addEventListener('click', () => {
        openModal(imgSrc, `#${stageNum}: ${stageTitle}`, stageDesc);
      });
      tile.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(imgSrc, `#${stageNum}: ${stageTitle}`, stageDesc);
        }
      });
    } else {
      // Stage image missing
      tile.innerHTML = `
        <div class="stage-thumb-wrap">
          <div class="stage-unavailable">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            <span>Unavailable</span>
          </div>
        </div>
        <div class="stage-meta-row">
          <span class="stage-num">#${stageNum}</span>
          <span class="stage-name">${stageTitle}</span>
        </div>
      `;
    }

    DOM.stagesGrid.appendChild(tile);
  });
}

// ============================================================================
// Reset All State ("Scan Another Leaf")
// ============================================================================
function resetToUpload() {
  DOM.scanningSection.classList.remove('active');
  DOM.reportSection.classList.remove('active');
  DOM.roiSection.style.display = 'none';
  DOM.uploadSection.style.display = 'block';

  clearSelectedFile();
  roiState.roiPoints = null;
  roiState.currentStroke = [];
  roiState.redoStack = [];
  roiState.img = null;
  state.lastResult = null;

  // Reset accordions to closed
  DOM.technicalPanel.style.display = 'none';
  DOM.btnToggleTechnical.setAttribute('aria-expanded', 'false');
  DOM.technicalArrow.textContent = '▼';
  DOM.technicalArrow.classList.remove('open');

  DOM.stagesPanel.style.display = 'none';
  DOM.btnToggleStages.setAttribute('aria-expanded', 'false');
  DOM.stagesArrow.textContent = '▼';
  DOM.stagesArrow.classList.remove('open');

  DOM.uploadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================================
// Lightbox Modal
// ============================================================================
function openModal(src, title = 'Image Preview', desc = '') {
  if (!src) return;
  DOM.modalImg.src = src;
  if (DOM.modalTitle) DOM.modalTitle.textContent = title;
  if (DOM.modalDesc) DOM.modalDesc.textContent = desc;
  DOM.modalOverlay.classList.add('active');
}

function closeModal() {
  DOM.modalOverlay.classList.remove('active');
  DOM.modalImg.src = '';
}

// ============================================================================
// Download Report (Matches new simplified layout + technical details)
// ============================================================================
function downloadReport() {
  if (!state.lastResult) return;

  const d = state.lastResult;
  const now = new Date().toLocaleString();
  const statusUpper = (d.status || 'HEALTHY').toUpperCase();
  const severityLabel = d.severity ? `(${d.severity.toUpperCase()})` : '';

  let text = `======================================================================
ROSA-SINENSIS (HIBISCUS) LEAF HEALTH DIAGNOSTIC REPORT
Date: ${now}
======================================================================

1. DIAGNOSIS OVERVIEW
----------------------------------------------------------------------
Result   : ${statusUpper === 'HEALTHY' ? 'HEALTHY LEAF' : 'UNHEALTHY LEAF'} ${severityLabel}
Summary  : ${d.summary || 'Foliar evaluation completed.'}
Health   : ${d.health_score != null ? `${d.health_score}%` : 'N/A'}
Affected : ${d.affected_area_text || `${d.affected_area_pct || 0}% yellowing`}

CARE RECOMMENDATION:
${d.tip || (d.recommendations && d.recommendations[0]) || 'Standard balanced care.'}

2. TECHNICAL DETAILS
----------------------------------------------------------------------
Etiology : ${d.etiology || 'N/A'}
Notes    : ${d.explanation || 'None provided'}

QUANTITATIVE MEASUREMENTS:
`;

  (d.metrics || []).forEach((m) => {
    text += `- ${m.name.padEnd(25)}: ${m.value} ${m.unit} [${m.status}] (Healthy Range: ${m.healthy_min}-${m.healthy_max})\n`;
  });

  if (d.stages && d.stages.length > 0) {
    text += `\n12-STAGE PIPELINE TRACE:\n`;
    d.stages.forEach((st) => {
      text += `  Stage #${st.index || st.stage}: ${(st.title || st.name).padEnd(24)} - ${st.description || 'Verified'}\n`;
    });
  }

  text += `\n======================================================================
Generated by Rosa-sinensis Computer Vision Diagnostic System
======================================================================\n`;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `Hibiscus_Leaf_Diagnosis_${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
