import { useState, useEffect } from 'react';
import { TodaysWork } from '@/components/TodaysWork';
import { TasksList } from '@/components/TasksList';
import { ProjectsList } from '@/components/ProjectsList';
import { CampaignsList } from '@/components/CampaignsList';
import { BoardRoom } from '@/components/BoardRoom';
import { KnowledgeHub } from '@/components/KnowledgeHub';
import { SettingsPanel } from '@/components/SettingsPanel';
import { ActivityFeed } from '@/components/ActivityFeed';
import { EmployeeChat } from '@/components/EmployeeChat';
import { CalendarScheduling } from '@/components/CalendarScheduling';
import { VisualOutputs } from '@/components/VisualOutputs';
import { LeftSidebar, type NavKey } from '@/components/layout/LeftSidebar';
import { TopBar, type TopTab } from '@/components/layout/TopBar';
import { CompletedTasksProvider } from '@/contexts/CompletedTasksContext';

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
      team: 'chat',
      messages: 'chat',
      tasks: 'tasks',
      calendar: 'calendar',
      files: 'outputs',
      campaigns: 'campaigns',
      analytics: 'activity',
      help: 'home',
    };
    setTopTab(tabMap[key] || 'home');
  };

  return (
    <CompletedTasksProvider>
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
            <ProjectsList companyId={companyId} currentUserId={currentUserId} />
          )}

          {/* Tasks */}
          {topTab === 'tasks' && (
            <TasksList companyId={companyId} currentUserId={currentUserId} />
          )}

          {/* Campaigns */}
          {topTab === 'campaigns' && (
            <CampaignsList companyId={companyId} currentUserId={currentUserId} />
          )}

          {/* Activity Feed */}
          {topTab === 'activity' && (
            <ActivityFeed />
          )}

          {/* Employee Chat */}
          {topTab === 'chat' && (
            <EmployeeChat />
          )}

          {/* Calendar & Scheduling */}
          {topTab === 'calendar' && (
            <CalendarScheduling />
          )}

          {/* Visual Outputs */}
          {topTab === 'outputs' && (
            <VisualOutputs />
          )}

          {/* Board Room */}
          {topTab === 'board-room' && (
            <BoardRoom companyId={companyId} currentUserId={currentUserId} />
          )}

          {/* Knowledge */}
          {topTab === 'knowledge' && (
            <KnowledgeHub companyId={companyId} currentUserId={currentUserId} />
          )}

          {/* Settings */}
          {topTab === 'settings' && <SettingsPanel />}
        </div>
      </div>
    </div>
    </CompletedTasksProvider>
  );
}
