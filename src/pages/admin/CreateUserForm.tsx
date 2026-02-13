import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { adminApi } from '@/services/adminApi';
import { useSimpleFormValidation } from '@/hooks/useFormValidation';
import { FormError, ValidationErrors } from '@/components/common/FormError';
import { createErrorMessage } from '@/utils/validationErrors';
import api from '@/services/api';

interface Department {
  id: number;
  name: string;
  code: string;
}

interface CreatedUser {
  id: string;
  username: string;
  fullName: string;
  role: string;
  department: string;
  status: string;
  createdAt: string;
}

export default function CreateUserForm() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    role: '',
    department: '',
    sendWelcomeEmail: true,
    forcePasswordChange: true,
    isActive: true,
  });

  const { errors, hasErrors, handleApiError, clearErrors, clearFieldError, getError } = useSimpleFormValidation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [recentlyCreated, setRecentlyCreated] = useState<CreatedUser[]>([]);
  const [submitted, setSubmitted] = useState(false);

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    setLoadingDepartments(true);
    setGeneralError('');
    try {
      const response = await api.get<{ success: boolean; departments: Department[] }>('/admin/departments');
      console.log('Departments response:', response);
      if (response.success && response.departments) {
        setDepartments(response.departments);
      } else {
        console.error('Invalid departments response:', response);
        setGeneralError('Failed to load departments. Please refresh the page.');
      }
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      setGeneralError(error.message || 'Failed to load departments. Please check your connection.');
    } finally {
      setLoadingDepartments(false);
    }
  };

  const validatePassword = (pwd: string) => {
    return /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/.test(pwd);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
    setGeneralError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    clearErrors();
    setGeneralError('');
    setSuccess('');

    // Client-side validation for password match
    if (formData.password !== formData.confirmPassword) {
      setGeneralError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await adminApi.createUser({
        username: formData.username,
        password: formData.password,
        email: formData.email,
        fullName: formData.fullName,
        role: formData.role,
        department: formData.department,
        sendWelcomeEmail: formData.sendWelcomeEmail,
        forcePasswordChange: formData.forcePasswordChange,
        isActive: formData.isActive,
      });

      if (response.success) {
        const newUser: CreatedUser = {
          id: response.user.id || Math.random().toString(),
          username: formData.username,
          fullName: formData.fullName,
          role: formData.role,
          department: departments.find(d => d.code === formData.department || d.name === formData.department)?.name || formData.department,
          status: formData.isActive ? 'active' : 'inactive',
          createdAt: new Date().toISOString().split('T')[0],
        };
        
        setRecentlyCreated([newUser, ...recentlyCreated]);
        setSuccess(`Account created for ${formData.fullName}`);
        clearErrors();
        setSubmitted(false);
        setFormData({
          username: '',
          password: '',
          confirmPassword: '',
          fullName: '',
          email: '',
          role: '',
          department: '',
          sendWelcomeEmail: true,
          forcePasswordChange: true,
          isActive: true,
        });
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (error: any) {
      // Handle validation errors from backend
      handleApiError(error);
      
      // If no validation errors, show general error
      if (!hasErrors) {
        setGeneralError(createErrorMessage(error));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setRecentlyCreated(recentlyCreated.filter(u => u.id !== userId));
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Create New User Account</h1>
        <p className="text-muted-foreground">Add department heads and instructors to the system</p>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {generalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{generalError}</span>
            {generalError.includes('departments') && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchDepartments}
                className="ml-4"
              >
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}

      {submitted && hasErrors && <ValidationErrors errors={errors} className="mb-4" />}

      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Username *</Label>
              <Input
                placeholder="4-20 characters"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                className={getError('username') ? 'border-red-500' : ''}
              />
              <FormError error={getError('username')} />
            </div>

            <div>
              <Label>Full Name *</Label>
              <Input
                placeholder="Dr. Sarah Mohammed"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className={getError('full_name') || getError('fullName') ? 'border-red-500' : ''}
              />
              <FormError error={getError('full_name') || getError('fullName')} />
            </div>

            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="user@haramaya.edu.et"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={getError('email') ? 'border-red-500' : ''}
              />
              <FormError error={getError('email')} />
            </div>

            <div>
              <Label>Role *</Label>
              <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                <SelectTrigger className={getError('role') || getError('role_id') ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="department_head">Department Head</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                </SelectContent>
              </Select>
              <FormError error={getError('role') || getError('role_id')} />
            </div>

            <div>
              <Label>Department *</Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => handleChange('department', value)}
                disabled={loadingDepartments}
              >
                <SelectTrigger className={getError('department') || getError('department_id') ? 'border-red-500' : ''}>
                  <SelectValue placeholder={loadingDepartments ? "Loading departments..." : "Select department"} />
                </SelectTrigger>
                <SelectContent>
                  {departments.length === 0 && !loadingDepartments ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      No departments available
                    </div>
                  ) : (
                    departments.map(dept => (
                      <SelectItem key={dept.id} value={dept.code}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormError error={getError('department') || getError('department_id')} />
              {departments.length === 0 && !loadingDepartments && (
                <p className="text-xs text-muted-foreground mt-1">
                  No departments found. Please create a department first.
                </p>
              )}
            </div>

            <div>
              <Label>Password *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 8 chars: uppercase, lowercase, number, special"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className={getError('password') ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FormError error={getError('password')} />
            </div>

            <div>
              <Label>Confirm Password *</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  className={getError('confirmPassword') ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-500"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FormError error={getError('confirmPassword')} />
            </div>

            <div className="space-y-2 p-3 bg-gray-50 rounded">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="sendEmail"
                  checked={formData.sendWelcomeEmail}
                  onCheckedChange={(checked) => handleChange('sendWelcomeEmail', checked)}
                />
                <Label htmlFor="sendEmail" className="font-normal cursor-pointer">Send welcome email</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="forceChange"
                  checked={formData.forcePasswordChange}
                  onCheckedChange={(checked) => handleChange('forcePasswordChange', checked)}
                />
                <Label htmlFor="forceChange" className="font-normal cursor-pointer">Require password change on first login</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleChange('isActive', checked)}
                />
                <Label htmlFor="isActive" className="font-normal cursor-pointer">Account active immediately</Label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Creating...' : 'Create Account'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({
                    username: '',
                    password: '',
                    confirmPassword: '',
                    fullName: '',
                    email: '',
                    role: '',
                    department: '',
                    sendWelcomeEmail: true,
                    forcePasswordChange: true,
                    isActive: true,
                  });
                  clearErrors();
                  setGeneralError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {recentlyCreated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Created Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Username</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentlyCreated.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-sm">{user.username}</TableCell>
                    <TableCell>{user.fullName}</TableCell>
                    <TableCell className="capitalize">{user.role.replace('_', ' ')}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell>{user.createdAt}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
