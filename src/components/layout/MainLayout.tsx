import { ReactNode } from 'react';
import { SideNavigation } from './SideNavigation';
import { TopHeader } from './TopHeader';
import { RightSidebar } from './RightSidebar';

interface MainLayoutProps {
  children: ReactNode;
  showRightSidebar?: boolean;
  rightPanel?: ReactNode;
}

export function MainLayout({ children, showRightSidebar = true, rightPanel }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: '#111B26' }}>
      {/* Left Sidebar */}
      <SideNavigation />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <TopHeader />

        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 overflow-auto">{children}</div>

          {/* Right Sidebar or Custom Panel */}
          {rightPanel || (showRightSidebar && <RightSidebar />)}
        </div>
      </div>
    </div>
  );
}
