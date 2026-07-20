import { useState, useEffect } from 'react';
import { TodaysWork } from '@/components/TodaysWork';
import { SettingsPanel } from '@/components/SettingsPanel';
import { LeftSidebar, type NavKey } from '@/components/layout/LeftSidebar';
import { TopBar, type TopTab } from '@/components/layout/TopBar';

export function SandyInterface() {
  const [topTab, setTopTab] = useState<TopTab>('home');
  const [companyId, setCompanyId] = useState<string>('default');
  const [currentUserId, setCurrentUserId] = useState<string>('emilee');

  // Initialize company and user
  useEffect(() => {
    setCompanyId('mtech-group');
  }, []);

  const handleNavSelect = (key: NavKey) => {
    // Map left sidebar navigation to top tabs
    const tabMap: Record<NavKey, TopTab> = {
      home: 'home',
      team: 'home',
      messages: 'home',
      tasks: 'tasks',
      calendar: 'home',
      files: 'home',
      campaigns: 'campaigns',
      analytics: 'home',
      help: 'home',
    };
    setTopTab(tabMap[key] || 'home');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: '#070A0F' }}>
      <LeftSidebar active="home" onSelect={handleNavSelect} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar active={topTab} onSelect={setTopTab} />

        <div className="flex-1 overflow-hidden">
          {/* Home / Today's Work */}
          {topTab === 'home' && (
            <TodaysWork companyId={companyId} currentUserId={currentUserId} />
          )}

          {/* Projects */}
          {topTab === 'projects' && (
            <PlaceholderScreen title="Projects" subtitle="Organize work around projects" />
          )}

          {/* Tasks */}
          {topTab === 'tasks' && (
            <PlaceholderScreen title="Tasks" subtitle="All tasks across projects" />
          )}

          {/* Campaigns */}
          {topTab === 'campaigns' && (
            <PlaceholderScreen title="Campaigns" subtitle="Marketing campaigns by brand" />
          )}

          {/* Board Room */}
          {topTab === 'board-room' && (
            <PlaceholderScreen title="Board Room" subtitle="Weekly management reporting" />
          )}

          {/* Knowledge */}
          {topTab === 'knowledge' && (
            <PlaceholderScreen title="Knowledge Hub" subtitle="Brand guidelines and reference material" />
          )}

          {/* Settings */}
          {topTab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
  );
}

function PlaceholderScreen({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center flex-col" style={{ backgroundColor: '#070A0F' }}>
      <div className="text-center">
        <p className="text-2xl font-bold" style={{ color: '#E8ECF1' }}>
          {title}
        </p>
        <p className="text-sm mt-2" style={{ color: '#5C6879' }}>
          {subtitle}
        </p>
        <p className="text-sm mt-4" style={{ color: '#5C6879' }}>
          Coming in Phase 1
        </p>
      </div>
    </div>
  );
}
