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
import { DashboardScreen } from '@/screens/DashboardScreen';
import { MetricsScreen } from '@/screens/MetricsScreen';
import { PpcScreen } from '@/screens/PpcScreen';
import { InfinityTrackingScreen } from '@/screens/InfinityTrackingScreen';
import { FundingScreen } from '@/screens/FundingScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useAppStore } from '@/store/useAppStore';
import { API_URL } from '@/services/apiConfig';
import '@/styles/main.css';

type Screen = 'home' | 'tasks' | 'campaigns' | 'calendar' | 'dashboard' | 'ppc' | 'infinity' | 'funding' | 'metrics' | 'settings';

// Sidebar labels reflect the long-term MTech Marketing Hub navigation from
// the approved V2 mockup. Every label maps to an existing, unmodified
// screen (id = the Screen it opens) except the two items flagged
// `comingSoon: true` — Leads & CRM and Uploads have no real screen to open
// yet, so they're shown (per the shell's information architecture) but
// disabled rather than faked. "Reports" restores MetricsScreen, which had
// no sidebar entry before this change (a pre-existing dead route, not a
// regression introduced here).
const PRIMARY_NAV: NavItem[] = [
  { id: 'home' as Screen, icon: LayoutDashboard, label: 'Overview' },
  { id: 'campaigns' as Screen, icon: FolderOpen, label: 'Campaigns' },
  { id: 'calendar' as Screen, icon: Calendar, label: 'Content & Calendar' },
  { id: 'dashboard' as Screen, icon: BarChart3, label: 'Performance' },
  { id: null, icon: Users, label: 'Leads & CRM', comingSoon: true },
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
        return <DashboardScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'ppc':
        return <PpcScreen />;
      case 'infinity':
        return <InfinityTrackingScreen />;
      case 'funding':
        return <FundingScreen />;
      case 'metrics':
        return <MetricsScreen />;
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
