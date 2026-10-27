import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onPhotoCaptured }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [snapshotUrl, setSnapshotUrl] = useState(null);
  const [snapshotBlob, setSnapshotBlob] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setSnapshotUrl(null);
      setSnapshotBlob(null);
      setCameraError(null);
      return;
    }

    startCamera();
    return () => stopCamera();
  }, [isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError('Camera access unavailable or denied. Please check device permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleCapture = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1024;
    canvas.height = video.videoHeight || 768;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        setSnapshotUrl(url);
        setSnapshotBlob(blob);
      }
    }, 'image/jpeg', 0.92);
  };

  const handleRetake = () => {
    if (snapshotUrl) URL.revokeObjectURL(snapshotUrl);
    setSnapshotUrl(null);
    setSnapshotBlob(null);
  };

  const handleConfirm = () => {
    if (snapshotBlob && snapshotUrl) {
      onPhotoCaptured(snapshotBlob, snapshotUrl);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-white rounded-3xl p-5 shadow-2xl border border-gray-100 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-700">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Capture Leaf Specimen</h3>
              <p className="text-xs text-gray-500">Hold steady with uniform backlighting</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder / Snapshot Box */}
        <div className="relative w-full aspect-[4/3] bg-emerald-950 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200 shadow-inner">
          {cameraError ? (
            <div className="p-6 text-center text-rose-300 text-sm">
              <p className="font-semibold mb-2">Camera Error</p>
              <p className="text-xs opacity-90">{cameraError}</p>
            </div>
          ) : snapshotUrl ? (
            <img src={snapshotUrl} alt="Captured specimen" className="w-full h-full object-cover" />
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}

          {/* Alignment crosshairs guide */}
          {!snapshotUrl && !cameraError && (
            <div className="absolute inset-8 border border-white/25 rounded-xl pointer-events-none flex items-center justify-center">
              <span className="text-[11px] text-white/50 tracking-wider font-mono">
                CENTER LEAF HERE
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3 pt-1">
          {snapshotUrl ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Retake
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md hover:shadow-lg"
              >
                <Check className="w-4 h-4" />
                Use Photo
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleCapture}
              disabled={!!cameraError}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-3.5 h-3.5 rounded-full border-2 border-white bg-white/40 animate-ping" />
              Capture Specimen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
