import { X } from 'lucide-react';
import type { EmailCampaignRecord } from '@/services/emailPerformanceApi';
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
export function SendDetailPanel({ send, educationAverage, onClose }: SendDetailPanelProps) {
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
          <h3 className="text-sm font-semibold text-text-primary mb-2">Top Clicked Links</h3>
          <p className="text-xs text-text-secondary">
            Not available — Campaign Monitor only exposes link-level click data through its individual
            click-event log, which lists real subscriber-level records. This app deliberately never
            fetches that endpoint (data minimisation) — only send-level aggregates like the figures above.
          </p>
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
