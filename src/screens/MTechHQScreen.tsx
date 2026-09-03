import { useEffect, useMemo, useRef } from 'react';
import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { ArrowLeft } from 'lucide-react';
import { Lighting } from '@/components/3d/Lighting';
import { Environment } from '@/components/3d/Environment';
import { CharacterAvatar, clampToRoom } from '@/components/mtechhq/CharacterAvatar';
import { InteractiveBoard } from '@/components/mtechhq/InteractiveBoard';
import { buildOfficeMessages, countActiveCampaigns, countTasksDueThisWeek } from '@/components/mtechhq/officeMessages';
import { useAppStore } from '@/store/useAppStore';
import { useAuth } from '@/contexts/AuthContext';
import { useEntity } from '@/contexts/EntityContext';
import { usePeriod, periodStartDate } from '@/contexts/PeriodContext';
import { filterCampaignsByPeriod, sumLeads, sumSpend, sumEnquiries } from '@/utils/campaignMetrics';
import { resolveGa4DateRange, getWebsiteUsers } from '@/utils/ga4Traffic';

// MTech HQ — Phase 1 (foundational skeleton) + Phase 2 (this file: a
// reusable character/avatar, click-to-move + WASD, and two more
// interactive areas — Campaign Board and Task Board). See
// DATA_INTEGRITY.md and each component's own header comment for what was
// reused from the dormant src/components/3d/ tree vs. written fresh, and
// why the larger src/components/officeview/ + src/systems/ "Sandy"
// multi-employee simulation was deliberately left alone again this pass.
//
// Still out of scope, deliberately: the other 11 planned office areas
// (PPC, Call Tracking, Social, Website, Email, Funding, Reports, AI
// Assistant Desk, etc.) — real follow-up work, not an oversight.

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
    const sorted = [...entityTasks].sort((a, b) => a.deadline!.getTime() - b.deadline!.getTime());
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
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 10 }}>Main Dashboard Wall</div>
        {row('Website Users', websiteUsers.status === 'available' ? websiteUsers.activeUsers!.toLocaleString('en-GB') : 'Not connected')}
        {row('Enquiries', enquiries.toLocaleString('en-GB'))}
        {row('Marketing Leads', marketingLeads.toLocaleString('en-GB'))}
        {row('Active Campaigns', String(liveCampaignsCount))}
        {row('Marketing Spend', `£${marketingSpend.toLocaleString('en-GB')}`)}
        {row('Next Deadline', nextDeadline ? `${nextDeadline.title} — ${nextDeadline.deadline!.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}` : 'None due')}
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

// A large, effectively invisible plane over the floor — click-to-move.
// Kept as its own mesh (rather than adding a handler to Environment.tsx's
// floor) so Environment.tsx stays reused completely unmodified.
function ClickFloor({ onFloorClick }: { onFloorClick: (point: THREE.Vector3) => void }) {
  return (
    <mesh
      position={[0, -0.49, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onFloorClick(e.point);
      }}
    >
      <planeGeometry args={[20, 20]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

function OfficeContents({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const tasks = useAppStore((s) => s.tasks);
  const campaigns = useAppStore((s) => s.campaigns);
  const emailPerformance = useAppStore((s) => s.emailPerformance);
  const syncEmailPerformance = useAppStore((s) => s.syncEmailPerformance);
  const { matchesSelectedEntity } = useEntity();
  const { role } = useAuth();

  // Today's date range, so the Education-emails-sent-today message reads
  // genuine same-day sync data — same syncEmailPerformance action and
  // EmailCampaignRecord shape the Email page itself uses.
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    syncEmailPerformance(today, today);
  }, [syncEmailPerformance]);

  const userName = role === 'edit' ? 'Emilee' : 'John';
  const messages = useMemo(
    () => buildOfficeMessages({ tasks, campaigns, emailPerformance, matchesSelectedEntity, userName }),
    [tasks, campaigns, emailPerformance, matchesSelectedEntity, userName]
  );

  const tasksDueThisWeek = useMemo(() => countTasksDueThisWeek(tasks, matchesSelectedEntity), [tasks, matchesSelectedEntity]);
  const activeCampaigns = useMemo(() => countActiveCampaigns(campaigns, matchesSelectedEntity), [campaigns, matchesSelectedEntity]);

  const targetRef = useRef(new THREE.Vector3(0, 0, 4));

  return (
    <>
      <Lighting />
      <Environment />
      <ClickFloor onFloorClick={(point) => { const v = point.clone(); v.y = 0; clampToRoom(v); targetRef.current.copy(v); }} />

      <DashboardWallPanel onOpenOverview={() => onNavigate('home')} />
      <InteractiveBoard
        position={[-6, 2.2, -9.6]}
        title="Campaign Planning Board"
        stat={`${activeCampaigns} active campaign${activeCampaigns === 1 ? '' : 's'}`}
        onOpen={() => onNavigate('campaigns')}
        color="#16a34a"
      />
      <InteractiveBoard
        position={[6, 2.2, -9.6]}
        title="Task Board"
        stat={`${tasksDueThisWeek} due this week`}
        onOpen={() => onNavigate('tasks')}
        color="#d97706"
      />

      <CharacterAvatar startPosition={[0, 0, 4]} messages={messages} targetRef={targetRef} />

      <OrbitControls
        enablePan={false}
        minDistance={6}
        maxDistance={24}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 2, -6]}
      />
    </>
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
      <div
        style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}
        className="text-xs"
      >
        <span style={{ background: 'rgba(16,25,46,0.85)', color: '#fff', padding: '6px 10px', borderRadius: 8 }}>
          Click the floor to walk, or use WASD / arrow keys
        </span>
      </div>

      <Canvas camera={{ position: [0, 6, 13], fov: 55 }} style={{ background: 'linear-gradient(135deg, #0f1117 0%, #1a1d27 100%)' }}>
        <OfficeContents onNavigate={onNavigate} />
      </Canvas>
    </div>
  );
}

export default MTechHQScreen;
