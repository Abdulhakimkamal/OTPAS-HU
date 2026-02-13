import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Shield, User, Mail, AlertCircle, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useSimpleFormValidation } from '@/hooks/useFormValidation';
import { FormError } from '@/components/common/FormError';
import { validateEmail, validateRequired, createErrorMessage } from '@/utils/validationErrors';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState('');
  const { errors, handleApiError, clearErrors, clearFieldError, getError, setFieldError } = useSimpleFormValidation();
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    department: '',
  });

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, [token]);

  // Get unique values for filters
  const uniqueRoles = useMemo(() => {
    const roles = [...new Set(users.map(u => u.role))];
    return roles.sort();
  }, [users]);

  const uniqueDepartments = useMemo(() => {
    const depts = [...new Set(users.map(u => u.department))];
    return depts.sort();
  }, [users]);

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(user => user.department === departmentFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortColumn as keyof User];
      const bValue = b[sortColumn as keyof User];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [users, searchQuery, roleFilter, departmentFilter, statusFilter, sortColumn, sortDirection]);

  // Handle column sort
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setDepartmentFilter('all');
    setStatusFilter('all');
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Use the adminApi service instead of direct fetch
      const { adminApi } = await import('@/services/adminApi');
      const mappedUsers = await adminApi.getUsers();
      
      setUsers(mappedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
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

    // Validate name (required)
    const nameError = validateRequired(formData.name, 'Full name');
    if (nameError) {
      setFieldError('name', nameError);
      isValid = false;
    }

    // Validate email (required, valid format)
    const emailError = validateEmail(formData.email);
    if (emailError) {
      setFieldError('email', emailError);
      isValid = false;
    }

    // Validate role (required)
    const roleError = validateRequired(formData.role, 'Role');
    if (roleError) {
      setFieldError('role', roleError);
      isValid = false;
    }

    // Validate department (required)
    const departmentError = validateRequired(formData.department, 'Department');
    if (departmentError) {
      setFieldError('department', departmentError);
      isValid = false;
    }

    return isValid;
  };

  const handleAddUser = async () => {
    setError(null);
    setGeneralError('');
    
    // Client-side validation
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Use adminApi service instead of direct fetch
      const { adminApi } = await import('@/services/adminApi');
      const data = await adminApi.createUser({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        status: 'active'
      });

      if (data.success && data.user) {
        const newUser = {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          department: data.user.department,
          status: data.user.status,
          joinDate: data.user.joinDate || new Date().toISOString().split('T')[0]
        };
        
        setUsers([...users, newUser]);
        setFormData({ name: '', email: '', role: '', department: '' });
        clearErrors();
        setIsOpen(false);
      }
    } catch (err: any) {
      handleApiError(err);
      if (!getError('name') && !getError('email') && !getError('role') && !getError('department')) {
        setGeneralError(createErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    try {
      setError(null);
      
      if (!token) {
        setError('Not authenticated');
        return;
      }

      // Use adminApi service instead of direct fetch
      const { adminApi } = await import('@/services/adminApi');
      await adminApi.deleteUser(user.id);

      setUsers(users.filter((u) => u.id !== user.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
      console.error('Delete user error:', err);
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (value: string, row: User) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">{value}</p>
            <p className="text-xs text-muted-foreground">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-slate-400" />
          <span className="capitalize">{value.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'department',
      label: 'Department',
    },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            value === 'active'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
    },
    {
      key: 'joinDate',
      label: 'Join Date',
    },
  ];

  return (
    <AdminLayout
      title="User Management"
      description="Manage system users, roles, and permissions"
    >
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Accounts</CardTitle>
            <CardDescription>
              Showing {filteredAndSortedUsers.length} of {users.length} accounts
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadUsers}
              disabled={loading}
              className="gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Account
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Account</DialogTitle>
                  <DialogDescription>Add a new user account to the system</DialogDescription>
                </DialogHeader>
                
                {generalError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{generalError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">
                      Full Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="John Doe"
                      className={getError('name') ? 'border-red-500' : ''}
                    />
                    <FormError error={getError('name')} />
                  </div>

                  <div>
                    <Label htmlFor="email">
                      Email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="john@haramaya.edu"
                      className={getError('email') ? 'border-red-500' : ''}
                    />
                    <FormError error={getError('email')} />
                  </div>

                  <div>
                    <Label htmlFor="role">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.role} onValueChange={(value) => handleChange('role', value)}>
                      <SelectTrigger className={getError('role') ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="department_head">Department Head</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormError error={getError('role')} />
                  </div>

                  <div>
                    <Label htmlFor="department">
                      Department <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.department} onValueChange={(value) => handleChange('department', value)}>
                      <SelectTrigger className={getError('department') ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Computer Science">Computer Science</SelectItem>
                        <SelectItem value="Information Technology">Information Technology</SelectItem>
                        <SelectItem value="Software Engineering">Software Engineering</SelectItem>
                        <SelectItem value="Business Administration">Business Administration</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormError error={getError('department')} />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <Button 
                      onClick={handleAddUser} 
                      className="flex-1" 
                      disabled={loading}
                    >
                      {loading ? 'Creating...' : 'Create Account'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setFormData({ name: '', email: '', role: '', department: '' });
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
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Controls */}
          <div className="mb-6 space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, role, or department..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {(searchQuery || roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all') && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading users...</p>
            </div>
          ) : filteredAndSortedUsers.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Get started by adding your first user'}
              </p>
              {(searchQuery || roleFilter !== 'all' || departmentFilter !== 'all' || statusFilter !== 'all') && (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredAndSortedUsers}
              onDelete={handleDeleteUser}
              searchPlaceholder="Search accounts by name or email..."
            />
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
