import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, User, BookOpen, CheckCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface StudentProgress {
  id: string;
  name: string;
  email: string;
  department: string;
  coursesEnrolled: number;
  coursesCompleted: number;
  overallProgress: number;
  gpa: number;
  projectsSubmitted: number;
  projectsApproved: number;
  lastActivity: string;
  status: 'on-track' | 'at-risk' | 'excellent';
}

const mockStudentProgress: StudentProgress[] = [
  {
    id: '1',
    name: 'Abebe Kebede',
    email: 'abebe.kebede@student.haramaya.edu',
    department: 'Computer Science',
    coursesEnrolled: 6,
    coursesCompleted: 4,
    overallProgress: 75,
    gpa: 3.8,
    projectsSubmitted: 3,
    projectsApproved: 2,
    lastActivity: '2024-01-20',
    status: 'excellent',
  },
  {
    id: '2',
    name: 'Almaz Tekle',
    email: 'almaz.tekle@student.haramaya.edu',
    department: 'Information Technology',
    coursesEnrolled: 6,
    coursesCompleted: 3,
    overallProgress: 55,
    gpa: 2.9,
    projectsSubmitted: 1,
    projectsApproved: 0,
    lastActivity: '2024-01-15',
    status: 'at-risk',
  },
  {
    id: '3',
    name: 'Tigist Hailu',
    email: 'tigist.hailu@student.haramaya.edu',
    department: 'Computer Science',
    coursesEnrolled: 6,
    coursesCompleted: 5,
    overallProgress: 88,
    gpa: 3.9,
    projectsSubmitted: 4,
    projectsApproved: 4,
    lastActivity: '2024-01-21',
    status: 'excellent',
  },
  {
    id: '4',
    name: 'Dawit Assefa',
    email: 'dawit.assefa@student.haramaya.edu',
    department: 'Software Engineering',
    coursesEnrolled: 6,
    coursesCompleted: 2,
    overallProgress: 40,
    gpa: 2.1,
    projectsSubmitted: 0,
    projectsApproved: 0,
    lastActivity: '2024-01-10',
    status: 'at-risk',
  },
];

export default function AdminStudentProgress() {
  const [students, setStudents] = useState<StudentProgress[]>(mockStudentProgress);
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter((student) => {
    const matchesDept = filterDepartment === 'all' || student.department === filterDepartment;
    const matchesStatus = filterStatus === 'all' || student.status === filterStatus;
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesStatus && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-100 text-green-700';
      case 'on-track':
        return 'bg-blue-100 text-blue-700';
      case 'at-risk':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Student',
      render: (value: string, row: StudentProgress) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
    },
    {
      key: 'overallProgress',
      label: 'Progress',
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <Progress value={value} className="w-24" />
          <span className="text-sm font-medium">{value}%</span>
        </div>
      ),
    },
    {
      key: 'gpa',
      label: 'GPA',
      render: (value: number) => (
        <span className={`font-medium ${value >= 3.5 ? 'text-green-600' : value >= 2.5 ? 'text-yellow-600' : 'text-red-600'}`}>
          {value.toFixed(2)}
        </span>
      ),
    },
    {
      key: 'coursesCompleted',
      label: 'Courses',
      render: (value: number, row: StudentProgress) => (
        <span className="text-sm">{value}/{row.coursesEnrolled}</span>
      ),
    },
    {
      key: 'projectsApproved',
      label: 'Projects',
      render: (value: number, row: StudentProgress) => (
        <span className="text-sm">{value}/{row.projectsSubmitted}</span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
          {value.replace('-', ' ').charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
  ];

  const excellentCount = students.filter((s) => s.status === 'excellent').length;
  const atRiskCount = students.filter((s) => s.status === 'at-risk').length;
  const avgGPA = (students.reduce((sum, s) => sum + s.gpa, 0) / students.length).toFixed(2);

  return (
    <AdminLayout
      title="Student Progress Tracking"
      description="Monitor overall student progress across courses and projects"
    >
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Students</p>
                  <p className="text-2xl font-bold">{students.length}</p>
                </div>
                <User className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Excellent</p>
                  <p className="text-2xl font-bold text-green-600">{excellentCount}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">At Risk</p>
                  <p className="text-2xl font-bold text-red-600">{atRiskCount}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average GPA</p>
                  <p className="text-2xl font-bold">{avgGPA}</p>
                </div>
                <BookOpen className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle>Student Progress</CardTitle>
            <CardDescription>Track academic performance and course completion</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Search</label>
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Department</label>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Computer Science">Computer Science</SelectItem>
                    <SelectItem value="Information Technology">Information Technology</SelectItem>
                    <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="on-track">On Track</SelectItem>
                    <SelectItem value="at-risk">At Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data Table */}
            <DataTable
              columns={columns}
              data={filteredStudents}
              searchPlaceholder="Search students..."
            />
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
