import { useState, useEffect, Suspense, lazy } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  FolderOpen,
  Calendar,
  BarChart3,
  TrendingUp,
  Phone,
  Landmark,
  Settings,
  Users,
  FileBarChart,
  Upload,
  Share2,
  Globe,
  Mail,
  Building2,
  Waypoints,
} from 'lucide-react';
import { isWebglAvailable, isLikelyMobileViewport } from '@/utils/webgl';
import { Sidebar, type NavItem } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { HomeScreen } from '@/screens/HomeScreen';
import { MyTasksScreen } from '@/screens/MyTasksScreen';
import { CampaignsScreen } from '@/screens/CampaignsScreen';
import { CampaignDetailScreen } from '@/screens/CampaignDetailScreen';
import { CalendarScreen } from '@/screens/CalendarScreen';
import { PerformanceScreen } from '@/screens/PerformanceScreen';
import { LeadsCrmScreen } from '@/screens/LeadsCrmScreen';
import { ReportsScreen } from '@/screens/ReportsScreen';
import { PpcScreen } from '@/screens/PpcScreen';
import { InfinityTrackingScreen } from '@/screens/InfinityTrackingScreen';
import { SocialScreen } from '@/screens/SocialScreen';
import { WebsiteScreen } from '@/screens/WebsiteScreen';
import { WebsiteImprovementScreen } from '@/screens/WebsiteImprovementScreen';
import { EmailScreen } from '@/screens/EmailScreen';
import { FundingScreen } from '@/screens/FundingScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { MarketingPlanScreen } from '@/screens/MarketingPlanScreen';
import { useAppStore } from '@/store/useAppStore';
import { API_URL } from '@/services/apiConfig';
import '@/styles/main.css';

// MTech HQ is lazy-loaded so Three.js/react-three-fiber/drei are only ever
// fetched and parsed when someone actually navigates there — every other
// screen's load time and bundle size are unaffected. See
// src/screens/MTechHQScreen.tsx's header comment and DATA_INTEGRITY.md.
const MTechHQScreen = lazy(() => import('@/screens/MTechHQScreen'));

type Screen = 'home' | 'tasks' | 'marketing-plan' | 'campaigns' | 'calendar' | 'dashboard' | 'leads' | 'ppc' | 'ppc-improvement' | 'infinity' | 'social' | 'website' | 'website-improvement' | 'email' | 'funding' | 'metrics' | 'settings' | 'mtech-hq';

// Sidebar labels map to real screens. Website and PPC each reveal an
// Improvement subcategory when selected. Uploads remains disabled until it
// has a real screen. Reports keeps its existing 'metrics' route id.
const PRIMARY_NAV: NavItem[] = [
  { id: 'home' as Screen, icon: LayoutDashboard, label: 'Overview' },
  { id: 'marketing-plan' as Screen, icon: Waypoints, label: 'Marketing Plan' },
  { id: 'campaigns' as Screen, icon: FolderOpen, label: 'Campaigns' },
  { id: 'calendar' as Screen, icon: Calendar, label: 'Content & Calendar' },
  { id: 'dashboard' as Screen, icon: BarChart3, label: 'Performance' },
  { id: 'leads' as Screen, icon: Users, label: 'Leads & CRM' },
  { id: 'ppc' as Screen, icon: TrendingUp, label: 'PPC', children: [
    { id: 'ppc-improvement' as Screen, icon: TrendingUp, label: 'PPC Improvement' },
  ] },
  { id: 'infinity' as Screen, icon: Phone, label: 'Call Tracking' },
  { id: 'social' as Screen, icon: Share2, label: 'Social' },
  { id: 'website' as Screen, icon: Globe, label: 'Website', children: [
    { id: 'website-improvement' as Screen, icon: TrendingUp, label: 'Website Improvement' },
  ] },
  { id: 'email' as Screen, icon: Mail, label: 'Email' },
  { id: 'funding' as Screen, icon: Landmark, label: 'Funding' },
  { id: 'metrics' as Screen, icon: FileBarChart, label: 'Reports' },
];

