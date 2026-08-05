import { Wave1PerformanceData } from '@/store/useAppStore';

export async function fetchWave1Performance(campaignId?: string): Promise<Wave1PerformanceData> {
  const params = campaignId ? `?campaignId=${encodeURIComponent(campaignId)}` : '';
  const response = await fetch(`/api/analytics/wave1/performance${params}`);
  if (!response.ok) {
    throw new Error(`Wave 1 performance fetch failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchWave1Calls(): Promise<Wave1PerformanceData> {
  const response = await fetch('/api/analytics/wave1/calls');
  if (!response.ok) {
    throw new Error(`Wave 1 calls fetch failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchWave1History(
  campaignId: string,
  startDate?: string,
  endDate?: string
): Promise<{ metrics: any[] }> {
  const params = new URLSearchParams({ campaignId });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  const response = await fetch(`/api/analytics/wave1/history?${params}`);
  if (!response.ok) {
    throw new Error(`Wave 1 history fetch failed: ${response.status}`);
  }
  return response.json();
}
