import { useState, useMemo } from 'react';
import { Upload } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BRAND_COLOR, BRAND_LABEL } from '@/utils/brandColors';
import { Brand } from '@/types/index';

interface PpcReport {
  id: string;
  brand: Brand;
  month: string;
  spend: number;
  clicks: number;
  conversions: number;
  roi: string;
  uploadedAt: Date;
  fileName: string;
}

export function PpcScreen() {
  const campaigns = useAppStore((s) => s.campaigns);
  const [filterBrand, setFilterBrand] = useState<Brand | 'all'>('all');
  const [filterMonth, setFilterMonth] = useState<string>('2026-08');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [ppcReports, setPpcReports] = useState<PpcReport[]>([
    {
      id: '1',
      brand: 'brentwood',
      month: '2026-08',
      spend: 3200,
      clicks: 1450,
      conversions: 28,
      roi: '3.1x',
      uploadedAt: new Date('2026-08-05'),
      fileName: 'Brentwood PPC Aug 2026.pdf',
    },
    {
      id: '2',
      brand: 'radio-links',
      month: '2026-08',
      spend: 2800,
      clicks: 1200,
      conversions: 24,
      roi: '2.9x',
      uploadedAt: new Date('2026-08-04'),
      fileName: 'Radio Links PPC Aug 2026.pdf',
    },
    {
      id: '3',
      brand: 'capcom',
      month: '2026-08',
      spend: 1800,
      clicks: 890,
      conversions: 15,
      roi: '2.5x',
      uploadedAt: new Date('2026-08-03'),
      fileName: 'Capcom PPC Aug 2026.pdf',
    },
    {
      id: '4',
      brand: 'ircl',
      month: '2026-08',
      spend: 700,
      clicks: 340,
      conversions: 6,
      roi: '2.0x',
      uploadedAt: new Date('2026-08-02'),
      fileName: 'IRCL PPC Aug 2026.pdf',
    },
  ]);

  const filteredReports = useMemo(() => {
    return ppcReports.filter((report) => {
      if (filterBrand !== 'all' && report.brand !== filterBrand) return false;
      if (filterMonth && report.month !== filterMonth) return false;
      return true;
    });
  }, [ppcReports, filterBrand, filterMonth]);

  const performanceData = useMemo(() => {
    const data = filteredReports.reduce((acc, report) => {
      const existing = acc.find((r) => r.brand === report.brand);
      if (existing) {
        existing.spend += report.spend;
        existing.clicks += report.clicks;
        existing.conversions += report.conversions;
      } else {
        acc.push({
          brand: BRAND_LABEL[report.brand],
          spend: report.spend,
          clicks: report.clicks,
          conversions: report.conversions,
          roi: report.roi,
        });
      }
      return acc;
    }, [] as Array<{ brand: string; spend: number; clicks: number; conversions: number; roi: string }>);

    const total = {
      brand: 'TOTAL',
      spend: data.reduce((sum, d) => sum + d.spend, 0),
      clicks: data.reduce((sum, d) => sum + d.clicks, 0),
      conversions: data.reduce((sum, d) => sum + d.conversions, 0),
      roi: '',
    };

    return [...data, total];
  }, [filteredReports]);

  const handleUpload = () => {
    if (uploadFile) {
      console.log('Uploading file:', uploadFile.name);
      setUploadFile(null);
      alert('PPC report uploaded successfully!');
    }
  };

  const getMonthLabel = (month: string) => {
    const [year, monthNum] = month.split('-');
    const date = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-4">PPC Reports</h1>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex gap-3 flex-wrap">
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value as Brand | 'all')}
              className="input flex-1 min-w-[150px]"
            >
              <option value="all">All brands</option>
              <option value="mtech">MTech</option>
              <option value="brentwood">Brentwood</option>
              <option value="radio-links">Radio Links</option>
              <option value="capcom">Capcom</option>
              <option value="ircl">IRCL</option>
              <option value="idaro">IDARO</option>
            </select>

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="input flex-1 min-w-[150px]"
            >
              <option value="2026-08">August 2026</option>
              <option value="2026-07">July 2026</option>
              <option value="2026-06">June 2026</option>
            </select>
          </div>
        </div>

        {/* Upload Section */}
        <div className="card mb-8">
          <h2 className="text-base font-semibold text-text-primary mb-4">Upload Report</h2>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="input w-full"
                placeholder="Choose PDF file"
              />
              {uploadFile && <p className="text-sm text-text-secondary mt-1">Selected: {uploadFile.name}</p>}
            </div>
            <button
              onClick={handleUpload}
              disabled={!uploadFile}
              className="btn btn-primary flex items-center gap-2"
              style={{ opacity: uploadFile ? 1 : 0.5 }}
            >
              <Upload size={16} />
              Upload PDF
            </button>
          </div>
          <p className="text-xs text-text-secondary mt-2">Upload PDF reports from Climbing Trees</p>
        </div>

        {/* Performance Table */}
        <div className="card mb-8">
          <h2 className="text-base font-semibold text-text-primary mb-4">
            Performance by Brand ({getMonthLabel(filterMonth)})
          </h2>
          {performanceData.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', minWidth: 500 }}>
                <thead>
                  <tr>
                    <th>Brand</th>
                    <th style={{ textAlign: 'right' }}>Spend</th>
                    <th style={{ textAlign: 'right' }}>Clicks</th>
                    <th style={{ textAlign: 'right' }}>Conversions</th>
                    <th style={{ textAlign: 'right' }}>ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceData.map((row, idx) => (
                    <tr key={idx} style={row.brand === 'TOTAL' ? { fontWeight: 600, backgroundColor: 'var(--color-surface)' } : {}}>
                      <td style={{ fontWeight: row.brand === 'TOTAL' ? 600 : undefined }}>{row.brand}</td>
                      <td style={{ textAlign: 'right' }}>£{row.spend.toLocaleString('en-GB')}</td>
                      <td style={{ textAlign: 'right' }}>{row.clicks.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>{row.conversions.toLocaleString()}</td>
                      <td style={{ textAlign: 'right' }}>{row.roi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No PPC data for the selected filters.</p>
          )}
        </div>

        {/* Recent Uploads */}
        <div className="card">
          <h2 className="text-base font-semibold text-text-primary mb-4">Recent Uploads</h2>
          {ppcReports.length > 0 ? (
            <div className="space-y-2">
              {ppcReports.slice().reverse().map((report) => (
                <div
                  key={report.id}
                  className="flex justify-between items-center p-3 rounded"
                  style={{ backgroundColor: 'var(--color-surface)' }}
                >
                  <div>
                    <p className="text-sm font-medium text-text-primary">{report.fileName}</p>
                    <p className="text-xs text-text-secondary">
                      {BRAND_LABEL[report.brand]} · {report.uploadedAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-1 rounded"
                    style={{ backgroundColor: `${BRAND_COLOR[report.brand]}1A`, color: BRAND_COLOR[report.brand] }}
                  >
                    PDF
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No uploads yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
