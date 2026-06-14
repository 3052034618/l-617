import { Bell, Search, User, Settings, Moon } from 'lucide-react';
import useAppStore from '@/store/useAppStore';
import { useState, useEffect } from 'react';
import { alertApi } from '@/api';

export default function Header() {
  const { userRole } = useAppStore();
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);

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

  const roleLabels: Record<string, string> = {
    scientist: '遥感科学家',
    processor: '数据处理员',
    manager: '项目负责人',
    chief: '首席科学家',
  };

  return (
    <header className="h-16 glass border-b border-space-700/50 flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-space-400" />
          <input
            type="text"
            placeholder="搜索任务、预警、报告..."
            className="pl-10 pr-4 py-2 w-80 text-sm bg-deep-800/80 border border-space-600/30 rounded-lg focus:border-space-500/50 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="relative p-2 rounded-lg text-space-300 hover:text-white hover:bg-space-700/50 transition-colors">
          <Bell className="w-5 h-5" />
          {pendingAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
              {pendingAlerts}
            </span>
          )}
        </button>

        <button className="p-2 rounded-lg text-space-300 hover:text-white hover:bg-space-700/50 transition-colors">
          <Settings className="w-5 h-5" />
        </button>

        <button className="p-2 rounded-lg text-space-300 hover:text-white hover:bg-space-700/50 transition-colors">
          <Moon className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-space-600/50 mx-1" />

        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-1.5 rounded-lg hover:bg-space-700/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-space-400 to-cyan-500 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">张科学家</div>
              <div className="text-xs text-space-400">{roleLabels[userRole]}</div>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 glass rounded-lg shadow-xl py-1 z-50 animate-fade-in">
              <button className="w-full px-4 py-2 text-left text-sm text-space-200 hover:bg-space-700/50 transition-colors">
                个人资料
              </button>
              <button className="w-full px-4 py-2 text-left text-sm text-space-200 hover:bg-space-700/50 transition-colors">
                系统设置
              </button>
              <div className="border-t border-space-600/50 my-1" />
              <button className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                退出登录
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
