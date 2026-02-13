import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Phone, MapPin, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { useSimpleFormValidation } from '@/hooks/useFormValidation';
import { FormError } from '@/components/common/FormError';
import { validateEmail, validateRequired, validateLength, createErrorMessage } from '@/utils/validationErrors';
import { adminApi } from '@/services/adminApi';

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { errors, handleApiError, clearErrors, clearFieldError, getError, setFieldError } = useSimpleFormValidation();
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    bio: '',
    joinDate: '',
    lastLogin: '',
  });

  const [editData, setEditData] = useState(profile);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsFetching(true);
        const data = await adminApi.getProfile();
        
        if (data.success && data.user) {
          const user = data.user;
          const profileData = {
            fullName: user.full_name || user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            department: user.department_name || user.department || '',
            position: user.position || user.role_name || '',
            bio: user.bio || '',
            joinDate: user.created_at ? new Date(user.created_at).toISOString().split('T')[0] : '',
            lastLogin: user.last_login || user.updated_at || '',
          };
          setProfile(profileData);
          setEditData(profileData);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        setMessage({ type: 'error', text: 'Failed to load profile data' });
      } finally {
        setIsFetching(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (field: string, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
    setMessage(null);
  };

  const validateForm = (): boolean => {
    clearErrors();
    let isValid = true;

    // Validate full name (required, 2-100 chars)
    const nameError = validateRequired(editData.fullName, 'Full name') || 
                      validateLength(editData.fullName, 2, 100, 'Full name');
    if (nameError) {
      setFieldError('fullName', nameError);
      isValid = false;
    }

    // Validate email (required, valid format)
    const emailError = validateEmail(editData.email);
    if (emailError) {
      setFieldError('email', emailError);
      isValid = false;
    }

    // Validate phone (optional, valid format if provided)
    if (editData.phone && !/^[\d\s\-\+\(\)]+$/.test(editData.phone)) {
      setFieldError('phone', 'Phone number must contain only digits and valid phone characters');
      isValid = false;
    }

    // Validate bio (optional, max 500 chars)
    if (editData.bio && editData.bio.length > 500) {
      setFieldError('bio', 'Bio must not exceed 500 characters');
      isValid = false;
    }

    return isValid;
  };

  const handleSave = async () => {
    setMessage(null);
    
    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Only send fields that backend accepts: full_name, email, phone, bio
      const response = await adminApi.updateProfile({
        full_name: editData.fullName,
        email: editData.email,
        phone: editData.phone || null,
        bio: editData.bio || null,
      });

      if (response.success) {
        // Update profile with the data returned from server
        if (response.user) {
          const updatedProfile = {
            fullName: response.user.full_name || response.user.name || '',
            email: response.user.email || '',
            phone: response.user.phone || '',
            department: profile.department, // Keep existing department
            position: profile.position, // Keep existing position
            bio: response.user.bio || '',
            joinDate: profile.joinDate,
            lastLogin: profile.lastLogin,
          };
          setProfile(updatedProfile);
          setEditData(updatedProfile);
        } else {
          setProfile(editData);
        }
        setIsEditing(false);
        clearErrors();
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Update profile error:', error);
      handleApiError(error);
      if (!getError('fullName') && !getError('email')) {
        setMessage({ type: 'error', text: createErrorMessage(error) });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData(profile);
    setIsEditing(false);
    clearErrors();
    setMessage(null);
  };

  return (
    <AdminLayout
      title="Manage Profile"
      description="View and update your profile information"
    >
      {isFetching ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl sm:text-2xl font-bold truncate">{profile.fullName}</h2>
                <p className="text-muted-foreground text-sm truncate">{profile.position}</p>
              </div>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant={isEditing ? 'outline' : 'default'}
              className="w-full sm:w-auto"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </CardHeader>
        </Card>

        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Your personal and professional details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Alert Messages */}
            {message && (
              <Alert variant={message.type === 'success' ? 'default' : 'destructive'}>
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <Label htmlFor="fullName">
                  Full Name {isEditing && <span className="text-red-500">*</span>}
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="fullName"
                      value={editData.fullName}
                      onChange={(e) => handleChange('fullName', e.target.value)}
                      className={`mt-2 ${getError('fullName') ? 'border-red-500' : ''}`}
                    />
                    <FormError error={getError('fullName')} />
                    <p className="text-xs text-muted-foreground mt-1">2-100 characters</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm font-medium">{profile.fullName}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email {isEditing && <span className="text-red-500">*</span>}
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="email"
                      type="email"
                      value={editData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`mt-2 ${getError('email') ? 'border-red-500' : ''}`}
                    />
                    <FormError error={getError('email')} />
                  </>
                ) : (
                  <p className="mt-2 text-sm font-medium">{profile.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                {isEditing ? (
                  <>
                    <Input
                      id="phone"
                      value={editData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className={`mt-2 ${getError('phone') ? 'border-red-500' : ''}`}
                    />
                    <FormError error={getError('phone')} />
                    <p className="text-xs text-muted-foreground mt-1">Optional</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm font-medium">{profile.phone}</p>
                )}
              </div>

              {/* Department */}
              <div>
                <Label htmlFor="department" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Department
                </Label>
                <p className="mt-2 text-sm font-medium">{profile.department || 'N/A'}</p>
              </div>

              {/* Position */}
              <div>
                <Label htmlFor="position">Position</Label>
                <p className="mt-2 text-sm font-medium">{profile.position || 'N/A'}</p>
              </div>

              {/* Join Date */}
              <div>
                <Label htmlFor="joinDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Join Date
                </Label>
                <p className="mt-2 text-sm font-medium">{profile.joinDate}</p>
              </div>
            </div>

            {/* Bio */}
            <div>
              <Label htmlFor="bio">Bio</Label>
              {isEditing ? (
                <>
                  <Textarea
                    id="bio"
                    value={editData.bio}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    className={`mt-2 ${getError('bio') ? 'border-red-500' : ''}`}
                    rows={4}
                  />
                  <FormError error={getError('bio')} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional, max 500 characters ({editData.bio.length}/500)
                  </p>
                </>
              ) : (
                <p className="mt-2 text-sm font-medium">{profile.bio}</p>
              )}
            </div>

            {/* Last Login */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Last login: {profile.lastLogin}
              </p>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </AdminLayout>
  );
}
