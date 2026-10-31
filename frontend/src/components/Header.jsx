import React, { useEffect, useState } from 'react';
import { Leaf, Activity, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchBackendStatus } from '../api';

export default function Header() {
  const [backendStatus, setBackendStatus] = useState({
    online: false,
    label: 'Connecting...',
    engine: '',
  });

  useEffect(() => {
    let isMounted = true;
    const check = async () => {
      try {
        const data = await fetchBackendStatus();
        if (isMounted) {
          setBackendStatus({
            online: true,
            label: 'Backend Connected',
            engine: data.leafvein_rework_connected ? 'CV Pipeline Active' : 'Fallback Engine',
          });
        }
      } catch (err) {
        if (isMounted) {
          setBackendStatus({
            online: false,
            label: 'Backend Offline (Port 5000)',
            engine: '',
          });
        }
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="text-center mb-8">
      {/* Botanical Badges */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100/70 text-emerald-800 border border-emerald-200">
          <Leaf className="w-3.5 h-3.5 text-emerald-600" />
          <span>Hibiscus (<span className="italic font-normal">rosa-sinensis</span>)</span>
        </span>

        {/* Live Backend Connection Indicator */}
        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
            backendStatus.online
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
          title={
            backendStatus.online
              ? `Connected to Flask Backend (${backendStatus.engine})`
              : 'Cannot reach http://localhost:5000/api/status. Start backend with python run_app.py'
          }
        >
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus.online ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          {backendStatus.label}
          {backendStatus.engine && (
            <span className="opacity-80 text-[11px] font-normal">
              • {backendStatus.engine}
            </span>
          )}
        </span>
      </div>

      {/* Main Title & Subtitle */}
      <h1 className="text-3xl sm:text-4xl font-extrabold text-[#243329] tracking-tight mb-2">
        Hibiscus (<span className="italic font-extrabold">rosa-sinensis</span>) Leaf Health Diagnostic
      </h1>
      <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto leading-relaxed">
        Computer vision vascular architecture extraction & color-based health analysis
        for Hibiscus (<span className="italic font-medium">rosa-sinensis</span>) leaves.
      </p>
    </header>
  );
}
