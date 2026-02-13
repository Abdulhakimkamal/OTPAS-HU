import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileText, BarChart3, Users, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/services/api';

interface Report {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  lastGenerated: string;
}

const reports: Report[] = [
  {
    id: '1',
    title: 'Student Performance',
    description: 'Detailed analysis of student grades and progress',
    icon: <Users className="h-6 w-6" />,
    color: 'bg-blue-500',
    lastGenerated: '2024-02-03',
  },
  {
    id: '2',
    title: 'Instructor Activity',
    description: 'Track instructor engagement and course management',
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'bg-green-500',
    lastGenerated: '2024-02-02',
  },
  {
    id: '3',
    title: 'System Usage',
    description: 'Overall platform usage statistics and trends',
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'bg-purple-500',
    lastGenerated: '2024-02-01',
  },
  {
    id: '4',
    title: 'Department Performance',
    description: 'Comparative analysis across departments',
    icon: <FileText className="h-6 w-6" />,
    color: 'bg-orange-500',
    lastGenerated: '2024-01-31',
  },
];

export default function AdminReports() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (reportId: string, reportTitle: string) => {
    setDownloading(reportId);
    
    try {
      // For now, generate a mock CSV report
      // In production, this would call the backend API
      const reportData = generateMockReport(reportTitle);
      
      // Create a blob and download it
      const blob = new Blob([reportData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `${reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${reportTitle} downloaded successfully`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report');
    } finally {
      setDownloading(null);
    }
  };

  const generateMockReport = (reportTitle: string): string => {
    const date = new Date().toISOString().split('T')[0];
    
    switch (reportTitle) {
      case 'Student Performance':
        return `Student Performance Report - ${date}\n\n` +
               `Student ID,Name,Department,GPA,Courses Completed,Status\n` +
               `1001,John Doe,Computer Science,3.8,24,Active\n` +
               `1002,Jane Smith,Information Systems,3.9,22,Active\n` +
               `1003,Ahmed Hassan,Software Engineering,3.7,20,Active\n` +
               `1004,Sarah Johnson,Computer Science,3.6,18,Active\n` +
               `1005,Maria Garcia,Information Systems,3.5,16,Active\n`;
      
      case 'Instructor Activity':
        return `Instructor Activity Report - ${date}\n\n` +
               `Instructor ID,Name,Department,Courses,Students,Avg Rating\n` +
               `2001,Dr. John Smith,Computer Science,3,120,4.5\n` +
               `2002,Prof. Sarah Lee,Information Systems,2,80,4.7\n` +
               `2003,Dr. Ahmed Ali,Software Engineering,4,150,4.3\n` +
               `2004,Dr. Maria Lopez,Computer Science,2,90,4.6\n`;
      
      case 'System Usage':
        return `System Usage Report - ${date}\n\n` +
               `Date,Total Users,Active Users,Logins,Page Views,Avg Session (min)\n` +
               `2024-02-01,450,320,580,12500,25\n` +
               `2024-02-02,455,335,620,13200,27\n` +
               `2024-02-03,460,340,650,13800,26\n` +
               `2024-02-04,465,345,670,14100,28\n` +
               `2024-02-05,470,350,690,14500,29\n`;
      
      case 'Department Performance':
        return `Department Performance Report - ${date}\n\n` +
               `Department,Students,Instructors,Courses,Avg GPA,Completion Rate\n` +
               `Computer Science,156,8,24,3.7,92%\n` +
               `Information Systems,142,7,20,3.8,94%\n` +
               `Software Engineering,128,6,18,3.6,90%\n` +
               `Electrical Engineering,98,5,15,3.5,88%\n` +
               `Mathematics,85,4,12,3.9,95%\n`;
      
      default:
        return `Report: ${reportTitle}\nGenerated: ${date}\n\nNo data available`;
    }
  };

  return (
    <AdminLayout
      title="Reports & Analytics"
      description="Generate and download system reports"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((report) => (
          <Card key={report.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`${report.color} p-3 rounded-lg text-white`}>
                    {report.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{report.title}</CardTitle>
                    <CardDescription>{report.description}</CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Last generated: {report.lastGenerated}
                </p>
                <Button 
                  size="sm" 
                  className="gap-2"
                  onClick={() => handleDownload(report.id, report.title)}
                  disabled={downloading === report.id}
                >
                  <Download className="h-4 w-4" />
                  {downloading === report.id ? 'Downloading...' : 'Download'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
