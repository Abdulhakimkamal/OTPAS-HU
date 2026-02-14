import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Building2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSimpleFormValidation } from '@/hooks/useFormValidation';
import { FormError } from '@/components/common/FormError';
import { validateRequired, validateLength, createErrorMessage } from '@/utils/validationErrors';
import { toast } from 'sonner';
import api from '@/services/api';

interface Department {
  id: number;
  name: string;
  code: string;
  head_name?: string;
  head_id?: number;
  description?: string;
  email?: string;
  phone?: string;
  created_at?: string;
  updated_at?: string;
}

interface DepartmentDisplay extends Department {
  head: string;
  students: number;
  instructors: number;
  courses: number;
}

export default function AdminDepartments() {
  const [departments, setDepartments] = useState<DepartmentDisplay[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [generalError, setGeneralError] = useState('');
  const { errors, handleApiError, clearErrors, clearFieldError, getError, setFieldError } = useSimpleFormValidation();
  
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    email: '',
    phone: '',
  });

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setFetchLoading(true);
    try {
      // Fetch departments from the admin API
      const response = await api.get<{ success: boolean; departments: Department[] }>('/api/admin/departments');
      
      if (response.success && response.departments) {
        // Transform backend data to display format
        const displayDepts: DepartmentDisplay[] = response.departments.map(dept => ({
          ...dept,
          head: dept.head_name || 'Not assigned',
          students: 0, // TODO: Get actual counts from backend
          instructors: 0,
          courses: 0,
        }));
        setDepartments(displayDepts);
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
    setGeneralError('');
  };

  const validateForm = (): boolean => {
    clearErrors();
    let isValid = true;

    // Validate name (required, 2-100 chars)
    const nameError = validateRequired(formData.name, 'Department name') || 
                      validateLength(formData.name, 2, 100, 'Department name');
    if (nameError) {
      setFieldError('name', nameError);
      isValid = false;
    }

    // Validate code (required, 2-10 chars, uppercase)
    const codeError = validateRequired(formData.code, 'Department code');
    if (codeError) {
      setFieldError('code', codeError);
      isValid = false;
    } else if (formData.code.length < 2 || formData.code.length > 10) {
      setFieldError('code', 'Department code must be 2-10 characters');
      isValid = false;
    } else if (!/^[A-Z]+$/.test(formData.code)) {
      setFieldError('code', 'Department code must be uppercase letters only');
      isValid = false;
    }

    // Validate description (optional, max 500 chars)
    if (formData.description && formData.description.length > 500) {
      setFieldError('description', 'Description must not exceed 500 characters');
      isValid = false;
    }

    // Validate email (optional, valid format)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setFieldError('email', 'Must be a valid email address');
      isValid = false;
    }

    // Validate phone (optional, valid format)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      setFieldError('phone', 'Phone number must contain only digits and valid phone characters');
      isValid = false;
    }

    return isValid;
  };

  const handleAddDepartment = async () => {
    setGeneralError('');
    
    // Client-side validation
    if (!validateForm()) {
      setGeneralError('Please fix the validation errors above');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<{ success: boolean; message: string; department: Department }>(
        '/api/admin/departments',
        {
          name: formData.name.trim(),
          code: formData.code.trim(),
          description: formData.description.trim() || undefined,
          contact_email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
        }
      );

      if (response.success) {
        toast.success('Department created successfully');
        setFormData({ name: '', code: '', description: '', email: '', phone: '' });
        clearErrors();
        setIsOpen(false);
        // Refresh the departments list
        fetchDepartments();
      }
    } catch (error: any) {
      console.error('Error creating department:', error);
      console.log('Error data:', error.data);
      
      // Handle validation errors from backend
      if (error.data && error.data.errors && Array.isArray(error.data.errors)) {
        const backendErrors = error.data.errors;
        
        // Map backend field names to frontend field names
        const fieldMap: Record<string, string> = {
          'name': 'name',
          'code': 'code',
          'description': 'description',
          'contact_email': 'email',
          'phone': 'phone'
        };
        
        backendErrors.forEach((err: any) => {
          const frontendField = fieldMap[err.field] || err.field;
          setFieldError(frontendField, err.message);
        });
        
        setGeneralError('Validation failed. Please check the fields below.');
      } else {
        // Generic error
        setGeneralError(error.data?.message || error.message || 'Failed to create department');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (dept: DepartmentDisplay) => {
    if (!confirm(`Are you sure you want to delete ${dept.name}?`)) {
      return;
    }

    try {
      const response = await api.delete<{ success: boolean; message: string }>(`/api/admin/departments/${dept.id}`);
      
      if (response.success) {
        toast.success('Department deleted successfully');
        // Refresh the departments list
        fetchDepartments();
      }
    } catch (error: any) {
      console.error('Error deleting department:', error);
      toast.error(error.message || 'Failed to delete department');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Department',
      render: (value: string, row: DepartmentDisplay) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <Building2 className="h-4 w-4 text-orange-600" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-xs text-muted-foreground">Code: {row.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'head',
      label: 'Department Head',
    },
    {
      key: 'students',
      label: 'Students',
      render: (value: number) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'instructors',
      label: 'Instructors',
      render: (value: number) => <span className="font-medium">{value}</span>,
    },
    {
      key: 'courses',
      label: 'Courses',
      render: (value: number) => <span className="font-medium">{value}</span>,
    },
  ];

  if (fetchLoading) {
    return (
      <AdminLayout
        title="Department Management"
        description="Manage academic departments and their resources"
      >
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">Loading departments...</div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Department Management"
      description="Manage academic departments and their resources"
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Departments</CardTitle>
            <CardDescription>Total: {departments.length} departments</CardDescription>
          </div>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Department
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Department</DialogTitle>
                <DialogDescription>Add a new academic department</DialogDescription>
              </DialogHeader>
              
              {generalError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{generalError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="dept-name">
                    Department Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dept-name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Computer Science"
                    className={getError('name') ? 'border-red-500' : ''}
                  />
                  <FormError error={getError('name')} />
                  <p className="text-xs text-muted-foreground mt-1">2-100 characters</p>
                </div>

                <div>
                  <Label htmlFor="dept-code">
                    Department Code <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dept-code"
                    value={formData.code}
                    onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                    placeholder="CS"
                    maxLength={10}
                    className={getError('code') ? 'border-red-500' : ''}
                  />
                  <FormError error={getError('code')} />
                  <p className="text-xs text-muted-foreground mt-1">2-10 uppercase letters</p>
                </div>

                <div>
                  <Label htmlFor="dept-description">Description</Label>
                  <Textarea
                    id="dept-description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description of the department"
                    rows={3}
                    className={getError('description') ? 'border-red-500' : ''}
                  />
                  <FormError error={getError('description')} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional, max 500 characters ({formData.description.length}/500)
                  </p>
                </div>

                <div>
                  <Label htmlFor="dept-email">Email</Label>
                  <Input
                    id="dept-email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="cs@haramaya.edu.et"
                    className={getError('email') ? 'border-red-500' : ''}
                  />
                  <FormError error={getError('email')} />
                  <p className="text-xs text-muted-foreground mt-1">Optional</p>
                </div>

                <div>
                  <Label htmlFor="dept-phone">Phone</Label>
                  <Input
                    id="dept-phone"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+251-25-553-0325"
                    className={getError('phone') ? 'border-red-500' : ''}
                  />
                  <FormError error={getError('phone')} />
                  <p className="text-xs text-muted-foreground mt-1">Optional</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button 
                    onClick={handleAddDepartment} 
                    className="flex-1"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Department'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({ name: '', code: '', description: '', email: '', phone: '' });
                      clearErrors();
                      setGeneralError('');
                      setIsOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={departments}
            onDelete={handleDeleteDepartment}
            searchPlaceholder="Search departments..."
          />
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
