import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SandyInterface } from '@/components/SandyInterface';

export default function App() {
  return (
    <BrowserRouter basename="/mtech-ai-office">
      <Routes>
        <Route path="/" element={<SandyInterface />} />
      </Routes>
    </BrowserRouter>
  );
}
