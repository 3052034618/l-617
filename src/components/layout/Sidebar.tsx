import { NavLink } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ListTodo,
  Activity,
  AlertTriangle,
  CheckSquare,
  FileText,
  Lightbulb,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Satellite,
} from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import { alertApi } from '@/api';

const menuItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/tasks', label: '任务管理', icon: ListTodo },
  { path: '/monitor', label: '实时监控', icon: Activity },
  { path: '/alerts', label: '预警中心', icon: AlertTriangle },
  { path: '/approval', label: '审批中心', icon: CheckSquare },
  { path: '/reports', label: '报告中心', icon: FileText },
  { path: '/recommend', label: '智能推荐', icon: Lightbulb },
  { path: '/statistics', label: '统计看板', icon: BarChart3 },
];

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [pendingAlerts, setPendingAlerts] = useState(0);

  const fetchPendingAlerts = async () => {
    try {
      const res = await alertApi.getList({ status: 'pending', pageSize: 100 });
      if (res.success && res.data) {
        setPendingAlerts(res.data.total);
      }
    } catch (error) {
      console.error('获取预警数量失败:', error);
    }
  };

  useEffect(() => {
    fetchPendingAlerts();
    const interval = setInterval(fetchPendingAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className={`h-full flex flex-col glass transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-60'
      }`}
    >
      <div className="h-16 flex items-center justify-center border-b border-space-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-space-500 to-cyan-500 flex items-center justify-center shadow-glow">
            <Satellite className="w-6 h-6 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold gradient-text">大气辐射模拟平台</span>
              <span className="text-[10px] text-space-400">Atmospheric Radiation Simulator</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const showBadge = item.path === '/alerts' && pendingAlerts > 0;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 animate-slide-up stagger-${Math.min(index + 1, 6)} ${
                  isActive
                    ? 'bg-gradient-to-r from-space-500/20 to-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-glow'
                    : 'text-space-300 hover:bg-space-700/50 hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
              {showBadge && !sidebarCollapsed && (
                <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                  {pendingAlerts}
                </span>
              )}
              {showBadge && sidebarCollapsed && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </NavLink>
          );
        })}
      </nav>

      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="h-12 border-t border-space-700/50 flex items-center justify-center text-space-400 hover:text-white transition-colors"
      >
        {sidebarCollapsed ? (
          <ChevronRight className="w-5 h-5" />
        ) : (
          <ChevronLeft className="w-5 h-5" />
        )}
      </button>
    </aside>
  );
}
