import { Download, Printer } from 'lucide-react';

interface ReportExportButtonsProps {
  onExportCsv: () => void;
}

// Two honestly-buildable export paths, no backend/new dependency required:
// a real CSV of exactly what's on screen, and the browser's own print
// dialog (which every modern browser can "Save as PDF" from) driven by a
// print stylesheet that hides the app chrome. No third export option is
// offered where one isn't genuinely supported.
export function ReportExportButtons({ onExportCsv }: ReportExportButtonsProps) {
  return (
    <div className="flex items-center gap-2 v2-no-print">
      <button onClick={onExportCsv} className="btn btn-secondary flex items-center gap-2">
        <Download size={15} />
        Export CSV
      </button>
      <button onClick={() => window.print()} className="btn btn-secondary flex items-center gap-2">
        <Printer size={15} />
        Print / Save as PDF
      </button>
    </div>
  );
}
