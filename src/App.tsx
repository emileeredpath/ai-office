import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { StatusBar } from '@/components/layout/StatusBar';
import { OfficeSidebar } from '@/components/layout/OfficeSidebar';
import { OfficePage } from '@/pages/OfficePage';
import { EmployeePage } from '@/pages/EmployeePage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { SceneController } from '@/components/SceneController';

function AppRoutes() {
  const location = useLocation();
  const is3DOffice = location.pathname === '/3d-office';

  return (
    <div className="flex flex-col h-screen" style={{ backgroundColor: '#111B26' }}>
      <StatusBar />
      <div className="flex flex-1 overflow-hidden">
        <OfficeSidebar />
        <main className={is3DOffice ? 'flex-1' : 'flex-1 overflow-y-auto'}>
          <Routes>
            <Route path="/" element={<OfficePage />} />
            <Route path="/3d-office" element={<SceneController />} />
            <Route path="/employee/:id" element={<EmployeePage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
