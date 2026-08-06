import { useState, useEffect } from 'react';
import { Home, CheckSquare, FolderOpen, Calendar, BarChart3, TrendingUp, Phone, Landmark, Settings } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { CampaignDetailPanel } from '@/components/campaigns/CampaignDetailPanel';
import { HomeScreen } from '@/screens/HomeScreen';
import { MyTasksScreen } from '@/screens/MyTasksScreen';
import { CampaignsScreen } from '@/screens/CampaignsScreen';
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

const NAVIGATION_ITEMS = [
  { id: 'home' as Screen, icon: Home, label: 'Home' },
  { id: 'tasks' as Screen, icon: CheckSquare, label: 'My Tasks' },
  { id: 'campaigns' as Screen, icon: FolderOpen, label: 'Campaigns' },
  { id: 'dashboard' as Screen, icon: BarChart3, label: 'Dashboard' },
  { id: 'calendar' as Screen, icon: Calendar, label: 'Calendar' },
  { id: 'ppc' as Screen, icon: TrendingUp, label: 'PPC' },
  { id: 'infinity' as Screen, icon: Phone, label: 'Infinity Tracking' },
  { id: 'funding' as Screen, icon: Landmark, label: 'Funding' },
  { id: 'settings' as Screen, icon: Settings, label: 'Settings' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const selectedCampaignId = useAppStore((s) => s.selectedCampaignId);

  useEffect(() => {
    const ping = () => fetch(`${API_URL}/health`, { method: 'GET' }).catch(() => {});
    ping();
    const interval = setInterval(ping, 4 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
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
        return <HomeScreen />;
    }
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar
        items={NAVIGATION_ITEMS}
        currentScreen={currentScreen}
        onScreenChange={setCurrentScreen}
      />
      <main className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-y-auto">{renderScreen()}</div>
        {selectedCampaignId && <CampaignDetailPanel />}
        {selectedTaskId && !selectedCampaignId && <TaskDetailPanel />}
      </main>
    </div>
  );
}
