import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { fetchTopLinksForSend, type EmailCampaignRecord, type TopLinkRow } from '@/services/emailPerformanceApi';
import { BRAND_LABEL } from '@/utils/brandColors';

interface SendDetailPanelProps {
  send: EmailCampaignRecord;
  // The Education campaign average for this send's own scope, if this
  // send belongs to the Education 2026 roll-up — null otherwise, and null
  // is a genuine "not applicable," never a fabricated comparison.
  educationAverage: { deliveryRate: number | null; uniqueOpenRate: number | null; clickRate: number | null } | null;
  onClose: () => void;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-text-secondary">{label}</div>
      <div className="text-lg font-bold text-text-primary" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function ComparisonRow({ label, thisValue, avgValue }: { label: string; thisValue: number | null; avgValue: number | null }) {
  return (
    <tr>
      <td className="text-text-primary">{label}</td>
      <td style={{ textAlign: 'right' }}>{thisValue != null ? `${thisValue}%` : '—'}</td>
      <td style={{ textAlign: 'right' }}>{avgValue != null ? `${avgValue}%` : '—'}</td>
    </tr>
  );
}

// Send Detail — a slide-in-style modal opened by clicking a row in the
// Email page's individual-send table. Deliberately never fetches or
// displays a recipient name or email address — every figure here is a
// send-level aggregate already present on the EmailCampaignRecord the
// Email page already has, nothing new is fetched for this view. "Top
// clicked links" is intentionally absent — Campaign Monitor only exposes
// link-level click data via its individual click-event log (/clicks.json),
// which lists real subscriber-level events; this app deliberately never
// calls that endpoint (data minimisation), so this is honestly shown as
// unavailable rather than silently omitted.
type TopLinksState =
  | { status: 'loading' }
  | { status: 'available'; rows: TopLinkRow[] }
  | { status: 'unavailable'; message: string };

export function SendDetailPanel({ send, educationAverage, onClose }: SendDetailPanelProps) {
  const [topLinks, setTopLinks] = useState<TopLinksState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setTopLinks({ status: 'loading' });
    if (!send.campaignMonitorId) {
      setTopLinks({ status: 'unavailable', message: 'No Campaign Monitor ID on record for this send.' });
      return;
    }
    fetchTopLinksForSend(send.campaignMonitorId)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.rows) {
          setTopLinks(res.rows.length > 0 ? { status: 'available', rows: res.rows } : { status: 'unavailable', message: 'No clicks recorded for this send yet.' });
        } else {
          setTopLinks({ status: 'unavailable', message: res.message ?? 'Top links are not available for this send.' });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setTopLinks({ status: 'unavailable', message: err instanceof Error ? err.message : 'Top links are not available for this send.' });
      });
    return () => {
      cancelled = true;
    };
  }, [send.campaignMonitorId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-semibold text-text-primary">{send.campaignName}</h2>
            {send.subject && <p className="text-sm text-text-secondary mt-1">Subject: {send.subject}</p>}
          </div>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </div>

        <div className="text-xs text-text-secondary mb-4">
          {formatDateTime(send.sentDate)} · {BRAND_LABEL[send.brand] ?? send.brand}
          {send.emailGeography && ` · ${send.emailGeography}`}
          {send.emailAudienceLevel && ` · ${send.emailAudienceLevel}`}
          {send.emailAudienceType && ` · ${send.emailAudienceType} data`}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Stat label="Recipients" value={send.recipients?.toLocaleString('en-GB') ?? '—'} />
          <Stat label="Delivered" value={send.delivered != null ? send.delivered.toLocaleString('en-GB') : '—'} />
          <Stat label="Delivery Rate" value={send.deliveryRate != null ? `${send.deliveryRate}%` : '—'} />
          <Stat label="Unique Opens" value={send.uniqueOpens != null ? send.uniqueOpens.toLocaleString('en-GB') : '—'} />
          <Stat label="Unique Open Rate" value={send.uniqueOpenRate != null ? `${send.uniqueOpenRate}%` : '—'} />
          <Stat label="Clicks" value={send.clicks?.toLocaleString('en-GB') ?? '—'} />
          <Stat label="Click Rate" value={send.clickRate != null ? `${send.clickRate}%` : '—'} />
          <Stat label="Click-to-Open Rate" value={send.clickToOpenRate != null ? `${send.clickToOpenRate}%` : '—'} />
          <Stat label="Bounces" value={send.bounces?.toLocaleString('en-GB') ?? '—'} />
          <Stat label="Unsubscribes" value={send.unsubscribes?.toLocaleString('en-GB') ?? '—'} />
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold text-text-primary mb-2">Top Links</h3>
          <p className="text-xs text-text-secondary mb-2">
            Aggregated server-side from Campaign Monitor's individual click log for this send — total and
            unique-clicker counts per URL only. No subscriber name, email address, or IP address is ever
            stored or shown; the raw click records are discarded immediately after this aggregate is computed.
          </p>
          {topLinks.status === 'loading' && <p className="text-xs text-text-secondary">Loading…</p>}
          {topLinks.status === 'unavailable' && <p className="text-xs text-text-secondary">{topLinks.message}</p>}
          {topLinks.status === 'available' && (
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th>URL</th>
                  <th style={{ textAlign: 'right' }}>Total Clicks</th>
                  <th style={{ textAlign: 'right' }}>Unique Clicks</th>
                </tr>
              </thead>
              <tbody>
                {topLinks.rows.map((row) => (
                  <tr key={row.url}>
                    <td className="text-text-primary text-xs" style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={row.url}>
                      {row.url}
                    </td>
                    <td style={{ textAlign: 'right' }}>{row.totalClicks.toLocaleString('en-GB')}</td>
                    <td style={{ textAlign: 'right' }}>{row.uniqueClicks.toLocaleString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {educationAverage && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-2">vs. Education 2026 Average</h3>
            <table className="table w-full text-sm">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th style={{ textAlign: 'right' }}>This Send</th>
                  <th style={{ textAlign: 'right' }}>Campaign Average</th>
                </tr>
              </thead>
              <tbody>
                <ComparisonRow label="Delivery Rate" thisValue={send.deliveryRate} avgValue={educationAverage.deliveryRate} />
                <ComparisonRow label="Unique Open Rate" thisValue={send.uniqueOpenRate} avgValue={educationAverage.uniqueOpenRate} />
                <ComparisonRow label="Click Rate" thisValue={send.clickRate} avgValue={educationAverage.clickRate} />
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 text-xs text-text-secondary">
          Campaign Monitor ID: {send.campaignMonitorId ?? '—'}
        </div>
      </div>
    </div>
  );
}
