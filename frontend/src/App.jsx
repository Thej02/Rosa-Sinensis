import React, { useState } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';
import Header from './components/Header';
import UploadSection from './components/UploadSection';
import RoiOutliner from './components/RoiOutliner';
import ScanningView from './components/ScanningView';
import DiagnosticReport from './components/DiagnosticReport';
import { analyzeLeaf } from './api';

export default function App() {
  const [step, setStep] = useState('upload'); // 'upload' | 'roi' | 'scanning' | 'report'
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedSampleId, setSelectedSampleId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // File selected via upload or camera
  const handleFileSelected = (file, explicitUrl) => {
    setSelectedFile(file);
    setSelectedSampleId(null);
    if (explicitUrl) {
      setPreviewUrl(explicitUrl);
    } else {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // Calibration preset clicked
  const handleSampleSelected = (sampleId, imageUrl) => {
    setSelectedFile(null);
    setSelectedSampleId(sampleId);
    setPreviewUrl(imageUrl);
  };

  // Clear preview
  const handleClearSelection = () => {
    if (previewUrl && !selectedSampleId) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setSelectedSampleId(null);
    setPreviewUrl(null);
  };

  // Move from upload to ROI outliner
  const handleProceedToRoi = () => {
    if (!previewUrl) return;
    setStep('roi');
  };

  // Confirm ROI & execute analysis
  const handleConfirmRoi = async (maskBlob, polygonPoints) => {
    setStep('scanning');
    setErrorMessage(null);

    try {
      const formData = new FormData();

      if (selectedSampleId) {
        formData.append('demo_sample', selectedSampleId);
        formData.append('sample_id', selectedSampleId);
      } else if (selectedFile) {
        formData.append('frontlit_image', selectedFile);
      }

      if (maskBlob) {
        formData.append('roi_mask', maskBlob, 'leaf_roi_mask.png');
      }

      if (polygonPoints) {
        formData.append('roi_polygon', JSON.stringify(polygonPoints));
      }

      // Add a 1.2s delay for smooth visual feedback of laser scanning
      const [result] = await Promise.all([
        analyzeLeaf(formData),
        new Promise((resolve) => setTimeout(resolve, 1200)),
      ]);

      setDiagnosticResult(result);
      setStep('report');
    } catch (err) {
      console.error('Diagnosis failed:', err);
      setErrorMessage(err.message || 'Diagnostic analysis could not be completed. Please retry.');
      setStep('error');
    }
  };

  // Reset back to upload
  const handleResetToUpload = () => {
    handleClearSelection();
    setDiagnosticResult(null);
    setErrorMessage(null);
    setStep('upload');
  };

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex flex-col justify-between">
      <div>
        <Header />

        {/* Global Error Notice (when not on error step) */}
        {errorMessage && step !== 'error' && (
          <div className="max-w-xl mx-auto mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between shadow-sm animate-fade-in">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 font-bold hover:underline ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Step Navigation */}
        <main>
          {step === 'upload' && (
            <UploadSection
              selectedFile={selectedFile}
              selectedSampleId={selectedSampleId}
              previewUrl={previewUrl}
              onFileSelected={handleFileSelected}
              onSampleSelected={handleSampleSelected}
              onClearSelection={handleClearSelection}
              onProceedToRoi={handleProceedToRoi}
            />
          )}

          {step === 'roi' && (
            <RoiOutliner
              imageSrc={previewUrl}
              onCancel={() => setStep('upload')}
              onConfirmRoi={handleConfirmRoi}
            />
          )}

          {step === 'scanning' && <ScanningView thumbUrl={previewUrl} />}

          {step === 'report' && (
            <DiagnosticReport data={diagnosticResult} onScanAnother={handleResetToUpload} />
          )}

          {step === 'error' && (
            <div className="w-full max-w-xl mx-auto rounded-3xl p-6 sm:p-8 bg-rose-50 border border-rose-300 text-rose-950 shadow-sm space-y-4 animate-fade-in text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-rose-700" />
              </div>
              <h2 className="text-xl font-bold text-rose-950">Diagnostic Server Error</h2>
              <p className="text-sm text-rose-800 leading-relaxed">
                {errorMessage || 'A server or processing error occurred while analyzing this leaf specimen. No health data could be generated.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => handleConfirmRoi()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retry Analysis
                </button>
                <button
                  type="button"
                  onClick={handleResetToUpload}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-rose-300 bg-white hover:bg-rose-50 text-rose-900 transition-colors"
                >
                  Upload another photo
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-6 border-t border-gray-200/60 text-center text-xs text-gray-400 space-y-1">
        <p>Hibiscus (<span className="italic">rosa-sinensis</span>) Computer Vision Vascular Architecture Diagnostic System</p>
        <p className="text-[11px] text-gray-400/80">Built with React, Vite, Tailwind CSS & OpenCV Pipeline</p>
      </footer>
    </div>
  );
}
