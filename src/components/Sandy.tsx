import { useState, useEffect } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { generateBriefing } from '@/systems/SandyBriefing';
import { X, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

interface SandyProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sandy({ isOpen, onClose }: SandyProps) {
  const metrics = useAnalytics({ start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() });
  const [briefing, setBriefing] = useState(generateBriefing(metrics));

  useEffect(() => {
    setBriefing(generateBriefing(metrics));
  }, [metrics]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={onClose}
        style={{ opacity: 0.5 }}
      />

      {/* Panel */}
      <div
        className="fixed bottom-4 right-4 w-96 max-h-96 bg-[#1D2A3A] border border-[#3a4f6a] rounded-lg shadow-2xl z-50 overflow-y-auto"
        style={{
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#2E425B] border-b border-[#3a4f6a] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: '#F9701F' }}
            >
              S
            </div>
            <h3 className="font-semibold text-[#F0F4F8]">Sandy's Briefing</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#8F9194] hover:text-[#F0F4F8] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Summary */}
          <div>
            <p className="text-sm text-[#F0F4F8]">{briefing.summary}</p>
          </div>

          {/* Highlights */}
          {briefing.highlights.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#F9701F] uppercase tracking-wide">
                ✨ Highlights
              </h4>
              <div className="space-y-1">
                {briefing.highlights.map((highlight, i) => (
                  <div key={i} className="flex gap-2 text-xs text-[#F0F4F8]">
                    <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blockers */}
          {briefing.blockers.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wide">
                🚨 Blockers
              </h4>
              <div className="space-y-1">
                {briefing.blockers.map((blocker, i) => (
                  <div key={i} className="flex gap-2 text-xs text-[#F0F4F8]">
                    <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{blocker}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {briefing.recommendations.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
                💡 Recommendations
              </h4>
              <div className="space-y-1">
                {briefing.recommendations.map((rec, i) => (
                  <div key={i} className="flex gap-2 text-xs text-[#F0F4F8]">
                    <Lightbulb size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
}
