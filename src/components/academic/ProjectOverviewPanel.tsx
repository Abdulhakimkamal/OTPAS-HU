/**
 * Project Overview Panel
 * Department head dashboard for monitoring projects
 */

import { useQuery } from '@tanstack/react-query';
import { departmentHeadApi, Project } from '@/services/academicApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FolderOpen, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  'pending': {
    icon: <Clock className="h-4 w-4" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  'approved': {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  'rejected': {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

export function ProjectOverviewPanel() {
  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projectOverview'],
    queryFn: () => departmentHeadApi.getProjectDetails(),
  });

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load project data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate statistics
  const stats = {
    total: projects.length,
    approved: projects.filter(p => p.status === 'approved').length,
    pending: projects.filter(p => p.status === 'pending').length,
    rejected: projects.filter(p => p.status === 'rejected').length,
  };

  const approvalRate = stats.total > 0
    ? ((stats.approved / stats.total) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Approval Rate</CardTitle>
          <CardDescription>Percentage of approved projects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{approvalRate}%</span>
              <span className="text-sm text-gray-500">{stats.approved} of {stats.total}</span>
            </div>
            <Progress value={parseFloat(approvalRate as string)} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Projects</CardTitle>
          <CardDescription>Complete list of student projects</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No projects yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map((project) => {
                const config = statusConfig[project.status];
                return (
                  <div
                    key={project.id}
                    className={`p-4 rounded-lg border ${config.bgColor}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">{project.title}</h4>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Submitted: {new Date(project.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={config.color}>
                          {config.icon}
                          <span className="ml-1">{project.status.charAt(0).toUpperCase() + project.status.slice(1)}</span>
                        </Badge>
                      </div>
                    </div>

                    {/* Status Timeline */}
                    {(project.approved_at || project.rejected_at) && (
                      <div className="mt-3 text-xs text-gray-600">
                        {project.approved_at && (
                          <p>Approved: {new Date(project.approved_at).toLocaleDateString()}</p>
                        )}
                        {project.rejected_at && (
                          <p>Rejected: {new Date(project.rejected_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
