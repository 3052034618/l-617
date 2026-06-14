import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import Dashboard from '@/pages/Dashboard';
import TaskList from '@/pages/TaskList';
import TaskDetail from '@/pages/TaskDetail';
import TaskCreate from '@/pages/TaskCreate';
import Monitor from '@/pages/Monitor';
import Alerts from '@/pages/Alerts';
import Approval from '@/pages/Approval';
import Reports from '@/pages/Reports';
import Recommend from '@/pages/Recommend';
import Statistics from '@/pages/Statistics';
import useAppStore from '@/store/useAppStore';

export default function App() {
  const initializeMockData = useAppStore((state) => state.initializeMockData);

  useEffect(() => {
    initializeMockData();
  }, [initializeMockData]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<TaskList />} />
          <Route path="/tasks/create" element={<TaskCreate />} />
          <Route path="/tasks/:id" element={<TaskDetail />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/approval" element={<Approval />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/recommend" element={<Recommend />} />
          <Route path="/statistics" element={<Statistics />} />
        </Route>
      </Routes>
    </Router>
  );
}
