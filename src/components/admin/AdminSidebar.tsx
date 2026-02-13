import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  Building2,
  FileText,
  LogOut,
  Menu,
  X,
  Settings,
  TrendingUp,
  Lightbulb,
  User,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Overview', icon: <LayoutDashboard className="h-5 w-5" />, href: '/admin' },
  { label: 'Create Account', icon: <Users className="h-5 w-5" />, href: '/admin/create-user' },
  { label: 'Manage Users', icon: <Users className="h-5 w-5" />, href: '/admin/users' },
  { label: 'Add Faculty', icon: <Users className="h-5 w-5" />, href: '/admin/add-faculty' },
  { label: 'Departments', icon: <Building2 className="h-5 w-5" />, href: '/admin/departments' },
  { label: 'Student Progress', icon: <TrendingUp className="h-5 w-5" />, href: '/admin/student-progress' },
  { label: 'Recommendations', icon: <Lightbulb className="h-5 w-5" />, href: '/admin/recommendations' },
  { label: 'Reports', icon: <FileText className="h-5 w-5" />, href: '/admin/reports' },
  { label: 'Logs', icon: <FileText className="h-5 w-5" />, href: '/admin/logs' },
  { label: 'Manage Profile', icon: <User className="h-5 w-5" />, href: '/admin/profile' },
  { label: 'Change Password', icon: <Lock className="h-5 w-5" />, href: '/admin/change-password' },
  { label: 'Settings', icon: <Settings className="h-5 w-5" />, href: '/admin/settings' },
];

export function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const toggleMenu = (label: string) => {
    setExpandedMenu(expandedMenu === label ? null : label);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white transition-transform duration-300 z-40 lg:translate-x-0 overflow-y-auto',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-slate-700 sticky top-0 bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 flex-shrink-0">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate">OTPAS-HU</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => {
                  setIsOpen(false);
                  setExpandedMenu(null);
                }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                )}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge ? (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 flex-shrink-0">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700 sticky bottom-0 bg-slate-900">
          <Button 
            onClick={handleLogout}
            className="w-full justify-start text-slate-300 hover:text-white bg-yellow-500 hover:bg-yellow-600 text-black hover:text-black"
          >
            <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
            <span className="truncate">Logout</span>
          </Button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
