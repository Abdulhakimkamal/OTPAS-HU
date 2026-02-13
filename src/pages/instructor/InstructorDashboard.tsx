import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { StatCard } from '@/components/dashboard/StatCard';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { AnnouncementCard } from '@/components/dashboard/AnnouncementCard';
import { ProjectTitleApprovalPanel } from '@/components/academic/ProjectTitleApprovalPanel';
import { BookOpen, FolderOpen, Users, MessageSquare, Upload, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const mockStats = [
  { title: 'My Courses', value: '4', icon: <BookOpen className="h-6 w-6" />, variant: 'primary' as const },
  { title: 'Total Students', value: '156', icon: <Users className="h-6 w-6" />, variant: 'info' as const },
  { title: 'Active Projects', value: '23', icon: <FolderOpen className="h-6 w-6" />, variant: 'warning' as const },
  { title: 'Pending Approvals', value: '8', icon: <CheckCircle className="h-6 w-6" />, variant: 'success' as const, description: 'Awaiting review' },
];

const mockActivities = [
  { id: '1', type: 'project' as const, title: 'Project submitted', description: 'Mekdes Haile - Web App Development', time: '1h ago' },
  { id: '2', type: 'tutorial' as const, title: 'Tutorial uploaded', description: 'Chapter 5: Database Design', time: '3h ago' },
  { id: '3', type: 'feedback' as const, title: 'Feedback sent', description: 'Review for Dawit Gebre project', time: '5h ago' },
  { id: '4', type: 'project' as const, title: 'New advisee assigned', description: 'Yonas Bekele - Mobile App Project', time: '1d ago' },
];

const quickActions = [
  { label: 'Approve Titles', description: 'Review project titles', href: '/instructor/academic-projects', icon: <CheckCircle className="h-5 w-5" />, variant: 'primary' as const },
  { label: 'Create Evaluation', description: 'Evaluate student work', href: '/instructor/evaluations', icon: <Upload className="h-5 w-5" /> },
  { label: 'View Students', description: 'Manage your students', href: '/instructor/students', icon: <Users className="h-5 w-5" /> },
  { label: 'View My Courses', description: 'Manage course content', href: '/instructor/courses', icon: <BookOpen className="h-5 w-5" /> },
];

const mockAnnouncements = [
  { id: '1', title: 'Grading Deadline', content: 'All grades must be submitted by end of month.', author: 'Department Head', date: 'Today', isGlobal: false },
  { id: '2', title: 'New Tutorial Guidelines', content: 'Please follow the updated format for tutorials.', author: 'Academic Office', date: '3 days ago', isGlobal: true },
];

export default function InstructorDashboard() {
  return (
    <DashboardLayout>
      <div className="page-transition">
        <WelcomeHeader />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {mockStats.map((stat) => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="approvals">Project Approvals</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <RecentActivity activities={mockActivities} />
              </div>
              <div className="space-y-6">
                <QuickActions actions={quickActions} />
                <AnnouncementCard announcements={mockAnnouncements} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="approvals">
            <ProjectTitleApprovalPanel />
          </TabsContent>

          <TabsContent value="evaluations">
            <div className="text-center py-12">
              <p className="text-gray-600">Evaluation management coming soon</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}