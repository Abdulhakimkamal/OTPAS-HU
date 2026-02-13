import { useEffect, useState } from 'react';
import { DepartmentHeadLayout } from '@/components/departmentHead/DepartmentHeadLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getInstructors } from '@/services/departmentHeadApi';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { GraduationCap, Mail, BookOpen, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Instructor {
  id: number;
  username: string;
  email: string;
  full_name: string;
  phone: string;
  is_active: boolean;
  courses_count: number;
  tutorials_count: number;
}

export default function ManageInstructors() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const response = await getInstructors();
      if (response.success && response.instructors) {
        setInstructors(Array.isArray(response.instructors) ? response.instructors : []);
      } else {
        setInstructors([]);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to load instructors');
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Instructors</h1>
        <p className="text-slate-600 mt-2">View and manage department instructors</p>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
      <div className="space-y-6">
        {loading && <LoadingSkeleton type="card" rows={4} />}
        {!loading && (
        <>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {instructors.map((instructor) => (
          <Card key={instructor.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <GraduationCap className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <CardTitle className="text-lg">{instructor.full_name}</CardTitle>
                    <p className="text-sm text-muted-foreground">@{instructor.username}</p>
                  </div>
                </div>
                <Badge variant={instructor.is_active ? 'default' : 'secondary'}>
                  {instructor.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{instructor.email}</span>
              </div>
              {instructor.phone && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Phone: </span>
                  <span>{instructor.phone}</span>
                </div>
              )}
              <div className="flex gap-4 pt-2 border-t">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">{instructor.courses_count} Courses</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{instructor.tutorials_count} Tutorials</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {instructors.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No instructors found in your department</p>
          </CardContent>
        </Card>
      )}
      </>
        )}
      </div>
      </div>
    </>
  );
}
