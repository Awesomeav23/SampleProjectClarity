import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { usePermission } from '../lib/permissions';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  ClipboardList,
  LineChart,
  RefreshCw,
  Activity,
  LogOut,
} from 'lucide-react';
import clsx from 'clsx';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: string;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
  { label: 'SOWs', path: '/sows', icon: <FileText size={20} />, permission: 'sow:read' },
  { label: 'Capacity', path: '/capacity', icon: <BarChart3 size={20} />, permission: 'capacity:read' },
  { label: 'Assignments', path: '/assignments', icon: <ClipboardList size={20} />, permission: 'assignment:read' },
  { label: 'Burnt Reports', path: '/burnt-reports', icon: <LineChart size={20} />, permission: 'burnt_report:read' },
  { label: 'Change Orders', path: '/change-orders', icon: <RefreshCw size={20} />, permission: 'change_order:read' },
  { label: 'Integrations', path: '/integrations', icon: <Activity size={20} />, permission: 'admin:system_config' },
];

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          isActive
            ? 'bg-indigo-50 text-indigo-700'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )
      }
    >
      {item.icon}
      {item.label}
    </NavLink>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">Project Clarity</h1>
          <p className="text-xs text-gray-500">DynPro Operations</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <FilteredNavItem key={item.path} item={item} />
          ))}
        </nav>

        {/* User info + logout */}
        <div className="p-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.roleName}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function FilteredNavItem({ item }: { item: NavItem }) {
  const hasPermission = usePermission(item.permission ?? '');
  if (item.permission && !hasPermission) return null;
  return <SidebarLink item={item} />;
}
