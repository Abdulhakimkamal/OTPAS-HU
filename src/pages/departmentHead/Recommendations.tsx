import { useEffect, useState } from 'react';
import { DepartmentHeadLayout } from '@/components/departmentHead/DepartmentHeadLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getRiskStudents } from '@/services/departmentHeadApi';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { AlertTriangle, TrendingDown, Clock, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface RiskStudent {
  id: number;
  full_name: string;
  email: string;
  average_score: number;
  completed_projects: number;
  total_projects: number;
  courses_completed: number;
  courses_enrolled: number;
  last_activity: string;
  risk_reason: string;
}

export default function Recommendations() {
  const [riskStudents, setRiskStudents] = useState<RiskStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskStudents();
  }, []);

  const fetchRiskStudents = async () => {
    try {
      setLoading(true);
      const response = await getRiskStudents();
      if (response.success) {
        setRiskStudents(response.riskStudents);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load risk students');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadgeVariant = (reason: string) => {
    if (reason === 'Low Performance') return 'destructive';
    if (reason === 'Low Completion Rate') return 'default';
    if (reason === 'Inactive') return 'secondary';
    return 'outline';
  };

  const getRiskIcon = (reason: string) => {
    if (reason === 'Low Performance') return TrendingDown;
    if (reason === 'Low Completion Rate') return AlertTriangle;
    if (reason === 'Inactive') return Clock;
    return User;
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Student Recommendations</h1>
        <p className="text-slate-600 mt-2">Identify at-risk students who need additional support</p>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
      <div className="space-y-6">
        {loading && <LoadingSkeleton type="card" rows={4} />}
        {!loading && (
        <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            At-Risk Students ({riskStudents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {riskStudents.length === 0 ? (
            <div className="text-center py-10">
              <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No at-risk students identified</p>
              <p className="text-sm text-muted-foreground mt-2">
                All students are performing well
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {riskStudents.map((student) => {
                const RiskIcon = getRiskIcon(student.risk_reason);
                return (
                  <Card key={student.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <RiskIcon className="h-5 w-5 text-orange-600 mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">{student.full_name}</h3>
                              <Badge variant={getRiskBadgeVariant(student.risk_reason)}>
                                {student.risk_reason}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{student.email}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Average Score:</span>
                                <p className="font-medium">
                                  {student.average_score 
                                    ? `${parseFloat(student.average_score.toString()).toFixed(1)}%`
                                    : 'N/A'}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Projects:</span>
                                <p className="font-medium">
                                  {student.completed_projects || 0} / {student.total_projects || 0}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Courses:</span>
                                <p className="font-medium">
                                  {student.courses_completed || 0} / {student.courses_enrolled || 0}
                                </p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Last Activity:</span>
                                <p className="font-medium">
                                  {student.last_activity 
                                    ? new Date(student.last_activity).toLocaleDateString()
                                    : 'Never'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recommendation Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 mt-2" />
              <div>
                <p className="font-medium">Low Performance Students</p>
                <p className="text-muted-foreground">
                  Consider scheduling one-on-one meetings, providing additional tutoring resources,
                  or assigning peer mentors
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-orange-500 mt-2" />
              <div>
                <p className="font-medium">Low Completion Rate Students</p>
                <p className="text-muted-foreground">
                  Review project requirements, extend deadlines if needed, or provide additional
                  guidance on project management
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="h-2 w-2 rounded-full bg-gray-500 mt-2" />
              <div>
                <p className="font-medium">Inactive Students</p>
                <p className="text-muted-foreground">
                  Reach out via email or phone to check on their well-being and identify any
                  barriers to participation
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </>
        )}
      </div>
      </div>
    </>
  );
}
