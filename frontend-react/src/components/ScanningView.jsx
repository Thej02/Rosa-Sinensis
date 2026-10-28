import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ScanningView({ thumbUrl }) {
  return (
    <div className="w-full max-w-md mx-auto my-12 glass-card rounded-3xl p-8 text-center space-y-6 shadow-xl border border-emerald-100 animate-fade-in">
      {/* Specimen Box with Moving Laser Scan Beam */}
      <div className="relative w-48 h-48 mx-auto rounded-2xl overflow-hidden bg-emerald-950 border-2 border-emerald-300 shadow-lg">
        {thumbUrl ? (
          <img src={thumbUrl} alt="Scanning specimen" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-emerald-900" />
        )}
        <div className="scan-beam" />
      </div>

      {/* Rotating Spinner */}
      <div className="flex justify-center">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>

      {/* Status Headlines */}
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-gray-900 tracking-tight">Analyzing Leaf Specimen...</h3>
        <p className="text-xs sm:text-sm text-gray-500 max-w-xs mx-auto">
          Executing 12-stage morphological vascular extraction & calibrated spectrophotometric health diagnosis
        </p>
      </div>
    </div>
  );
}
