import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, CheckSquare, Building2, AlertCircle, TrendingUp } from 'lucide-react';

interface StatCard {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  trend?: number;
  color: string;
}

const stats: StatCard[] = [
  {
    title: 'Total Users',
    value: '1,234',
    description: 'Active users in system',
    icon: <Users className="h-6 w-6" />,
    trend: 12,
    color: 'bg-blue-500',
  },
  {
    title: 'Total Students',
    value: '856',
    description: 'Enrolled students',
    icon: <Users className="h-6 w-6" />,
    trend: 8,
    color: 'bg-green-500',
  },
  {
    title: 'Active Projects',
    value: '342',
    description: 'Ongoing projects',
    icon: <CheckSquare className="h-6 w-6" />,
    trend: 15,
    color: 'bg-purple-500',
  },
  {
    title: 'Departments',
    value: '4',
    description: 'Academic departments',
    icon: <Building2 className="h-6 w-6" />,
    color: 'bg-orange-500',
  },
  {
    title: 'Tutorials',
    value: '523',
    description: 'Published tutorials',
    icon: <BookOpen className="h-6 w-6" />,
    trend: 5,
    color: 'bg-indigo-500',
  },
  {
    title: 'Pending Approvals',
    value: '23',
    description: 'Awaiting review',
    icon: <AlertCircle className="h-6 w-6" />,
    color: 'bg-red-500',
  },
];

export default function AdminOverview() {
  return (
    <AdminLayout
      title="Dashboard"
      description="Welcome to the OTPAS-HU Admin Panel. Monitor system activity and manage resources."
    >
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.color} p-2 rounded-lg text-white`}>
                {stat.icon}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">{stat.description}</p>
                {stat.trend && (
                  <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                    <TrendingUp className="h-3 w-3" />
                    +{stat.trend}%
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'New user registered', time: '2 hours ago', user: 'Abebe Kebede' },
                { action: 'Project approved', time: '4 hours ago', user: 'Prof. Jane Smith' },
                { action: 'Department updated', time: '1 day ago', user: 'Dr. John Doe' },
                { action: 'Tutorial published', time: '2 days ago', user: 'Dr. Ahmed Hassan' },
              ].map((activity, idx) => (
                <div key={idx} className="flex items-start gap-4 pb-4 border-b last:border-0">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Current system status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Database', status: 'Healthy', color: 'bg-green-500' },
                { label: 'API Server', status: 'Healthy', color: 'bg-green-500' },
                { label: 'Storage', status: 'Healthy', color: 'bg-green-500' },
                { label: 'Email Service', status: 'Healthy', color: 'bg-green-500' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-xs text-muted-foreground">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
