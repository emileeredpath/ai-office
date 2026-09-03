import { useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { ArrowLeft } from 'lucide-react';
import { Lighting } from '@/components/3d/Lighting';
import { Environment } from '@/components/3d/Environment';
import { useAppStore } from '@/store/useAppStore';
import { useEntity } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { filterCampaignsByPeriod, sumLeads, sumSpend, sumEnquiries } from '@/utils/campaignMetrics';
import { resolveGa4DateRange, getWebsiteUsers } from '@/utils/ga4Traffic';

// MTech HQ — Phase 1 (foundational skeleton). See DATA_INTEGRITY.md and the
// MTech HQ brief: this is a visual navigation/status layer on top of the
// existing 2D dashboard, not a second reporting engine or a separate copy
// of the data. Every figure on the wall below is computed with the exact
// same shared utils Overview uses (campaignMetrics.ts, ga4Traffic.ts)
// against the exact same store (useAppStore/useEntity/usePeriod) — so this
// screen can never disagree with Overview, and there is nothing here to
// keep in sync separately.
//
// Scope deliberately cut from this first pass (see the audit note in the
// MTech HQ brief before extending this): no character/avatar, no WASD or
// click-to-move navigation, only one interactive area (the Main Dashboard
// Wall, which opens Overview) rather than all fourteen. The other thirteen
// office areas and the character are real, planned follow-up work, not an
// oversight — reusing the existing Character/CharacterController/
// Navigation/officeStore engine (src/systems/, src/store/officeStore.ts)
// wasn't done yet because that engine is tightly coupled to a much larger,
// unaudited "company simulation" concept (multiple employee desks, a
// workflow orchestrator, a Claude workflow generator) that needs its own
// review before being wired into a single-user navigation layer.
//
// Reused as-is from the existing (previously dormant) src/components/3d/
// tree: Canvas's camera/background setup is inlined below (it was a
// 6-line wrapper, not worth a second file), Lighting.tsx and
// Environment.tsx are used unmodified — both are genuinely self-contained
// (no dependency on the coupled character/navigation engine), unlike
// Character.tsx/OfficeScene.tsx/SpeechBubble.tsx, which were left alone
// for the reasons above.

interface MTechHQScreenProps {
  onNavigate: (screen: string) => void;
}

function DashboardWallPanel({ onOpenOverview }: { onOpenOverview: () => void }) {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const ga4Traffic = useAppStore((s) => s.ga4Traffic);
  const syncGa4Traffic = useAppStore((s) => s.syncGa4Traffic);
  const { isGroupView, selectedEntity, matchesSelectedEntity } = useEntity();
  const { period } = usePeriod();

  const ga4Range = useMemo(() => resolveGa4DateRange(period), [period]);
  useEffect(() => {
    syncGa4Traffic(ga4Range.startDate, ga4Range.endDate);
  }, [ga4Range.startDate, ga4Range.endDate, syncGa4Traffic]);

  const entityCampaigns = useMemo(() => campaigns.filter((c) => matchesSelectedEntity(c.brand)), [campaigns, matchesSelectedEntity]);
  const periodStart = useMemo(() => periodStartDate(period), [period]);
  const periodCampaigns = useMemo(() => filterCampaignsByPeriod(entityCampaigns, periodStart), [entityCampaigns, periodStart]);

  const marketingLeads = useMemo(() => sumLeads(periodCampaigns), [periodCampaigns]);
  const marketingSpend = useMemo(() => sumSpend(periodCampaigns), [periodCampaigns]);
  const enquiries = useMemo(() => sumEnquiries(periodCampaigns), [periodCampaigns]);
  const liveCampaignsCount = useMemo(() => entityCampaigns.filter((c) => c.status === 'active').length, [entityCampaigns]);
  const websiteUsers = useMemo(() => getWebsiteUsers(ga4Traffic, isGroupView, selectedEntity), [ga4Traffic, isGroupView, selectedEntity]);

  const entityTasks = useMemo(() => tasks.filter((t) => matchesSelectedEntity(t.brand) && t.status !== 'complete' && t.deadline), [tasks, matchesSelectedEntity]);
  const nextDeadline = useMemo(() => {
    const sorted = [...entityTasks].sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    return sorted[0] ?? null;
  }, [entityTasks]);

  const row = (label: string, value: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '4px 0' }}>
      <span style={{ opacity: 0.65 }}>{label}</span>
      <strong>{value}</strong>
    </div>
  );

  return (
    <Html position={[0, 3, -9.6]} center>
      <div
        style={{
          width: 420,
          background: 'rgba(16, 25, 46, 0.94)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 12,
          padding: '18px 22px',
          color: '#fff',
          fontFamily: 'var(--font-body, sans-serif)',
          fontSize: 15,
          pointerEvents: 'auto',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Main Dashboard Wall</div>
        {row('Website Users', websiteUsers.status === 'available' ? websiteUsers.activeUsers!.toLocaleString('en-GB') : 'Not connected')}
        {row('Enquiries', enquiries.toLocaleString('en-GB'))}
        {row('Marketing Leads', marketingLeads.toLocaleString('en-GB'))}
        {row('Active Campaigns', String(liveCampaignsCount))}
        {row('Marketing Spend', `£${marketingSpend.toLocaleString('en-GB')}`)}
        {row('Next Deadline', nextDeadline ? `${nextDeadline.title} — ${new Date(nextDeadline.deadline!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'None due')}
        <button
          onClick={onOpenOverview}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '9px 0',
            borderRadius: 8,
            border: 'none',
            background: 'var(--v2-purple, #7c5cfc)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Open Overview
        </button>
      </div>
    </Html>
  );
}

export function MTechHQScreen({ onNavigate }: MTechHQScreenProps) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <button
        onClick={() => onNavigate('home')}
        className="btn btn-secondary"
        style={{ position: 'absolute', top: 16, left: 16, zIndex: 10, display: 'flex', alignItems: 'center', gap: 6 }}
      >
        <ArrowLeft size={16} /> Leave MTech HQ
      </button>

      <Canvas camera={{ position: [0, 6, 13], fov: 55 }} style={{ background: 'linear-gradient(135deg, #0f1117 0%, #1a1d27 100%)' }}>
        <Lighting />
        <Environment />
        <DashboardWallPanel onOpenOverview={() => onNavigate('home')} />
        <OrbitControls
          enablePan={false}
          minDistance={6}
          maxDistance={24}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 2, -6]}
        />
      </Canvas>
    </div>
  );
}

export default MTechHQScreen;
