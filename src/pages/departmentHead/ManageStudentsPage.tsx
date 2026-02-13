import { useEffect, useState } from 'react';
import { DepartmentHeadLayout } from '@/components/departmentHead/DepartmentHeadLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getStudents, createStudent, updateStudent, updateStudentStatus, resetStudentPassword } from '@/services/departmentHeadApi';
import { toast } from 'sonner';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { FormError } from '@/components/common/FormError';
import { useSimpleFormValidation } from '@/hooks/useFormValidation';
import { Plus, Edit, Key, UserCheck, UserX, Search, BookOpen, Users } from 'lucide-react';

interface Student {
  id: number;
  full_name: string;
  email: string;
  username: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  department_name?: string;
  enrolled_courses?: string[];
}

interface Course {
  id: number;
  code: string;
  title: string;
  instructor_name?: string;
}

export default function ManageStudentsPage() {
  console.log('ManageStudentsPage: Component rendering');
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);

  // Form states
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [addFormData, setAddFormData] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    phone: ''
  });
  const [editFormData, setEditFormData] = useState({
    full_name: '',
    email: '',
    phone: ''
  });
  const [resetPasswordData, setResetPasswordData] = useState({
    new_password: '',
    confirm_password: ''
  });

  const addFormValidation = useSimpleFormValidation();
  const editFormValidation = useSimpleFormValidation();
  const resetPasswordValidation = useSimpleFormValidation();

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    // Filter students based on search term
    const filtered = students.filter(student =>
      student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
    setCurrentPage(1); // Reset to first page on search
  }, [searchTerm, students]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      console.log('ManageStudents: Fetching students...');
      const response: any = await getStudents();
      console.log('ManageStudents: Response:', response);
      if (response && response.success) {
        console.log('ManageStudents: Students loaded:', response.students?.length);
        setStudents(response.students || []);
        setFilteredStudents(response.students || []);
      } else {
        console.error('ManageStudents: Failed to load students', response);
        toast.error('Failed to load students');
      }
    } catch (error: any) {
      console.error('ManageStudents: Error:', error);
      toast.error(error.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
      console.log('ManageStudents: Loading complete');
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    addFormValidation.clearErrors();

    // Client-side validation
    if (addFormData.password.length < 6) {
      addFormValidation.setFieldError('password', 'Password must be at least 6 characters');
      return;
    }

    try {
      const response = await createStudent(addFormData);
      if (response.success) {
        toast.success('Student created successfully');
        fetchStudents();
        setAddDialogOpen(false);
        resetAddForm();
      }
    } catch (error: any) {
      addFormValidation.handleApiError(error);
      toast.error(error.response?.data?.message || 'Failed to create student');
    }
  };

  const handleEditStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    editFormValidation.clearErrors();

    try {
      const response = await updateStudent(editingStudent.id, editFormData);
      if (response.success) {
        toast.success('Student updated successfully');
        fetchStudents();
        setEditDialogOpen(false);
        resetEditForm();
      }
    } catch (error: any) {
      editFormValidation.handleApiError(error);
      toast.error(error.response?.data?.message || 'Failed to update student');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    resetPasswordValidation.clearErrors();

    // Client-side validation
    if (resetPasswordData.new_password.length < 6) {
      resetPasswordValidation.setFieldError('new_password', 'Password must be at least 6 characters');
      return;
    }
    if (resetPasswordData.new_password !== resetPasswordData.confirm_password) {
      resetPasswordValidation.setFieldError('confirm_password', 'Passwords do not match');
      return;
    }

    try {
      const response = await resetStudentPassword(selectedStudent.id, resetPasswordData.new_password);
      if (response.success) {
        toast.success('Password reset successfully. Student must change password on next login.');
        setResetPasswordDialogOpen(false);
        resetPasswordForm();
      }
    } catch (error: any) {
      resetPasswordValidation.handleApiError(error);
      toast.error(error.response?.data?.message || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async () => {
    if (!selectedStudent) return;

    try {
      const newStatus = !selectedStudent.is_active;
      const response = await updateStudentStatus(selectedStudent.id, newStatus);
      if (response.success) {
        toast.success(`Student ${newStatus ? 'activated' : 'deactivated'} successfully`);
        fetchStudents();
        setStatusDialogOpen(false);
        setSelectedStudent(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const openEditDialog = (student: Student) => {
    setEditingStudent(student);
    setEditFormData({
      full_name: student.full_name,
      email: student.email,
      phone: student.phone || ''
    });
    editFormValidation.clearErrors();
    setEditDialogOpen(true);
  };

  const openResetPasswordDialog = (student: Student) => {
    setSelectedStudent(student);
    resetPasswordValidation.clearErrors();
    setResetPasswordDialogOpen(true);
  };

  const openStatusDialog = (student: Student) => {
    setSelectedStudent(student);
    setStatusDialogOpen(true);
  };

  const resetAddForm = () => {
    setAddFormData({
      full_name: '',
      email: '',
      username: '',
      password: '',
      phone: ''
    });
    addFormValidation.clearErrors();
  };

  const resetEditForm = () => {
    setEditingStudent(null);
    setEditFormData({
      full_name: '',
      email: '',
      phone: ''
    });
    editFormValidation.clearErrors();
  };

  const openEnrollmentDialog = (student: Student) => {
    setSelectedStudent(student);
    setEnrollmentDialogOpen(true);
  };

  const resetPasswordForm = () => {
    setSelectedStudent(null);
    setResetPasswordData({
      new_password: '',
      confirm_password: ''
    });
    resetPasswordValidation.clearErrors();
  };

  // Pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Students</h1>
        <p className="text-slate-600 mt-2">Create and manage students in your department</p>
      </div>

      {/* Content */}
      <div className="p-6 lg:p-8">
      <div className="space-y-6">
        {loading && <LoadingSkeleton type="table" rows={10} />}
        {!loading && (
        <>
        {/* Add Student Button */}
        <div className="flex justify-end">
          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetAddForm}>
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Student</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <Label htmlFor="add_full_name">Full Name *</Label>
                <Input
                  id="add_full_name"
                  value={addFormData.full_name}
                  onChange={(e) => {
                    setAddFormData({ ...addFormData, full_name: e.target.value });
                    addFormValidation.clearFieldError('full_name');
                  }}
                  required
                />
                <FormError error={addFormValidation.getError('full_name')} />
              </div>

              <div>
                <Label htmlFor="add_email">Email *</Label>
                <Input
                  id="add_email"
                  type="email"
                  value={addFormData.email}
                  onChange={(e) => {
                    setAddFormData({ ...addFormData, email: e.target.value });
                    addFormValidation.clearFieldError('email');
                  }}
                  required
                />
                <FormError error={addFormValidation.getError('email')} />
              </div>

              <div>
                <Label htmlFor="add_username">Username *</Label>
                <Input
                  id="add_username"
                  value={addFormData.username}
                  onChange={(e) => {
                    setAddFormData({ ...addFormData, username: e.target.value });
                    addFormValidation.clearFieldError('username');
                  }}
                  required
                />
                <FormError error={addFormValidation.getError('username')} />
              </div>

              <div>
                <Label htmlFor="add_password">Password *</Label>
                <Input
                  id="add_password"
                  type="password"
                  value={addFormData.password}
                  onChange={(e) => {
                    setAddFormData({ ...addFormData, password: e.target.value });
                    addFormValidation.clearFieldError('password');
                  }}
                  required
                />
                <FormError error={addFormValidation.getError('password')} />
                <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <Label htmlFor="add_phone">Phone</Label>
                <Input
                  id="add_phone"
                  value={addFormData.phone}
                  onChange={(e) => {
                    setAddFormData({ ...addFormData, phone: e.target.value });
                    addFormValidation.clearFieldError('phone');
                  }}
                />
                <FormError error={addFormValidation.getError('phone')} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Student</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Stats */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Total Students:</span>
                <span className="ml-2 font-semibold">{students.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Active:</span>
                <span className="ml-2 font-semibold text-green-600">
                  {students.filter(s => s.is_active).length}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Inactive:</span>
                <span className="ml-2 font-semibold text-red-600">
                  {students.filter(s => !s.is_active).length}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardHeader>
          <CardTitle>Students List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Enrolled Courses</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {searchTerm ? 'No students found matching your search' : 'No students yet'}
                  </TableCell>
                </TableRow>
              ) : (
                currentStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.full_name}</TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>{student.username}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.enrolled_courses && student.enrolled_courses.length > 0 ? (
                          student.enrolled_courses.map((course, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {course}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground text-sm">No enrollments</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={student.is_active ? 'default' : 'secondary'}>
                        {student.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(student.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEnrollmentDialog(student)}
                          title="Manage course enrollments"
                        >
                          <BookOpen className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(student)}
                          title="Edit student"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openResetPasswordDialog(student)}
                          title="Reset password"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openStatusDialog(student)}
                          title={student.is_active ? 'Deactivate' : 'Activate'}
                        >
                          {student.is_active ? (
                            <UserX className="h-4 w-4 text-red-600" />
                          ) : (
                            <UserCheck className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {indexOfFirstStudent + 1} to {Math.min(indexOfLastStudent, filteredStudents.length)} of {filteredStudents.length} students
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className="w-8"
                    >
                      {page}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Student Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditStudent} className="space-y-4">
            <div>
              <Label htmlFor="edit_full_name">Full Name *</Label>
              <Input
                id="edit_full_name"
                value={editFormData.full_name}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, full_name: e.target.value });
                  editFormValidation.clearFieldError('full_name');
                }}
                required
              />
              <FormError error={editFormValidation.getError('full_name')} />
            </div>

            <div>
              <Label htmlFor="edit_email">Email *</Label>
              <Input
                id="edit_email"
                type="email"
                value={editFormData.email}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, email: e.target.value });
                  editFormValidation.clearFieldError('email');
                }}
                required
              />
              <FormError error={editFormValidation.getError('email')} />
            </div>

            <div>
              <Label htmlFor="edit_phone">Phone</Label>
              <Input
                id="edit_phone"
                value={editFormData.phone}
                onChange={(e) => {
                  setEditFormData({ ...editFormData, phone: e.target.value });
                  editFormValidation.clearFieldError('phone');
                }}
              />
              <FormError error={editFormValidation.getError('phone')} />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Student</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Reset password for <span className="font-semibold">{selectedStudent?.full_name}</span>
            </p>

            <div>
              <Label htmlFor="new_password">New Password *</Label>
              <Input
                id="new_password"
                type="password"
                value={resetPasswordData.new_password}
                onChange={(e) => {
                  setResetPasswordData({ ...resetPasswordData, new_password: e.target.value });
                  resetPasswordValidation.clearFieldError('new_password');
                }}
                required
              />
              <FormError error={resetPasswordValidation.getError('new_password')} />
              <p className="text-xs text-muted-foreground mt-1">Minimum 6 characters</p>
            </div>

            <div>
              <Label htmlFor="confirm_password">Confirm Password *</Label>
              <Input
                id="confirm_password"
                type="password"
                value={resetPasswordData.confirm_password}
                onChange={(e) => {
                  setResetPasswordData({ ...resetPasswordData, confirm_password: e.target.value });
                  resetPasswordValidation.clearFieldError('confirm_password');
                }}
                required
              />
              <FormError error={resetPasswordValidation.getError('confirm_password')} />
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-xs text-yellow-800">
                The student will be required to change their password on next login.
              </p>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Reset Password</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Toggle Confirmation Dialog */}
      <AlertDialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedStudent?.is_active ? 'Deactivate' : 'Activate'} Student
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedStudent?.is_active ? 'deactivate' : 'activate'}{' '}
              <span className="font-semibold">{selectedStudent?.full_name}</span>?
              {selectedStudent?.is_active && (
                <span className="block mt-2 text-yellow-600">
                  The student will not be able to log in while deactivated.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus}>
              {selectedStudent?.is_active ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Course Enrollment Dialog */}
      <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Manage Course Enrollments - {selectedStudent?.full_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 className="font-medium text-blue-900 mb-2">Current Enrollments</h4>
              <div className="flex flex-wrap gap-2">
                {selectedStudent?.enrolled_courses && selectedStudent.enrolled_courses.length > 0 ? (
                  selectedStudent.enrolled_courses.map((course, index) => (
                    <Badge key={index} variant="default" className="text-sm">
                      {course}
                    </Badge>
                  ))
                ) : (
                  <span className="text-blue-700 text-sm">No current enrollments</span>
                )}
              </div>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <h4 className="font-medium text-green-900 mb-2">✅ Enrollment Complete!</h4>
              <p className="text-green-700 text-sm">
                Your students have been enrolled in courses. You can now create evaluations for them in the Instructor panel.
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="font-medium text-yellow-900 mb-2">📚 Available Courses</h4>
              <div className="space-y-2 text-sm text-yellow-800">
                <div>• CS401 - Software Engineering</div>
                <div>• CS301 - Computer Security</div>
                <div>• CS302 - Database Systems</div>
                <div>• 1012 - IP</div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button onClick={() => setEnrollmentDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </>
        )}
      </div>
      </div>
    </>
  );
}
