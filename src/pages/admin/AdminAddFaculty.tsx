import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users, Mail, Phone, MapPin, CheckCircle, AlertCircle } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSimpleFormValidation } from '@/hooks/useFormValidation';
import { FormError } from '@/components/common/FormError';
import { validateEmail, validateRequired, validateLength, createErrorMessage } from '@/utils/validationErrors';
import api from '@/services/api';

interface Department {
  id: number;
  name: string;
  code: string;
}

export default function AdminAddFaculty() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    specialization: '',
    bio: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { errors, handleApiError, clearErrors, clearFieldError, getError, setFieldError } = useSimpleFormValidation();

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const response = await api.get<{ success: boolean; departments: Department[] }>('/api/admin/departments');
      if (response.success && response.departments) {
        setDepartments(response.departments);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    clearFieldError(name);
    setMessage(null);
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    clearFieldError(name);
    setMessage(null);
  };

  const validateForm = (): boolean => {
    clearErrors();
    let isValid = true;

    // Validate full name (required, 2-100 chars)
    const nameError = validateRequired(formData.fullName, 'Full name') || 
                      validateLength(formData.fullName, 2, 100, 'Full name');
    if (nameError) {
      setFieldError('fullName', nameError);
      isValid = false;
    }

    // Validate email (required, valid format)
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setFieldError('email', emailError);
      isValid = false;
    }

    // Validate phone (optional, valid format if provided)
    if (formData.phone && !/^[\d\s\-\+\(\)]+$/.test(formData.phone)) {
      setFieldError('phone', 'Phone number must contain only digits and valid phone characters');
      isValid = false;
    }

    // Validate department (required)
    const departmentError = validateRequired(formData.department, 'Department');
    if (departmentError) {
      setFieldError('department', departmentError);
      isValid = false;
    }

    // Validate position (required)
    const positionError = validateRequired(formData.position, 'Position');
    if (positionError) {
      setFieldError('position', positionError);
      isValid = false;
    }

    // Validate specialization (optional, max 200 chars)
    if (formData.specialization && formData.specialization.length > 200) {
      setFieldError('specialization', 'Specialization must not exceed 200 characters');
      isValid = false;
    }

    // Validate bio (optional, max 1000 chars)
    if (formData.bio && formData.bio.length > 1000) {
      setFieldError('bio', 'Bio must not exceed 1000 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    
    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Replace with actual API call when backend endpoint is ready
      // const response = await adminApi.createFaculty(formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMessage({ type: 'success', text: 'Faculty member added successfully!' });
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        specialization: '',
        bio: '',
      });
      clearErrors();

      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      handleApiError(error);
      if (!getError('fullName') && !getError('email') && !getError('department') && !getError('position')) {
        setMessage({ type: 'error', text: createErrorMessage(error) });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      specialization: '',
      bio: '',
    });
    clearErrors();
    setMessage(null);
  };

  return (
    <AdminLayout
      title="Add Faculty"
      description="Add new faculty members to the system"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Faculty Information
              </CardTitle>
              <CardDescription>Fill in the details to add a new faculty member</CardDescription>
            </CardHeader>
            <CardContent>
              {message && (
                <Alert variant={message.type === 'success' ? 'default' : 'destructive'} className="mb-6">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <Label htmlFor="fullName">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Dr. John Doe"
                    className={`mt-2 ${getError('fullName') ? 'border-red-500' : ''}`}
                  />
                  <FormError error={getError('fullName')} />
                  <p className="text-xs text-muted-foreground mt-1">2-100 characters</p>
                </div>

                {/* Email and Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email" className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="john@haramaya.edu"
                      className={`mt-2 ${getError('email') ? 'border-red-500' : ''}`}
                    />
                    <FormError error={getError('email')} />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+251-911-234-567"
                      className={`mt-2 ${getError('phone') ? 'border-red-500' : ''}`}
                    />
                    <FormError error={getError('phone')} />
                    <p className="text-xs text-muted-foreground mt-1">Optional</p>
                  </div>
                </div>

                {/* Department and Position */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department" className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => handleSelectChange('department', value)}
                      disabled={loadingDepartments}
                    >
                      <SelectTrigger className={`mt-2 ${getError('department') ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder={loadingDepartments ? "Loading departments..." : "Select department"} />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.length === 0 && !loadingDepartments ? (
                          <div className="p-2 text-sm text-muted-foreground text-center">
                            No departments available
                          </div>
                        ) : (
                          departments.map(dept => (
                            <SelectItem key={dept.id} value={dept.name}>
                              {dept.name} ({dept.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormError error={getError('department')} />
                    {departments.length === 0 && !loadingDepartments && (
                      <p className="text-xs text-muted-foreground mt-1">
                        No departments found. Please create a department first.
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="position">
                      Position <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.position} onValueChange={(value) => handleSelectChange('position', value)}>
                      <SelectTrigger className={`mt-2 ${getError('position') ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Professor">Professor</SelectItem>
                        <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                        <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                        <SelectItem value="Lecturer">Lecturer</SelectItem>
                        <SelectItem value="Instructor">Instructor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormError error={getError('position')} />
                  </div>
                </div>

                {/* Specialization */}
                <div>
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    placeholder="e.g., Machine Learning, Web Development"
                    className={`mt-2 ${getError('specialization') ? 'border-red-500' : ''}`}
                  />
                  <FormError error={getError('specialization')} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional, max 200 characters ({formData.specialization.length}/200)
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Brief biography and professional background"
                    rows={4}
                    className={`mt-2 ${getError('bio') ? 'border-red-500' : ''}`}
                  />
                  <FormError error={getError('bio')} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional, max 1000 characters ({formData.bio.length}/1000)
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" type="button" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading} className="flex-1 sm:flex-none">
                    {isLoading ? 'Adding...' : 'Add Faculty Member'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Card */}
        <div className="lg:col-span-1">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-blue-900">Required Fields:</p>
                <ul className="list-disc list-inside text-blue-800 mt-2 space-y-1">
                  <li>Full Name</li>
                  <li>Email Address</li>
                  <li>Department</li>
                  <li>Position</li>
                </ul>
              </div>
              <div className="pt-4 border-t border-blue-200">
                <p className="font-medium text-blue-900">Email Format:</p>
                <p className="text-blue-800 mt-1">Use institutional email (e.g., name@haramaya.edu)</p>
              </div>
              <div className="pt-4 border-t border-blue-200">
                <p className="font-medium text-blue-900">Note:</p>
                <p className="text-blue-800 mt-1">A temporary password will be sent to the faculty member's email.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
