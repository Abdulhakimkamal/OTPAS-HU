import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react';

export default function AdminAnalytics() {
  const analyticsData = [
    {
      title: 'Student Performance',
      description: 'Average GPA by department',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-blue-500',
      stats: [
        { label: 'Computer Science', value: '3.8' },
        { label: 'Information Technology', value: '3.7' },
        { label: 'Software Engineering', value: '3.9' },
        { label: 'Business Admin', value: '3.6' },
      ],
    },
    {
      title: 'Course Enrollment',
      description: 'Students per course',
      icon: <BookOpen className="h-6 w-6" />,
      color: 'bg-green-500',
      stats: [
        { label: 'CS101', value: '156' },
        { label: 'CS201', value: '142' },
        { label: 'CS301', value: '128' },
        { label: 'IT101', value: '134' },
      ],
    },
    {
      title: 'System Activity',
      description: 'Daily active users',
      icon: <TrendingUp className="h-6 w-6" />,
      color: 'bg-purple-500',
      stats: [
        { label: 'Today', value: '342' },
        { label: 'This Week', value: '2,156' },
        { label: 'This Month', value: '8,934' },
        { label: 'All Time', value: '12,456' },
      ],
    },
    {
      title: 'Project Submissions',
      description: 'Submission status',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'bg-orange-500',
      stats: [
        { label: 'Approved', value: '234' },
        { label: 'Pending', value: '45' },
        { label: 'Rejected', value: '12' },
        { label: 'Draft', value: '89' },
      ],
    },
  ];

  return (
    <AdminLayout
      title="Analytics & Reports"
      description="View detailed system analytics and performance metrics"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {analyticsData.map((section, idx) => (
          <Card key={idx}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {section.title}
                  </CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
                <div className={`${section.color} p-3 rounded-lg text-white`}>
                  {section.icon}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.stats.map((stat, i) => (
                  <div key={i} className="flex items-center justify-between pb-3 border-b last:border-0">
                    <span className="text-sm text-muted-foreground">{stat.label}</span>
                    <span className="font-semibold text-lg">{stat.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
