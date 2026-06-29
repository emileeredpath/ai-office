import { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown, Loader } from 'lucide-react';
import { exportToPDF, exportToCSV } from '@/utils/exportReports';
import type { AnalyticsMetrics } from '@/hooks/useAnalytics';

interface ExportButtonProps {
  metrics: AnalyticsMetrics;
  dateRange: { start: Date; end: Date };
}

export function ExportButton({ metrics, dateRange }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handleExportPDF = async () => {
    setIsLoading(true);
    try {
      await exportToPDF(metrics, dateRange);
      setIsOpen(false);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    setIsLoading(true);
    try {
      await exportToCSV(metrics, dateRange);
      setIsOpen(false);
    } catch (error) {
      console.error('CSV export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#F9701F] text-white hover:bg-[#e85e0a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader size={16} className="animate-spin" /> : <Download size={16} />}
        <span className="text-sm font-medium">Export</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 bg-[#1D2A3A] border border-[#3a4f6a] rounded-lg shadow-lg z-50 min-w-40">
          <button
            onClick={handleExportPDF}
            disabled={isLoading}
            className="w-full text-left px-4 py-3 text-sm text-[#F0F4F8] hover:bg-[#243347] transition-colors disabled:opacity-50 border-b border-[#3a4f6a]"
          >
            Export as PDF
          </button>
          <button
            onClick={handleExportCSV}
            disabled={isLoading}
            className="w-full text-left px-4 py-3 text-sm text-[#F0F4F8] hover:bg-[#243347] transition-colors disabled:opacity-50"
          >
            Export as CSV
          </button>
        </div>
      )}
    </div>
  );
}
