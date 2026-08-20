import { useState, useEffect } from 'react';
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
} from 'lucide-react';
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
import { FundingScreen } from '@/screens/FundingScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useAppStore } from '@/store/useAppStore';
import { API_URL } from '@/services/apiConfig';
import '@/styles/main.css';

type Screen = 'home' | 'tasks' | 'campaigns' | 'calendar' | 'dashboard' | 'leads' | 'ppc' | 'infinity' | 'funding' | 'metrics' | 'settings';

// Sidebar labels reflect the long-term MTech Marketing Hub navigation from
// the approved V2 mockup. Every label maps to an existing, unmodified
// screen (id = the Screen it opens) except the one item still flagged
// `comingSoon: true` — Uploads has no real screen to open yet, so it's
// shown (per the shell's information architecture) but disabled rather
// than faked. "Reports" opens ReportsScreen (route id kept as 'metrics'
// to avoid touching unrelated navigation).
const PRIMARY_NAV: NavItem[] = [
  { id: 'home' as Screen, icon: LayoutDashboard, label: 'Overview' },
  { id: 'campaigns' as Screen, icon: FolderOpen, label: 'Campaigns' },
  { id: 'calendar' as Screen, icon: Calendar, label: 'Content & Calendar' },
  { id: 'dashboard' as Screen, icon: BarChart3, label: 'Performance' },
  { id: 'leads' as Screen, icon: Users, label: 'Leads & CRM' },
  { id: 'ppc' as Screen, icon: TrendingUp, label: 'PPC' },
  { id: 'infinity' as Screen, icon: Phone, label: 'Call Tracking' },
  { id: 'funding' as Screen, icon: Landmark, label: 'Funding' },
  { id: 'metrics' as Screen, icon: FileBarChart, label: 'Reports' },
];

const SECONDARY_NAV: NavItem[] = [
  { id: 'tasks' as Screen, icon: CheckSquare, label: 'My Tasks' },
  { id: null, icon: Upload, label: 'Uploads', comingSoon: true },
  { id: 'settings' as Screen, icon: Settings, label: 'Settings' },
];

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
      case 'infinity':
        return <InfinityTrackingScreen />;
      case 'funding':
        return <FundingScreen />;
      case 'metrics':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
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
