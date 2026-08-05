// Infinity call tracking integration — fetches call data from the q3_education_wave1_repair
// campaign and provides metrics like total calls, answered calls, missed calls, and average duration.
//
// IMPORTANT — requires INFINITY_API_KEY env var to be set. API endpoint may vary based on
// Infinity's actual implementation. This follows their documented REST API format.

export interface CallData {
  id: string;
  date: string;
  time: string;
  duration: string;
  answered: boolean;
  callerNumber: string;
  campaign: string;
  recordingUrl?: string;
}

export interface InfinityMetrics {
  totalCalls: number;
  answeredCalls: number;
  missedCalls: number;
  avgDuration: string;
  calls: CallData[];
}

export interface InfinityResult {
  configured: boolean;
  metrics: InfinityMetrics | null;
  errors: string[];
}

const INFINITY_API_BASE = 'https://api.infinitytracking.com/api/v1';

export async function getWave1CallMetrics(): Promise<InfinityResult> {
  const apiKey = process.env.INFINITY_API_KEY;

  if (!apiKey) {
    return {
      configured: false,
      metrics: null,
      errors: ['INFINITY_API_KEY is not set'],
    };
  }

  try {
    const today = new Date();
    const waveStart = new Date('2026-08-12');
    const waveEnd = new Date('2026-08-31');

    const startDate = waveStart.toISOString().split('T')[0];
    const endDate = waveEnd.toISOString().split('T')[0];

    // Query Infinity for calls in the Wave 1 campaign
    const response = await fetch(
      `${INFINITY_API_BASE}/calls?campaign=q3_education_wave1_repair&date_from=${startDate}&date_to=${endDate}&limit=1000`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Infinity API call failed (${response.status}): ${body.slice(0, 300)}`);
    }

    const data = (await response.json()) as {
      calls?: Array<{
        id: string;
        date: string;
        duration: string;
        answered: boolean;
        campaign: string;
        caller_number: string;
        recording_url?: string;
      }>;
    };

    const calls = data.calls || [];
    const answeredCalls = calls.filter((c) => c.answered).length;
    const missedCalls = calls.filter((c) => !c.answered).length;

    // Calculate average duration
    const durations = calls.map((c) => parseDuration(c.duration));
    const avgSeconds =
      durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
    const avgDuration = formatDuration(avgSeconds);

    // Transform to CallData format
    const callData: CallData[] = calls.map((c) => ({
      id: c.id,
      date: c.date.split('T')[0],
      time: c.date.split('T')[1]?.slice(0, 5) || '',
      duration: c.duration,
      answered: c.answered,
      callerNumber: c.caller_number,
      campaign: c.campaign,
      recordingUrl: c.recording_url,
    }));

    return {
      configured: true,
      metrics: {
        totalCalls: calls.length,
        answeredCalls,
        missedCalls,
        avgDuration,
        calls: callData,
      },
      errors: [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[infinity] failed to fetch call metrics:', msg);
    return {
      configured: true,
      metrics: null,
      errors: [msg],
    };
  }
}

// Parse duration string like "2m 45s" to total seconds
function parseDuration(durationStr: string): number {
  const parts = durationStr.split(' ');
  let totalSeconds = 0;

  for (let i = 0; i < parts.length; i += 2) {
    const value = parseInt(parts[i], 10);
    const unit = parts[i + 1];

    if (unit === 'h') totalSeconds += value * 3600;
    else if (unit === 'm') totalSeconds += value * 60;
    else if (unit === 's') totalSeconds += value;
  }

  return totalSeconds;
}

// Format seconds to "Xm Ys" string
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}
