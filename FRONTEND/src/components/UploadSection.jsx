import React, { useRef, useState } from 'react';
import { UploadCloud, Camera, Image as ImageIcon, X, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import CameraModal from './CameraModal';
import { getDemoImageUrl } from '../api';

const PRESET_SAMPLES = [
  { id: 'healthy', label: 'Healthy Leaf', tag: 'Optimal', color: 'emerald' },
  { id: 'mild', label: 'Mild Stress', tag: 'Early Stage', color: 'amber' },
  { id: 'moderate', label: 'Moderate Stress', tag: 'Vascular Shift', color: 'orange' },
  { id: 'severe', label: 'Severe Deficiency', tag: 'Degraded', color: 'rose' },
  { id: 'non_hibiscus', label: 'Non-Hibiscus', tag: 'Species Reject', color: 'slate' },
];

export default function UploadSection({
  selectedFile,
  selectedSampleId,
  previewUrl,
  onFileSelected,
  onSampleSelected,
  onClearSelection,
  onProceedToRoi,
}) {
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelected(e.target.files[0]);
    }
  };

  const handlePresetClick = (sampleId) => {
    onSampleSelected(sampleId, getDemoImageUrl(sampleId));
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Upload & Camera Trigger Bar */}
      <div className="glass-card rounded-2xl p-2 flex items-center justify-between gap-2 max-w-md mx-auto shadow-sm">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all bg-emerald-600 text-white shadow-sm hover:bg-emerald-700"
        >
          <UploadCloud className="w-4 h-4" />
          Upload Image
        </button>
        <button
          type="button"
          onClick={() => setIsCameraOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-gray-700 hover:text-emerald-800 hover:bg-emerald-50/70 transition-all"
        >
          <Camera className="w-4 h-4 text-emerald-600" />
          Live Camera
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Main Upload Dropzone or Active Preview Card */}
      {!previewUrl ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`glass-card rounded-3xl p-8 sm:p-12 text-center cursor-pointer border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/60 scale-[1.01]'
              : 'border-emerald-200/80 hover:border-emerald-400 hover:bg-emerald-50/20'
          }`}
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-100/70 flex items-center justify-center text-emerald-700 shadow-inner">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            Choose a photo or drag & drop here
          </h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
            JPEG, PNG, or WEBP. Translucent backlighting is optimal to highlight internal vein networks.
          </p>
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            Browse files from device
          </span>
        </div>
      ) : (
        /* Active Specimen Preview */
        <div className="glass-card rounded-3xl p-5 sm:p-6 shadow-md border border-emerald-100 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-2xl overflow-hidden bg-emerald-950 flex-shrink-0 shadow-inner border border-emerald-200">
              <img src={previewUrl} alt="Selected leaf" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={onClearSelection}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors"
                title="Remove preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 w-full text-center sm:text-left space-y-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Specimen Loaded
                </span>
                {selectedSampleId && (
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    Preset: {selectedSampleId}
                  </span>
                )}
              </div>

              <h4 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {selectedFile ? selectedFile.name : `Calibration Specimen (${selectedSampleId})`}
              </h4>

              <p className="text-xs text-gray-500">
                Ready for leaf boundary outlining and automated 12-stage vascular analysis.
              </p>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onProceedToRoi}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-2xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md hover:shadow-lg hover:translate-y-[-1px]"
                >
                  Proceed to Outline Leaf Area
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preset Calibration Samples Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Or test with calibrated benchmark specimens:
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {PRESET_SAMPLES.map((preset) => {
            const isSelected = selectedSampleId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset.id)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl text-center transition-all border ${
                  isSelected
                    ? 'bg-emerald-100/60 border-emerald-500 shadow-sm scale-[1.02]'
                    : 'bg-white hover:bg-emerald-50/40 border-gray-200 text-gray-700'
                }`}
              >
                <span className="text-xs font-bold text-gray-900 mb-0.5">{preset.label}</span>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  {preset.tag}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Camera Capture Modal */}
      <CameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onPhotoCaptured={(blob, url) => {
          onFileSelected(blob, url);
        }}
      />
    </div>
  );
}
