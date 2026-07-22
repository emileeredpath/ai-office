import { useState } from 'react';
import { Home, CheckSquare, FolderOpen, Calendar, BarChart3, Settings } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TaskDetailPanel } from '@/components/tasks/TaskDetailPanel';
import { HomeScreen } from '@/screens/HomeScreen';
import { MyTasksScreen } from '@/screens/MyTasksScreen';
import { CampaignsScreen } from '@/screens/CampaignsScreen';
import { CalendarScreen } from '@/screens/CalendarScreen';
import { DashboardScreen } from '@/screens/DashboardScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useAppStore } from '@/store/useAppStore';
import '@/styles/main.css';

type Screen = 'home' | 'tasks' | 'campaigns' | 'calendar' | 'dashboard' | 'settings';

const NAVIGATION_ITEMS = [
  { id: 'home' as Screen, icon: Home, label: 'Home' },
  { id: 'tasks' as Screen, icon: CheckSquare, label: 'My Tasks' },
  { id: 'campaigns' as Screen, icon: FolderOpen, label: 'Campaigns' },
  { id: 'calendar' as Screen, icon: Calendar, label: 'Calendar' },
  { id: 'dashboard' as Screen, icon: BarChart3, label: 'Dashboard' },
  { id: 'settings' as Screen, icon: Settings, label: 'Settings' },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen />;
      case 'tasks':
        return <MyTasksScreen />;
      case 'campaigns':
        return <CampaignsScreen />;
      case 'calendar':
        return <CalendarScreen />;
      case 'dashboard':
        return <DashboardScreen />;
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
        {selectedTaskId && <TaskDetailPanel />}
      </main>
    </div>
  );
}
