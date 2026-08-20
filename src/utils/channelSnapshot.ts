import { Task, Campaign, Brand } from '@/types/index';
import { isWave1Campaign } from '@/utils/wave1';
import type { Wave1PerformanceData } from '@/store/useAppStore';

// Shared channel-snapshot logic used by both Overview's "Channel Snapshot"
// and Performance's "Channel Summary" — pure extraction of the logic that
// previously lived inline in HomeScreen, so the two pages read the exact
// same real figures and can never disagree.

export interface EmailSnapshot {
  sends: number;
  opens: number;
  clicks: number;
  hasOpenData: boolean;
  hasClickData: boolean;
}

// Email: derived from real email-send tasks (Campaign Monitor sync writes
// these) if any exist; otherwise honestly "Not connected".
export function getEmailSnapshot(tasks: Task[]): EmailSnapshot | null {
  const emailSendTasks = tasks.filter((t) => t.type === 'email-send');
  if (emailSendTasks.length === 0) return null;
  // `opens`/`clicks` are null (not 0) on a send until Campaign Monitor's
  // engagement sync actually populates them — treating null as 0 would
  // silently claim "0 opens" when open data was never reported at all.
  const hasOpenData = emailSendTasks.some((t) => t.opens != null);
  const hasClickData = emailSendTasks.some((t) => t.clicks != null);
  const totalOpens = emailSendTasks.reduce((sum, t) => sum + (t.opens || 0), 0);
  const totalClicks = emailSendTasks.reduce((sum, t) => sum + (t.clicks || 0), 0);
  return { sends: emailSendTasks.length, opens: totalOpens, clicks: totalClicks, hasOpenData, hasClickData };
}

export interface CallsSnapshot {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgDuration: string;
}

// Infinity's real data today is scoped to one hardcoded campaign (see
// isWave1Campaign) — only surface it if that campaign actually belongs to
// the currently-selected entity, otherwise it would silently show another
// entity's figure under the wrong selection.
export function getCallsSnapshot(
  campaigns: Campaign[],
  wave1Performance: Wave1PerformanceData | null,
  matchesSelectedEntity: (brand: Brand | null | undefined) => boolean
): CallsSnapshot | null {
  const wave1TargetCampaign = campaigns.find(isWave1Campaign);
  const infinityConfigured = wave1Performance?.infinityConfigured === true;
  const infinityMatchesEntity = wave1TargetCampaign ? matchesSelectedEntity(wave1TargetCampaign.brand) : false;
  if (infinityConfigured && infinityMatchesEntity && wave1Performance?.infinity) {
    return wave1Performance.infinity;
  }
  return null;
}
