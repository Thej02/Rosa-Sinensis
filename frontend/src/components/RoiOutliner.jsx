import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trash2, Check, Maximize2, Edit3, ArrowLeft } from 'lucide-react';

export default function RoiOutliner({ imageSrc, onCancel, onConfirmRoi }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [imageObj, setImageObj] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState([]); // natural px [{x, y}]
  const [roiPoints, setRoiPoints] = useState(null); // finalized polygon [{x, y}]
  const [redoStack, setRedoStack] = useState([]);
  const [viewportDims, setViewportDims] = useState({ scale: 1, offsetX: 0, offsetY: 0, width: 0, height: 0 });

  // Load Image
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImageObj(img);
      setRoiPoints(null);
      setCurrentStroke([]);
      setRedoStack([]);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Handle Resize and Canvas Dimensions
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !imageObj) return;

    const ctx = canvas.getContext('2d');
    const containerWidth = container.clientWidth || 640;
    const containerHeight = Math.min(window.innerHeight * 0.62, 540);

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    // Calculate aspect fit
    const imgAspect = imageObj.naturalWidth / imageObj.naturalHeight;
    const containerAspect = containerWidth / containerHeight;

    let renderW, renderH, offX, offY, scale;

    if (imgAspect > containerAspect) {
      renderW = containerWidth;
      renderH = containerWidth / imgAspect;
      offX = 0;
      offY = (containerHeight - renderH) / 2;
      scale = imageObj.naturalWidth / renderW;
    } else {
      renderH = containerHeight;
      renderW = containerHeight * imgAspect;
      offX = (containerWidth - renderW) / 2;
      offY = 0;
      scale = imageObj.naturalHeight / renderH;
    }

    setViewportDims({ scale, offsetX: offX, offsetY: offY, width: renderW, height: renderH });

    // Draw leaf image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#0f1712';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageObj, offX, offY, renderW, renderH);

    // Draw existing finalized ROI or active stroke
    const pts = isDrawing ? currentStroke : roiPoints;
    if (pts && pts.length > 1) {
      ctx.save();
      ctx.beginPath();
      const firstX = pts[0].x / scale + offX;
      const firstY = pts[0].y / scale + offY;
      ctx.moveTo(firstX, firstY);

      for (let i = 1; i < pts.length; i++) {
        const px = pts[i].x / scale + offX;
        const py = pts[i].y / scale + offY;
        ctx.lineTo(px, py);
      }

      if (!isDrawing) {
        ctx.closePath();
        ctx.fillStyle = 'rgba(78, 136, 101, 0.22)';
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
      } else {
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
      }

      ctx.stroke();
      ctx.restore();
    }
  }, [imageObj, isDrawing, currentStroke, roiPoints]);

  useEffect(() => {
    redrawCanvas();
    window.addEventListener('resize', redrawCanvas);
    return () => window.removeEventListener('resize', redrawCanvas);
  }, [redrawCanvas]);

  // Coordinate Conversion (screen canvas client coords -> natural image coords)
  const getNaturalCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const canvasX = clientX - rect.left;
    const canvasY = clientY - rect.top;

    const natX = (canvasX - viewportDims.offsetX) * viewportDims.scale;
    const natY = (canvasY - viewportDims.offsetY) * viewportDims.scale;

    return {
      x: Math.max(0, Math.min(imageObj.naturalWidth, Math.round(natX))),
      y: Math.max(0, Math.min(imageObj.naturalHeight, Math.round(natY))),
    };
  };

  // Pointer Handlers
  const handlePointerDown = (e) => {
    const coords = getNaturalCoords(e);
    if (!coords) return;
    setIsDrawing(true);
    setCurrentStroke([coords]);
    setRedoStack([]);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const coords = getNaturalCoords(e);
    if (!coords) return;
    setCurrentStroke((prev) => [...prev, coords]);
  };

  const handlePointerUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.length > 5) {
      setRoiPoints(currentStroke);
    }
  };

  // Control Actions
  const handleClear = () => {
    if (roiPoints) setRedoStack(roiPoints);
    setRoiPoints(null);
    setCurrentStroke([]);
  };

  const handleRedo = () => {
    if (redoStack && redoStack.length > 0) {
      setRoiPoints(redoStack);
      setRedoStack([]);
    }
  };

  const handleUseWholeImage = () => {
    if (!imageObj) return;
    const w = imageObj.naturalWidth;
    const h = imageObj.naturalHeight;
    const wholePolygon = [
      { x: 0, y: 0 },
      { x: w, y: 0 },
      { x: w, y: h },
      { x: 0, y: h },
      { x: 0, y: 0 },
    ];
    setRoiPoints(wholePolygon);
    setRedoStack([]);
  };

  // Generate Binary Mask & Confirm
  const handleConfirm = () => {
    if (!imageObj || !roiPoints || roiPoints.length < 3) return;

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = imageObj.naturalWidth;
    maskCanvas.height = imageObj.naturalHeight;
    const mctx = maskCanvas.getContext('2d');

    // Fill background black
    mctx.fillStyle = '#000000';
    mctx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    // Draw polygon white
    mctx.beginPath();
    mctx.moveTo(roiPoints[0].x, roiPoints[0].y);
    for (let i = 1; i < roiPoints.length; i++) {
      mctx.lineTo(roiPoints[i].x, roiPoints[i].y);
    }
    mctx.closePath();
    mctx.fillStyle = '#ffffff';
    mctx.fill();

    maskCanvas.toBlob((blob) => {
      if (blob) {
        onConfirmRoi(blob, roiPoints);
      }
    }, 'image/png');
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Upload
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
          <Edit3 className="w-3.5 h-3.5" /> Interactive Leaf ROI Outlining
        </span>
      </div>

      {/* Main Canvas Outliner Card */}
      <div
        ref={containerRef}
        className="glass-card rounded-3xl p-4 overflow-hidden border border-emerald-200 shadow-md relative"
      >
        <div className="relative rounded-2xl overflow-hidden bg-black flex items-center justify-center cursor-crosshair select-none touch-none">
          <canvas
            ref={canvasRef}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            className="block max-w-full"
          />

          {/* Floating drawing hint overlay */}
          {!roiPoints && !isDrawing && (
            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white text-xs px-3.5 py-1.5 rounded-full pointer-events-none border border-white/20 animate-pulse">
              ✏️ Draw a freehand outline around the leaf lamina
            </div>
          )}
        </div>

        {/* Bottom ROI Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={!roiPoints && currentStroke.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Redo
            </button>
            <button
              type="button"
              onClick={handleUseWholeImage}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 transition-colors shadow-sm"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              Use Whole Image
            </button>
          </div>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!roiPoints || roiPoints.length < 3}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4" />
            Confirm Leaf Area & Diagnose
          </button>
        </div>
      </div>
    </div>
  );
}
