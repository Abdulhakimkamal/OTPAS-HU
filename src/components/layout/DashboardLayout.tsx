import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Users,
  BookOpen,
  FileText,
  FolderOpen,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  Building2,
  UserCog,
  MessageSquare,
  Lightbulb,
  ClipboardList,
  Download,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const roleNavItems: Record<AppRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard', href: '/admin', icon: <Home className="h-5 w-5" /> },
    { label: 'Users', href: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { label: 'Departments', href: '/admin/departments', icon: <Building2 className="h-5 w-5" /> },
    { label: 'Courses', href: '/admin/courses', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Reports', href: '/admin/reports', icon: <BarChart3 className="h-5 w-5" /> },
    { label: 'Activity Logs', href: '/admin/logs', icon: <ClipboardList className="h-5 w-5" /> },
  ],
  department_head: [
    { label: 'Dashboard', href: '/department-head', icon: <Home className="h-5 w-5" /> },
    { label: 'Students', href: '/department-head/students', icon: <GraduationCap className="h-5 w-5" /> },
    { label: 'Instructors', href: '/department-head/instructors', icon: <UserCog className="h-5 w-5" /> },
    { label: 'Courses', href: '/department-head/courses', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Course Materials', href: '/department-head/course-materials', icon: <Upload className="h-5 w-5" /> },
    { label: 'Academic Monitoring', href: '/department-head/academic-monitoring', icon: <BarChart3 className="h-5 w-5" /> },
    { label: 'Project Advisors', href: '/department-head/project-advisors', icon: <UserCog className="h-5 w-5" /> },
    { label: 'Reports', href: '/department-head/reports', icon: <BarChart3 className="h-5 w-5" /> },
  ],
  instructor: [
    { label: 'Dashboard', href: '/instructor', icon: <Home className="h-5 w-5" /> },
    { label: 'My Courses', href: '/instructor/courses', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Academic Projects', href: '/instructor/academic-projects', icon: <FolderOpen className="h-5 w-5" /> },
    { label: 'Announcements', href: '/instructor/announcements', icon: <Bell className="h-5 w-5" /> },
    { label: 'Students', href: '/instructor/students', icon: <Users className="h-5 w-5" /> },
    { label: 'Evaluations', href: '/instructor/evaluations', icon: <ClipboardList className="h-5 w-5" /> },
    { label: 'Recommendations', href: '/instructor/recommendations', icon: <Lightbulb className="h-5 w-5" /> },
    { label: 'Messages', href: '/instructor/messages', icon: <MessageSquare className="h-5 w-5" /> },
    { label: 'Reports', href: '/instructor/reports', icon: <BarChart3 className="h-5 w-5" /> },
  ],
  student: [
    { label: 'Dashboard', href: '/student', icon: <Home className="h-5 w-5" /> },
    { label: 'My Courses', href: '/student/courses', icon: <BookOpen className="h-5 w-5" /> },
    { label: 'Tutorials', href: '/student/tutorials', icon: <FileText className="h-5 w-5" /> },
    { label: 'Academic Projects', href: '/student/academic-projects', icon: <FolderOpen className="h-5 w-5" /> },
    { label: 'Progress', href: '/student/progress', icon: <BarChart3 className="h-5 w-5" /> },
    { label: 'Recommendations', href: '/student/recommendations', icon: <Lightbulb className="h-5 w-5" /> },
    { label: 'Announcements', href: '/student/announcements', icon: <Bell className="h-5 w-5" /> },
    { label: 'Messages', href: '/student/messages', icon: <MessageSquare className="h-5 w-5" /> },
  ],
};

const roleLabels: Record<AppRole, string> = {
  admin: 'System Administrator',
  department_head: 'Department Head',
  instructor: 'Instructor',
  student: 'Student',
};

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, role, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = role ? roleNavItems[role] : [];

  // Mock notifications data - in a real app, this would come from an API
  const [notifications] = useState([
    {
      id: 1,
      title: 'New Course Assignment',
      message: 'You have been assigned to CS401 - Advanced Programming',
      time: '2 hours ago',
      read: false,
      type: 'info'
    },
    {
      id: 2,
      title: 'Evaluation Reminder',
      message: 'Mid-term evaluations are due in 3 days',
      time: '1 day ago',
      read: false,
      type: 'warning'
    },
    {
      id: 3,
      title: 'System Update',
      message: 'The system will be updated tonight at 2 AM',
      time: '2 days ago',
      read: true,
      type: 'info'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-72 bg-sidebar transform transition-transform duration-300 ease-in-out lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-sidebar-primary">
              <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-semibold text-sidebar-foreground">OTPAS-HU</span>
              <span className="text-xs text-sidebar-foreground/60">Haramaya University</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Role badge */}
          <div className="px-6 py-4">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-sidebar-accent text-sidebar-accent-foreground">
              {role && roleLabels[role]}
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto scrollbar-thin">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "sidebar-link",
                    isActive && "active"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 border-t border-sidebar-border">
            <Link
              to="/settings"
              className="sidebar-link"
              onClick={() => setSidebarOpen(false)}
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top navbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 lg:px-8 bg-card border-b border-border">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                    >
                      {unreadCount}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Notifications</span>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {unreadCount} new
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4 cursor-pointer">
                        <div className="flex items-start justify-between w-full">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <p className={cn(
                                "text-sm font-medium",
                                !notification.read && "text-primary"
                              )}>
                                {notification.title}
                              </p>
                              {!notification.read && (
                                <div className="w-2 h-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {notification.time}
                            </p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="justify-center text-sm text-primary cursor-pointer">
                  View all notifications
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="" alt={user?.email || ''} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {role && roleLabels[role]}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
