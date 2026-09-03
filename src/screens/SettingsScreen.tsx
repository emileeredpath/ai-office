import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { formatDate } from '@/utils/dateUtils';
import { useAuth } from '@/contexts/AuthContext';
import {
  fetchAcumaticaStatus,
  importAcumaticaFile,
  fileToBase64,
  type AcumaticaStatusResponse,
  type AcumaticaImportResult,
} from '@/services/acumaticaApi';
import { ApiError } from '@/services/apiConfig';

const BRAND_SWATCHES = [
  { label: 'MTech Navy', hex: '#0D1B2A' },
  { label: 'MTech Orange', hex: '#F97031' },
  { label: 'Brentwood Blue', hex: '#3B82F6' },
  { label: 'Radio Links Teal', hex: '#0F6E56' },
  { label: 'Capcom Purple', hex: '#534AB7' },
  { label: 'IRCL Green', hex: '#1D9E75' },
  { label: 'IDARO Pink', hex: '#DB2777' },
];

function ConnectionSettings() {
  const apiConnected = useAppStore((s) => s.apiConnected);
  const apiSyncing = useAppStore((s) => s.apiSyncing);
  const { role, logout } = useAuth();

  const statusLabel = apiConnected ? 'Connected' : 'Connected, but last sync failed';
  const statusColor = apiConnected ? 'var(--v2-green)' : 'var(--v2-red)';

  return (
    <div className="card mb-6">
      <h2 className="v2-section-title">Connection</h2>
      <p className="text-xs text-text-secondary mb-4">
        AI Office reads and writes live from the shared MTech server — the same database Claude uses via MCP — so
        anything created here or by Claude shows up in both places.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColor }}></span>
        <span className="text-sm font-medium text-text-primary">{statusLabel}</span>
        {apiSyncing && <span className="text-xs text-text-secondary">(syncing…)</span>}
        <span className="text-xs text-text-secondary ml-2">Access: {role === 'edit' ? 'Edit' : 'View only'}</span>
      </div>

      <button onClick={logout} className="btn btn-secondary">
        Sign out
      </button>
    </div>
  );
}

