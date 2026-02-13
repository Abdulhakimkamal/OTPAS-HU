/**
 * Evaluation Viewer Component
 * Displays evaluations for students
 */

import { useQuery } from '@tanstack/react-query';
import { studentApi, Evaluation } from '@/services/academicApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';

const evaluationTypeLabels: Record<string, string> = {
  proposal: 'Proposal',
  project_progress: 'Project Progress',
  final_project: 'Final Project',
  tutorial_assignment: 'Tutorial Assignment',
};

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bgColor: string }> = {
  'Approved': {
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  'Needs Revision': {
    icon: <AlertTriangle className="h-5 w-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  'Rejected': {
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
};

export function EvaluationViewer() {
  const { data: evaluations = [], isLoading, error } = useQuery({
    queryKey: ['evaluations'],
    queryFn: () => studentApi.getEvaluations(),
  });

  if (error) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="h-5 w-5" />
            <p>Failed to load evaluations</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No evaluations yet</p>
            <p className="text-sm text-gray-500 mt-1">Your evaluations will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate average score
  const averageScore = evaluations.length > 0
    ? (evaluations.reduce((sum, e) => sum + e.score, 0) / evaluations.length).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Evaluations</p>
              <p className="text-2xl font-bold">{evaluations.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-blue-600">{averageScore}/100</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations List */}
      <div className="space-y-3">
        {evaluations.map((evaluation) => {
          const config = statusConfig[evaluation.status];
          const scorePercentage = (evaluation.score / 100) * 100;

          return (
            <Card key={evaluation.id} className={`${config.bgColor} border-0`}>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold">
                        {evaluationTypeLabels[evaluation.evaluation_type]}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {new Date(evaluation.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`${config.color} bg-white border`}>
                      <span className="mr-1">{config.icon}</span>
                      {evaluation.status}
                    </Badge>
                  </div>

                  {/* Score */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Score</span>
                      <span className="text-lg font-bold">{evaluation.score}/100</span>
                    </div>
                    <Progress value={scorePercentage} className="h-2" />
                  </div>

                  {/* Feedback */}
                  <div>
                    <p className="text-sm font-medium mb-1">Feedback</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {evaluation.feedback}
                    </p>
                  </div>

                  {/* Recommendation */}
                  <div>
                    <p className="text-sm font-medium mb-1">Recommendation</p>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {evaluation.recommendation}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
