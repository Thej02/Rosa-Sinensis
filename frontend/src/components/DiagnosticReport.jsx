import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Download,
  Printer,
  RotateCcw,
  ChevronDown,
  Layers,
  FileText,
  Microscope,
  Eye,
  ShieldAlert,
} from 'lucide-react';
import LightboxModal from './LightboxModal';

export default function DiagnosticReport({ data, onScanAnother }) {
  const [openAccordions, setOpenAccordions] = useState({
    technical: false,
    stages: false,
    consoleReport: false,
  });

  const [copied, setCopied] = useState(false);
  const [lightboxData, setLightboxData] = useState({
    isOpen: false,
    src: '',
    title: '',
    desc: '',
  });

  if (!data) return null;

  const status = (data.status || 'healthy').toLowerCase();
  const severity = data.severity ? data.severity.toLowerCase() : null;
  const isRejected =
    status === 'aborted' ||
    status === 'rejected' ||
    (data.verdict && data.verdict.toLowerCase().includes('aborted'));

  const isHealthy = status === 'healthy' && !isRejected;

  const toggleAccordion = (key) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openLightbox = (src, title, desc) => {
    if (!src) return;
    setLightboxData({ isOpen: true, src, title, desc });
  };

  const handleCopyReport = () => {
    if (!data.report_text) return;
    navigator.clipboard.writeText(data.report_text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadReport = () => {
    const text = data.report_text || `ROSA-SINENSIS LEAF REPORT\nVerdict: ${data.verdict || data.status}`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Hibiscus_Leaf_Diagnosis_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const gallery = data.gallery || {};
  const metrics = data.metrics || [];
  const stages = data.stages || [];
  const flags = data.flags || [];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      {/* ====================================================================
          1. Large Status Banner
          ==================================================================== */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-5 transition-all ${
          isRejected
            ? 'bg-slate-50 border-slate-300 text-slate-800'
            : isHealthy
            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-emerald-500/5'
            : 'bg-rose-50/80 border-rose-300 text-rose-950 shadow-rose-500/5'
        }`}
      >
        <div
          className={`p-3.5 rounded-2xl flex-shrink-0 ${
            isRejected
              ? 'bg-slate-200 text-slate-700'
              : isHealthy
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          {isRejected ? (
            <XCircle className="w-8 h-8" />
          ) : isHealthy ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertTriangle className="w-8 h-8" />
          )}
        </div>

        <div className="flex-1 text-center sm:text-left space-y-1.5">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {data.verdict || (isHealthy ? 'Leaf Health Status: HEALTHY' : 'Leaf Health Status: NOT HEALTHY')}
            </h2>
            {isRejected ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-600 text-white uppercase tracking-wider">
                Species Rejection
              </span>
            ) : !isHealthy ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white uppercase tracking-wider">
                {data.confidence_signals || flags.length} Signal{ (data.confidence_signals || flags.length) > 1 ? 's' : ''} Flagged
              </span>
            ) : null}
          </div>
          <p className="text-sm sm:text-base opacity-90 leading-relaxed max-w-2xl">
            {data.summary || (data.deficiency_assessment && data.deficiency_assessment.assessment) || 'Foliar physiological evaluation completed.'}
          </p>
        </div>
      </div>

      {/* ====================================================================
          2. Layman Cards Grid (Health Score, Affected Area, Care Tip)
          ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Health Score */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Leaf Health Score
            </span>
            <span className="text-2xl font-black text-gray-900 font-mono">
              {typeof data.health_score === 'number' ? `${Math.round(data.health_score)}%` : '--%'}
            </span>
          </div>
          <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden my-2">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                (data.health_score || 0) >= 80
                  ? 'bg-emerald-500'
                  : (data.health_score || 0) >= 55
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${Math.max(5, Math.min(100, data.health_score || 50))}%` }}
            />
          </div>
          <span className="text-[11px] text-gray-500">Overall foliar vitality rating</span>
        </div>

        {/* Card 2: Affected Area */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
              Affected Area
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
              {data.affected_area_pct != null ? `${data.affected_area_pct}%` : '0%'}
            </span>
          </div>
          <p className="text-base font-bold text-gray-900 my-1 truncate">
            {data.affected_area_text || `${data.affected_area_pct || 0}% symptomatic alteration`}
          </p>
          <span className="text-[11px] text-gray-500">Across segmented leaf lamina</span>
        </div>

        {/* Card 3: Care Tip */}
        <div className="glass-card rounded-2xl p-5 flex flex-col justify-between border border-emerald-200 bg-emerald-50/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
              Recommended Care
            </span>
            <span className="text-base">🌱</span>
          </div>
          <p className="text-xs font-medium text-emerald-950 my-1 leading-relaxed">
            {data.tip || (data.recommendations && data.recommendations[0]) || 'Standard balanced foliar care.'}
          </p>
          <span className="text-[11px] text-emerald-700/80">Actionable botanical guidance</span>
        </div>
      </div>

      {/* ====================================================================
          2.5 Flagged Signals Callout Box
          ==================================================================== */}
      {flags && flags.length > 0 && (
        <div className="rounded-2xl p-5 bg-rose-50/70 border border-rose-200 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-200/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 text-white">
                <ShieldAlert className="w-3.5 h-3.5" />
                {data.confidence_signals || flags.length} Signal{(data.confidence_signals || flags.length) > 1 ? 's' : ''} Flagged
              </span>
              <span className="text-sm font-bold text-rose-900">
                Pattern: {data.pattern_name || (data.deficiency_assessment && data.deficiency_assessment.pattern_name) || 'Chlorotic Symptoms'}
              </span>
            </div>
            <span className="text-xs text-rose-700/80 font-medium">Calibrated against config/thresholds.py</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {flags.map((flag, idx) => (
              <div
                key={idx}
                className="bg-white rounded-xl p-3.5 border border-rose-200 border-l-4 border-l-rose-500 shadow-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-900">
                    {flag.name || flag.feature} ({flag.feature})
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                    {flag.type || 'Signal'}
                  </span>
                </div>
                <div className="text-xs font-mono font-semibold text-rose-700">
                  Measured: {flag.value} &nbsp;|&nbsp; Calibrated: {flag.threshold}
                </div>
                <p className="text-[11px] text-gray-600 leading-tight">
                  {flag.botanical_meaning || 'Diverges from healthy botanical baseline.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          3. Decision Engine Reasoning Card
          ==================================================================== */}
      {data.reasoning && (
        <div className="glass-card rounded-2xl p-5 border border-emerald-100 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100/70 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Deterministic Decision Engine
            </span>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-xs sm:text-sm text-gray-700 font-sans leading-relaxed whitespace-pre-line">
            {data.reasoning}
          </div>
        </div>
      )}

      {/* ====================================================================
          4. Visual Verification (4 Comparison Cards)
          ==================================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">Visual Inspection & Overlays</h3>
            <p className="text-xs text-gray-500">Tap any image for high-resolution zoom</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Card 1: Original */}
          <div
            onClick={() =>
              openLightbox(
                gallery.original_frontlit,
                'Original Leaf Photo',
                'Input leaf photograph acquired under backlit illumination'
              )
            }
            className="group glass-card rounded-2xl overflow-hidden cursor-zoom-in hover:shadow-md transition-all border border-emerald-100"
          >
            <div className="relative aspect-[4/3] bg-emerald-950 overflow-hidden">
              {gallery.original_frontlit ? (
                <img
                  src={gallery.original_frontlit}
                  alt="Original leaf"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
              )}
            </div>
            <div className="p-2.5 text-center bg-white border-t border-gray-100">
              <span className="block text-xs font-bold text-gray-900 truncate">Original Photo</span>
              <span className="block text-[10px] text-gray-500 truncate">Acquired specimen</span>
            </div>
          </div>

          {/* Card 2: Vein Architecture */}
          <div
            onClick={() =>
              openLightbox(
                gallery.vein_skeleton_overlay,
                'Vein Architecture',
                'Stage 12 medial vascular network overlaid in red on leaf lamina'
              )
            }
            className="group glass-card rounded-2xl overflow-hidden cursor-zoom-in hover:shadow-md transition-all border border-emerald-100"
          >
            <div className="relative aspect-[4/3] bg-emerald-950 overflow-hidden">
              {gallery.vein_skeleton_overlay ? (
                <img
                  src={gallery.vein_skeleton_overlay}
                  alt="Vein skeleton overlay"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
              )}
            </div>
            <div className="p-2.5 text-center bg-white border-t border-gray-100">
              <span className="block text-xs font-bold text-gray-900 truncate">Vein Architecture</span>
              <span className="block text-[10px] text-gray-500 truncate">Stage 12 skeleton overlay</span>
            </div>
          </div>

          {/* Card 3: Flagged Regions */}
          <div
            onClick={() =>
              openLightbox(
                gallery.unhealthy_regions || gallery.chlorosis_overlay,
                'Flagged Unhealthy Regions',
                'Circled defect clusters & nutritional chlorosis symptoms in amber'
              )
            }
            className="group glass-card rounded-2xl overflow-hidden cursor-zoom-in hover:shadow-md transition-all border border-emerald-100"
          >
            <div className="relative aspect-[4/3] bg-emerald-950 overflow-hidden">
              {gallery.unhealthy_regions || gallery.chlorosis_overlay ? (
                <img
                  src={gallery.unhealthy_regions || gallery.chlorosis_overlay}
                  alt="Flagged unhealthy regions"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
              )}
            </div>
            <div className="p-2.5 text-center bg-white border-t border-gray-100">
              <span className="block text-xs font-bold text-gray-900 truncate">Flagged Regions</span>
              <span className="block text-[10px] text-gray-500 truncate">Circled defect clusters</span>
            </div>
          </div>

          {/* Card 4: Annotated Composite Report */}
          <div
            onClick={() =>
              openLightbox(
                gallery.annotated_composite,
                'Annotated Composite Report',
                'Multi-panel readout with RGB leaf, binary vein network, and labeled defect contours'
              )
            }
            className="group glass-card rounded-2xl overflow-hidden cursor-zoom-in hover:shadow-md transition-all border border-emerald-100"
          >
            <div className="relative aspect-[4/3] bg-emerald-950 overflow-hidden">
              {gallery.annotated_composite ? (
                <img
                  src={gallery.annotated_composite}
                  alt="Annotated report"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
              )}
            </div>
            <div className="p-2.5 text-center bg-white border-t border-gray-100">
              <span className="block text-xs font-bold text-gray-900 truncate">Annotated Report</span>
              <span className="block text-[10px] text-gray-500 truncate">Side-by-side composite</span>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          5. Collapsible: Quantitative Measurements (10 Metrics)
          ==================================================================== */}
      <div className="glass-card rounded-2xl overflow-hidden border border-emerald-100 shadow-xs">
        <button
          type="button"
          onClick={() => toggleAccordion('technical')}
          className="w-full p-4 sm:p-5 flex items-center justify-between bg-white hover:bg-emerald-50/30 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Microscope className="w-5 h-5 text-emerald-700" />
            <div>
              <span className="text-sm sm:text-base font-bold text-gray-900">
                Quantitative Measurements & Calibrated Thresholds
              </span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                10 Biophysical Metrics
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              openAccordions.technical ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openAccordions.technical && (
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4 animate-fade-in">
            <p className="text-xs text-gray-500">
              Biophysical features computed across vascular architecture and spectrophotometric space, calibrated against{' '}
              <code className="text-emerald-700 font-mono font-semibold">config/thresholds.py</code>:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {metrics.map((m, idx) => {
                const isFlagged =
                  (m.status || '').toUpperCase() === 'FLAGGED' ||
                  (m.status_type || '').toLowerCase() === 'flagged';
                return (
                  <div
                    key={idx}
                    className={`bg-white rounded-xl p-3.5 border transition-all ${
                      isFlagged
                        ? 'border-rose-200 border-l-4 border-l-rose-500 shadow-xs'
                        : 'border-gray-200 border-l-4 border-l-emerald-500'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {m.name}
                        {m.symbol && (
                          <span className="ml-1.5 font-mono text-[10px] px-1.5 py-0.2 rounded bg-gray-100 text-emerald-800">
                            {m.symbol}
                          </span>
                        )}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isFlagged ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isFlagged ? 'FLAGGED' : 'NORMAL'}
                      </span>
                    </div>

                    <div className="flex items-baseline gap-1 my-1 font-mono">
                      <span className={`text-lg font-black ${isFlagged ? 'text-rose-700' : 'text-gray-900'}`}>
                        {m.value}
                      </span>
                      <span className="text-[11px] text-gray-400">{m.unit || ''}</span>
                    </div>

                    {m.threshold && (
                      <div className="text-[10px] font-mono text-gray-600 bg-gray-100/80 px-2 py-0.5 rounded inline-block mb-1">
                        Threshold: {m.threshold}
                      </div>
                    )}

                    {m.description && (
                      <p className="text-[11px] text-gray-500 leading-tight line-clamp-2">{m.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          6. Collapsible: All 12 Preprocessing Stages
          ==================================================================== */}
      <div className="glass-card rounded-2xl overflow-hidden border border-emerald-100 shadow-xs">
        <button
          type="button"
          onClick={() => toggleAccordion('stages')}
          className="w-full p-4 sm:p-5 flex items-center justify-between bg-white hover:bg-emerald-50/30 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-emerald-700" />
            <div>
              <span className="text-sm sm:text-base font-bold text-gray-900">
                View All 12 Preprocessing Stages
              </span>
              <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Pipeline Trace ({stages.length}/12)
              </span>
            </div>
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
              openAccordions.stages ? 'rotate-180' : ''
            }`}
          />
        </button>

        {openAccordions.stages && (
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 space-y-4 animate-fade-in">
            <p className="text-xs text-gray-500">
              The OpenCV pipeline extracts vascular architecture across 12 deterministic morphological and spectrophotometric stages:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {stages.map((st, idx) => {
                const stageNum = st.index || st.stage || idx + 1;
                const stageTitle = st.title || st.name || `Stage ${stageNum}`;
                return (
                  <div
                    key={idx}
                    onClick={() => openLightbox(st.image_url || st.image, `#${stageNum}: ${stageTitle}`, st.description)}
                    className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-emerald-400 hover:shadow-md transition-all cursor-zoom-in"
                  >
                    <div className="relative aspect-[4/3] bg-emerald-950 overflow-hidden">
                      <img
                        src={st.image_url || st.image}
                        alt={stageTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <span className="absolute top-1.5 left-1.5 bg-black/70 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                        #{stageNum}
                      </span>
                    </div>
                    <div className="p-2 text-center bg-white border-t border-gray-100">
                      <span className="block text-xs font-semibold text-gray-900 truncate">{stageTitle}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          7. Collapsible: Console Assessment Report (ASCII Text)
          ==================================================================== */}
      {data.report_text && (
        <div className="glass-card rounded-2xl overflow-hidden border border-emerald-100 shadow-xs">
          <button
            type="button"
            onClick={() => toggleAccordion('consoleReport')}
            className="w-full p-4 sm:p-5 flex items-center justify-between bg-white hover:bg-emerald-50/30 transition-colors text-left"
          >
            <div className="flex items-center gap-2.5">
              <FileText className="w-5 h-5 text-emerald-700" />
              <div>
                <span className="text-sm sm:text-base font-bold text-gray-900">
                  Complete Console Assessment Report
                </span>
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  CLI Text Output
                </span>
              </div>
            </div>
            <ChevronDown
              className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${
                openAccordions.consoleReport ? 'rotate-180' : ''
              }`}
            />
          </button>

          {openAccordions.consoleReport && (
            <div className="p-5 border-t border-gray-100 bg-[#141d17] text-emerald-300 space-y-3 animate-fade-in font-mono">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs text-gray-400">
                  Raw output from report_generator.generate_text_report():
                </span>
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
              </div>

              <pre className="text-xs leading-relaxed max-h-96 overflow-x-auto whitespace-pre p-2">
                {data.report_text}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* ====================================================================
          8. Bottom Action Bar
          ==================================================================== */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
        <button
          type="button"
          onClick={handleDownloadReport}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all"
        >
          <Download className="w-4 h-4" />
          Download Complete Report
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>

        <button
          type="button"
          onClick={onScanAnother}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Scan Another Leaf
        </button>
      </div>

      {/* Lightbox Modal */}
      <LightboxModal
        isOpen={lightboxData.isOpen}
        imageSrc={lightboxData.src}
        title={lightboxData.title}
        description={lightboxData.desc}
        onClose={() => setLightboxData((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
