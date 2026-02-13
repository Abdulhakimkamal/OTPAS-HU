import { useEffect, useState } from 'react';
import { DepartmentHeadLayout } from '@/components/departmentHead/DepartmentHeadLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getCourses, createCourse, updateCourse, getInstructors } from '@/services/departmentHeadApi';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { Plus, Edit, BookOpen } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  code: string;
  description: string;
  instructor_id: number;
  instructor_name: string;
  credits: number;
  semester: string;
  academic_year: number;
  max_students: number;
  enrolled_count: number;
  is_active: boolean;
}

interface Instructor {
  id: number;
  full_name: string;
  email: string;
}

export default function ManageCourses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    instructor_id: '',
    credits: '',
    semester: '',
    academic_year: new Date().getFullYear(),
    max_students: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesRes, instructorsRes] = await Promise.all([
        getCourses(),
        getInstructors()
      ]);
      console.log('Courses response:', coursesRes);
      console.log('Instructors response:', instructorsRes);
      
      if (coursesRes.success && coursesRes.courses) {
        setCourses(Array.isArray(coursesRes.courses) ? coursesRes.courses : []);
      } else {
        setCourses([]);
      }
      
      if (instructorsRes.success && instructorsRes.instructors) {
        console.log('Setting instructors:', instructorsRes.instructors);
        setInstructors(Array.isArray(instructorsRes.instructors) ? instructorsRes.instructors : []);
      } else {
        console.log('No instructors data, setting empty array');
        setInstructors([]);
      }
    } catch (error: any) {
      console.error('Fetch data error:', error);
      toast.error(error.response?.data?.message || 'Failed to load data');
      setCourses([]);
      setInstructors([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        instructor_id: parseInt(formData.instructor_id),
        credits: parseInt(formData.credits),
        max_students: formData.max_students ? parseInt(formData.max_students) : undefined
      };

      if (editingCourse) {
        const response = await updateCourse(editingCourse.id, data);
        if (response.success) {
          toast.success('Course updated successfully');
          fetchData();
          setDialogOpen(false);
          resetForm();
        }
      } else {
        const response = await createCourse(data as any);
        if (response.success) {
          toast.success('Course created successfully');
          fetchData();
          setDialogOpen(false);
          resetForm();
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      code: '',
      description: '',
      instructor_id: '',
      credits: '',
      semester: '',
      academic_year: new Date().getFullYear(),
      max_students: ''
    });
    setEditingCourse(null);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      code: course.code,
      description: course.description || '',
      instructor_id: course.instructor_id.toString(),
      credits: course.credits.toString(),
      semester: course.semester,
      academic_year: course.academic_year,
      max_students: course.max_students?.toString() || ''
    });
    setDialogOpen(true);
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Courses</h1>
        <p className="text-slate-600 mt-2">Create and manage department courses</p>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
      <div className="space-y-6">
        {loading && <LoadingSkeleton type="table" rows={5} />}
        {!loading && (
        <>
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? 'Edit Course' : 'Create New Course'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Course Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    disabled={!!editingCourse}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="instructor">Instructor *</Label>
                  <Select
                    value={formData.instructor_id}
                    onValueChange={(value) => setFormData({ ...formData, instructor_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select instructor" />
                    </SelectTrigger>
                    <SelectContent>
                      {instructors.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          No instructors available
                        </div>
                      ) : (
                        instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id.toString()}>
                            {instructor.full_name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="credits">Credits *</Label>
                  <Input
                    id="credits"
                    type="number"
                    value={formData.credits}
                    onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="semester">Semester *</Label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) => setFormData({ ...formData, semester: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Semester 1">Semester 1</SelectItem>
                      <SelectItem value="Semester 2">Semester 2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="academic_year">Academic Year *</Label>
                  <Input
                    id="academic_year"
                    type="number"
                    value={formData.academic_year}
                    onChange={(e) => setFormData({ ...formData, academic_year: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="max_students">Max Students</Label>
                  <Input
                    id="max_students"
                    type="number"
                    value={formData.max_students}
                    onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingCourse ? 'Update' : 'Create'} Course
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <CardTitle>{course.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {course.code} • {course.credits} Credits • {course.semester} {course.academic_year}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(course)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Instructor:</span>
                  <p className="font-medium">{course.instructor_name || 'Not assigned'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Enrollment:</span>
                  <p className="font-medium">
                    {course.enrolled_count || 0} / {course.max_students || 'Unlimited'}
                  </p>
                </div>
                {course.description && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Description:</span>
                    <p className="mt-1">{course.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </>
        )}
      </div>
      </div>
    </>
  );
}
