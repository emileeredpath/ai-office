import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Calendar } from 'lucide-react';

export interface DateRange {
  start: Date;
  end: Date;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [startDate, setStartDate] = useState(value.start.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(value.end.toISOString().split('T')[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const today = new Date();
  const getDateRange = (preset: string): DateRange => {
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);

    let start = new Date(today);
    start.setHours(0, 0, 0, 0);

    if (preset === 'this-week') {
      const first = new Date(today);
      first.setDate(today.getDate() - today.getDay());
      start = first;
    } else if (preset === 'this-month') {
      start = new Date(today.getFullYear(), today.getMonth(), 1);
    } else if (preset === 'last-3-months') {
      start = new Date(today);
      start.setMonth(today.getMonth() - 3);
    } else if (preset === 'all-time') {
      start = new Date(2000, 0, 1);
    }

    return { start, end };
  };

  const getPresetLabel = (): string => {
    const ranges = {
      'today': getDateRange('today'),
      'this-week': getDateRange('this-week'),
      'this-month': getDateRange('this-month'),
      'last-3-months': getDateRange('last-3-months'),
      'all-time': getDateRange('all-time'),
    };

    for (const [label, range] of Object.entries(ranges)) {
      if (
        value.start.toDateString() === range.start.toDateString() &&
        value.end.toDateString() === range.end.toDateString()
      ) {
        return label.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }
    }

    return `${value.start.toLocaleDateString()} — ${value.end.toLocaleDateString()}`;
  };

  const handlePreset = (preset: string) => {
    onChange(getDateRange(preset));
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      onChange({ start, end });
      setIsCustomOpen(false);
      setIsOpen(false);
    } catch (e) {
      console.error('Invalid dates:', e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#243347] text-[#F0F4F8] hover:bg-[#2e425b] transition-colors border border-[#3a4f6a]"
      >
        <Calendar size={16} />
        <span className="text-sm font-medium">{getPresetLabel()}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-[#1D2A3A] border border-[#3a4f6a] rounded-lg shadow-lg z-50 min-w-48">
          <div className="p-2 space-y-1">
            <button
              onClick={() => handlePreset('today')}
              className="w-full text-left px-3 py-2 rounded text-sm text-[#F0F4F8] hover:bg-[#243347] transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => handlePreset('this-week')}
              className="w-full text-left px-3 py-2 rounded text-sm text-[#F0F4F8] hover:bg-[#243347] transition-colors"
            >
              This Week
            </button>
            <button
              onClick={() => handlePreset('this-month')}
              className="w-full text-left px-3 py-2 rounded text-sm text-[#F0F4F8] hover:bg-[#243347] transition-colors"
            >
              This Month
            </button>
            <button
              onClick={() => handlePreset('last-3-months')}
              className="w-full text-left px-3 py-2 rounded text-sm text-[#F0F4F8] hover:bg-[#243347] transition-colors"
            >
              Last 3 Months
            </button>
            <button
              onClick={() => handlePreset('all-time')}
              className="w-full text-left px-3 py-2 rounded text-sm text-[#F0F4F8] hover:bg-[#243347] transition-colors"
            >
              All Time
            </button>
            <div className="border-t border-[#3a4f6a] pt-2 mt-2">
              <button
                onClick={() => setIsCustomOpen(!isCustomOpen)}
                className="w-full text-left px-3 py-2 rounded text-sm text-[#F0F4F8] hover:bg-[#243347] transition-colors"
              >
                Custom Range →
              </button>
              {isCustomOpen && (
                <div className="mt-2 p-3 space-y-2 bg-[#243347] rounded">
                  <div>
                    <label className="text-xs text-[#8F9194]">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#1D2A3A] border border-[#3a4f6a] rounded text-sm text-[#F0F4F8]"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#8F9194]">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2 py-1.5 bg-[#1D2A3A] border border-[#3a4f6a] rounded text-sm text-[#F0F4F8]"
                    />
                  </div>
                  <button
                    onClick={handleCustomApply}
                    className="w-full px-2 py-1.5 bg-[#F9701F] text-white rounded text-sm font-medium hover:bg-[#e85e0a] transition-colors"
                  >
                    Apply
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
