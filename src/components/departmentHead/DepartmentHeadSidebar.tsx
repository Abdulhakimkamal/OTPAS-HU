import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  FileText,
  LogOut,
  Menu,
  X,
  User,
  Lock,
  MessageSquare,
  Lightbulb,
  BarChart3,
  UserCheck,
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
  { label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" />, href: '/department-head' },
  { label: 'Manage Students', icon: <Users className="h-5 w-5" />, href: '/department-head/students' },
  { label: 'Manage Courses', icon: <BookOpen className="h-5 w-5" />, href: '/department-head/courses' },
  { label: 'Manage Instructors', icon: <GraduationCap className="h-5 w-5" />, href: '/department-head/instructors' },
  { label: 'Project Advisors', icon: <UserCheck className="h-5 w-5" />, href: '/department-head/project-advisors' },
  { label: 'Evaluation Analytics', icon: <BarChart3 className="h-5 w-5" />, href: '/department-head/evaluation-analytics' },
  { label: 'Messages', icon: <MessageSquare className="h-5 w-5" />, href: '/department-head/messages' },
  { label: 'Recommendations', icon: <Lightbulb className="h-5 w-5" />, href: '/department-head/recommendations' },
  { label: 'Reports', icon: <FileText className="h-5 w-5" />, href: '/department-head/reports' },
  { label: 'Profile', icon: <User className="h-5 w-5" />, href: '/department-head/profile' },
  { label: 'Change Password', icon: <Lock className="h-5 w-5" />, href: '/department-head/change-password' },
];

export function DepartmentHeadSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

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
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-600 flex-shrink-0">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-lg truncate">OTPAS-HU</h1>
              <p className="text-xs text-slate-400">Department Head</p>
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
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left',
                  isActive
                    ? 'bg-green-600 text-white'
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
