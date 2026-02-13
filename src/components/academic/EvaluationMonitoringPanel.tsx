/**
 * Evaluation Monitoring Panel
 * Department head dashboard for monitoring evaluations
 */

import { useQuery } from '@tanstack/react-query';
import { departmentHeadApi } from '@/services/academicApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, TrendingUp, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export function EvaluationMonitoringPanel() {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['evaluationSummary'],
    queryFn: () => departmentHeadApi.getEvaluationSummary(),
  });

  const { data: evaluations = [], isLoading: evaluationsLoading } = useQuery({
    queryKey: ['evaluationDetails'],
    queryFn: () => departmentHeadApi.getEvaluationDetails(),
  });

  if (summaryError) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load evaluation data</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isLoading = summaryLoading || evaluationsLoading;

  // Prepare data for charts
  const typeData = summary?.by_type
    ? Object.entries(summary.by_type).map(([type, count]) => ({
        name: type.replace(/_/g, ' ').toUpperCase(),
        value: count,
      }))
    : [];

  const statusData = summary?.by_status
    ? Object.entries(summary.by_status).map(([status, count]) => ({
        name: status,
        value: count,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Evaluations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary?.total_evaluations || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Across all students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {summary?.average_score ? summary.average_score.toFixed(1) : 0}/100
            </div>
            <Progress
              value={(summary?.average_score || 0) / 100 * 100}
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Evaluation Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{typeData.length}</div>
            <p className="text-xs text-gray-500 mt-1">Categories tracked</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evaluations by Type */}
          {typeData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evaluations by Type</CardTitle>
                <CardDescription>Distribution across evaluation categories</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={typeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Evaluations by Status */}
          {statusData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Evaluations by Status</CardTitle>
                <CardDescription>Breakdown of evaluation outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Recent Evaluations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Evaluations</CardTitle>
          <CardDescription>Latest evaluation submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {evaluationsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          ) : evaluations.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600">No evaluations yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {evaluations.slice(0, 5).map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {evaluation.evaluation_type.replace(/_/g, ' ').toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(evaluation.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-lg">{evaluation.score}</p>
                      <p className="text-xs text-gray-500">/100</p>
                    </div>
                    <Badge
                      variant={
                        evaluation.status === 'Approved'
                          ? 'default'
                          : evaluation.status === 'Needs Revision'
                          ? 'secondary'
                          : 'destructive'
                      }
                    >
                      {evaluation.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
