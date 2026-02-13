import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/admin/DataTable';
import { AlertCircle, CheckCircle2, LogIn, Edit2 } from 'lucide-react';

interface Log {
  id: string;
  action: string;
  user: string;
  target: string;
  status: 'success' | 'failed';
  timestamp: string;
}

const mockLogs: Log[] = [
  {
    id: '1',
    action: 'User Created',
    user: 'admin@haramaya.edu',
    target: 'Abebe Kebede',
    status: 'success',
    timestamp: '2024-02-04 10:30:00',
  },
  {
    id: '2',
    action: 'Project Approved',
    user: 'admin@haramaya.edu',
    target: 'E-Commerce Platform',
    status: 'success',
    timestamp: '2024-02-04 09:15:00',
  },
  {
    id: '3',
    action: 'Login Attempt',
    user: 'jane.smith@haramaya.edu',
    target: 'System',
    status: 'success',
    timestamp: '2024-02-04 08:45:00',
  },
  {
    id: '4',
    action: 'Department Updated',
    user: 'admin@haramaya.edu',
    target: 'Computer Science',
    status: 'success',
    timestamp: '2024-02-03 14:20:00',
  },
  {
    id: '5',
    action: 'Login Attempt',
    user: 'unknown@haramaya.edu',
    target: 'System',
    status: 'failed',
    timestamp: '2024-02-03 13:10:00',
  },
];

export default function AdminLogs() {
  const getActionIcon = (action: string) => {
    if (action.includes('Login')) return <LogIn className="h-4 w-4" />;
    if (action.includes('Created')) return <CheckCircle2 className="h-4 w-4" />;
    return <Edit2 className="h-4 w-4" />;
  };

  const columns = [
    {
      key: 'action',
      label: 'Action',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {getActionIcon(value)}
          <span>{value}</span>
        </div>
      ),
    },
    { key: 'user', label: 'User' },
    { key: 'target', label: 'Target' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          {value === 'success' ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-green-600">Success</span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-600">Failed</span>
            </>
          )}
        </div>
      ),
    },
    { key: 'timestamp', label: 'Timestamp' },
  ];

  return (
    <AdminLayout
      title="System Logs"
      description="View system activity and security logs"
    >
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>Total: {mockLogs.length} recent activities</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={mockLogs} />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
