import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function LightboxModal({ isOpen, imageSrc, title, description, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageSrc) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-4xl w-full bg-white rounded-3xl p-5 shadow-2xl border border-gray-100 flex flex-col gap-3 max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900">{title || 'Image Preview'}</h3>
            {description && <p className="text-xs text-gray-500">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Display */}
        <div className="w-full flex-1 min-h-[300px] max-h-[70vh] bg-emerald-950 rounded-2xl overflow-hidden flex items-center justify-center border border-gray-200">
          <img src={imageSrc} alt={title || 'Enlarged preview'} className="w-full h-full object-contain" />
        </div>
      </div>
    </div>
  );
}