const SECONDARY_NAV: NavItem[] = [
  { id: 'tasks' as Screen, icon: CheckSquare, label: 'My Tasks' },
  { id: null, icon: Upload, label: 'Uploads', comingSoon: true },
  { id: 'settings' as Screen, icon: Settings, label: 'Settings' },
  { id: 'mtech-hq' as Screen, icon: Building2, label: 'MTech HQ' },
];

// Gate in front of the lazy-loaded MTechHQScreen: checks WebGL support and
// viewport width with a dependency-free util (src/utils/webgl.ts) BEFORE
// triggering the dynamic import, so the 3D bundle is never fetched at all
// for a browser/device that can't use it — not just caught after loading.
// See DATA_INTEGRITY.md and MTechHQScreen.tsx's header comment for the
// rest of MTech HQ's scope/rationale.
function MTechHQGate({ onNavigate }: { onNavigate: (screen: string) => void }) {
  if (!isWebglAvailable()) {
    return (
      <div className="v2-page">
        <div className="card max-w-lg mx-auto mt-12 text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">MTech HQ isn't available in this browser</h2>
          <p className="text-text-secondary mb-4">
            MTech HQ needs WebGL, which this browser doesn't support or has disabled. Everything in AI Office is
            still available from the normal dashboard.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('home')}>Back to Overview</button>
        </div>
      </div>
    );
  }

  if (isLikelyMobileViewport()) {
    return (
      <div className="v2-page">
        <div className="card max-w-lg mx-auto mt-12 text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">MTech HQ works best on desktop</h2>
          <p className="text-text-secondary mb-4">
            The full interactive 3D office is designed for a larger screen. Use the normal AI Office navigation on
            mobile — every screen is fully available there.
          </p>
          <button className="btn btn-primary" onClick={() => onNavigate('home')}>Back to Overview</button>
        </div>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="v2-page flex items-center justify-center h-full">
          <p className="text-text-secondary">Loading MTech HQ…</p>
        </div>
      }
    >
      <MTechHQScreen onNavigate={onNavigate} />
    </Suspense>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const selectedCampaignId = useAppStore((s) => s.selectedCampaignId);
  const selectCampaign = useAppStore((s) => s.selectCampaign);

  useEffect(() => {
    const ping = () => fetch(`${API_URL}/health`, { method: 'GET' }).catch(() => {});
    ping();
    const interval = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={(screen) => setCurrentScreen(screen as Screen)} />;
      case 'tasks':
        return <MyTasksScreen />;
      case 'marketing-plan':
        return <MarketingPlanScreen />;
      case 'campaigns':
        return <CampaignsScreen />;
      case 'dashboard':
        return <PerformanceScreen onNavigate={(screen) => setCurrentScreen(screen as Screen)} />;
      case 'leads':
        return <LeadsCrmScreen onNavigate={(screen) => setCurrentScreen(screen as Screen)} />;
      case 'calendar':
        return <CalendarScreen onNavigate={(screen) => setCurrentScreen(screen as Screen)} />;
      case 'ppc':
        return <PpcScreen />;
      case 'ppc-improvement':
        return <WebsiteImprovementScreen mode="ppc" />;
      case 'infinity':
        return <InfinityTrackingScreen />;
      case 'social':
        return <SocialScreen />;
      case 'website':
        return <WebsiteScreen />;
      case 'website-improvement':
        return <WebsiteImprovementScreen />;
      case 'email':
        return <EmailScreen />;
      case 'funding':
        return <FundingScreen />;
      case 'metrics':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'mtech-hq':
        return <MTechHQGate onNavigate={(screen) => setCurrentScreen(screen as Screen)} />;
      default:
        return <HomeScreen onNavigate={(screen) => setCurrentScreen(screen as Screen)} />;
    }
  };

  return (
    <div className="v2-app-shell">
      <Sidebar
        primaryItems={PRIMARY_NAV}
        secondaryItems={SECONDARY_NAV}
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
      />
      <div className="v2-main-column">
        <TopBar />
        <main className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-y-auto">
            {selectedCampaignId ? (
              <CampaignDetailScreen campaignId={selectedCampaignId} onBack={() => selectCampaign(null)} />
            ) : (
              renderScreen()
            )}
          </div>
          {selectedTaskId && !selectedCampaignId && <TaskDetailPanel />}
        </main>
      </div>
    </div>
  );
}