// Manual Acumatica Opportunities import (Discovery & Foundation phase) —
// see backend/src/services/acumaticaImport.ts's doc comment for exactly
// what's accepted/rejected. This section must never imply a live API
// connection — API status is always shown as "Not connected"; only the
// manual import history is genuinely "connected" once a file has been
// uploaded.
function AcumaticaSettings() {
  const { isEditor } = useAuth();
  const [status, setStatus] = useState<AcumaticaStatusResponse | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lastResult, setLastResult] = useState<AcumaticaImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadStatus = () => {
    fetchAcumaticaStatus().then(setStatus).catch(() => {});
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    setError(null);
    setLastResult(null);
    try {
      const base64 = await fileToBase64(file);
      const result = await importAcumaticaFile(file.name, base64);
      setLastResult(result);
      loadStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Import failed — could not reach the AI Office backend.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card mb-6">
      <h2 className="v2-section-title">Acumatica</h2>
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: 'var(--v2-grey)' }}></span>
        <span className="text-sm font-medium text-text-primary">API status: Not connected</span>
      </div>
      <p className="text-xs text-text-secondary mb-4">
        AI Office does not connect to a live Acumatica API. Commercial data (Opportunities, Open Pipeline, Won Deals,
        Won Revenue) comes only from a manually-uploaded Acumatica Opportunities export —{' '}
        <strong>Source: Acumatica Manual Export</strong>. It is only ever as current as the last successful upload
        below, never real-time.
      </p>

      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: status?.opportunityCount ? 'var(--v2-green)' : 'var(--v2-grey)' }}
        ></span>
        <span className="text-sm font-medium text-text-primary">
          Manual commercial data: {status?.opportunityCount ? `${status.opportunityCount} opportunit${status.opportunityCount === 1 ? 'y' : 'ies'} on record` : 'No data imported yet'}
        </span>
      </div>

      {status?.lastImport && (
        <div className="text-xs text-text-secondary mb-4 space-y-1">
          <div>Last import: {formatDate(status.lastImport.importedAt)} — {status.lastImport.filename}</div>
          <div>
            {status.lastImport.processed} processed ({status.lastImport.created} created, {status.lastImport.updated} updated),{' '}
            {status.lastImport.rejected} rejected
            {status.lastImport.errors.length > 0 && `, ${status.lastImport.errors.length} error(s)`}
          </div>
        </div>
      )}

      {isEditor && (
        <>
          <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelected} style={{ display: 'none' }} />
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? 'Importing…' : 'Upload Acumatica export (CSV)'}
          </button>
        </>
      )}

      {error && <p className="text-xs mt-3" style={{ color: 'var(--v2-red)' }}>{error}</p>}

      {lastResult && (
        <div className="text-xs mt-4 p-3 rounded" style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
          <div className="font-medium text-text-primary mb-1">
            {lastResult.success ? 'Import complete' : 'Import failed'}
          </div>
          <div className="text-text-secondary">
            {lastResult.processed} processed ({lastResult.created} created, {lastResult.updated} updated), {lastResult.rejected} rejected
          </div>
          {lastResult.recognisedColumns.length > 0 && (
            <div className="text-text-secondary mt-1">Recognised columns: {lastResult.recognisedColumns.join(', ')}</div>
          )}
          {lastResult.ignoredPersonalDataColumns.length > 0 && (
            <div className="mt-1" style={{ color: 'var(--v2-orange)' }}>
              Ignored personal-data columns (never imported): {lastResult.ignoredPersonalDataColumns.join(', ')}
            </div>
          )}
          {lastResult.unrecognisedColumns.length > 0 && (
            <div className="text-text-secondary mt-1">Unrecognised columns (not imported): {lastResult.unrecognisedColumns.join(', ')}</div>
          )}
          {lastResult.errors.length > 0 && (
            <div className="mt-2" style={{ color: 'var(--v2-red)' }}>
              {lastResult.errors.slice(0, 10).map((e, i) => (
                <div key={i}>{e}</div>
              ))}
              {lastResult.errors.length > 10 && <div>…and {lastResult.errors.length - 10} more.</div>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SettingsScreen() {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const { isEditor } = useAuth();
  const userName = isEditor ? 'Emilee' : 'John';

  const exportTasksAsCSV = () => {
    const csvHeaders = ['Task ID', 'Title', 'Brand', 'Status', 'Priority', 'Deadline', 'Campaign', 'Notes', 'Created At'];

    const csvRows = tasks.map((task) => {
      const campaign = campaigns.find((c) => c.id === task.campaignId);
      return [
        task.id,
        `"${task.title.replace(/"/g, '""')}"`,
        task.brand,
        task.status,
        task.priority,
        task.deadline ? formatDate(task.deadline) : '',
        campaign?.name || '',
        `"${(task.notes || '').replace(/"/g, '""')}"`,
        formatDate(task.createdAt),
      ].join(',');
    });

    const csv = [csvHeaders.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.setAttribute('href', URL.createObjectURL(blob));
    link.setAttribute('download', `mtech-tasks-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="v2-page">
      <div className="max-w-2xl mx-auto">
        <div className="v2-page-header">
          <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
        </div>

        <div className="card mb-6">
          <h2 className="v2-section-title">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Your name</label>
              <input type="text" value={userName} disabled className="input opacity-60" />
            </div>
          </div>
        </div>

        <div className="card mb-6">
          <h2 className="v2-section-title">MTech AI Integration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">MTech AI Project Link</label>
              <input
                type="text"
                value="https://claude.ai/project/019ef9de-64f0-75c3-8a1e-67749db5192e"
                disabled
                className="input opacity-60 text-xs"
              />
              <p className="text-xs text-text-secondary mt-2">
                This link is used when you click "Open MTech AI" in task detail panels. It opens a separate Claude
                conversation — it does not read or write your AI Office data automatically. Anything you discuss
                there has to be added back into AI Office manually.
              </p>
            </div>
          </div>
        </div>

        <ConnectionSettings />

        <AcumaticaSettings />

        <div className="card mb-6">
          <h2 className="v2-section-title">Brand Colours</h2>
          <div className="grid grid-cols-2 gap-4">
            {BRAND_SWATCHES.map((swatch) => (
              <div key={swatch.label} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded" style={{ backgroundColor: swatch.hex, flexShrink: 0 }}></div>
                <span className="text-sm text-text-primary">{swatch.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="v2-section-title">Export Data</h2>
          <p className="text-xs text-text-secondary mb-4">
            AI Office data lives in the shared MTech server database — this browser holds no separate copy that
            needs backing up. Export a CSV of your tasks for offline reference.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={exportTasksAsCSV} className="btn btn-secondary">
              Export tasks as CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
