import { X } from 'lucide-react';

interface PlaceholderModalProps {
  title: string;
  onClose: () => void;
}

export function PlaceholderModal({ title, onClose }: PlaceholderModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
      onClick={onClose}
    >
      <div
        className="w-96 rounded-xl p-6 border"
        style={{ backgroundColor: '#0F1620', borderColor: '#263243' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold" style={{ color: '#E8ECF1' }}>
            {title}
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[#1A2330]">
            <X size={18} color="#8B96A5" />
          </button>
        </div>
        <p className="text-sm" style={{ color: '#8B96A5' }}>
          {title} isn't wired up yet — it's on the roadmap. For now, everything flows through Ask Sandy at the top.
        </p>
      </div>
    </div>
  );
}
