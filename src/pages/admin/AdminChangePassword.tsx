import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useSimpleFormValidation } from '@/hooks/useFormValidation';
import { FormError } from '@/components/common/FormError';
import { validatePassword, validateRequired, createErrorMessage } from '@/utils/validationErrors';
import { adminApi } from '@/services/adminApi';

export default function AdminChangePassword() {
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const { errors, handleApiError, clearErrors, clearFieldError, getError, setFieldError } = useSimpleFormValidation();

  const handleChange = (field: string, value: string) => {
    setPasswords(prev => ({ ...prev, [field]: value }));
    clearFieldError(field);
    setMessage(null);
  };

  const validatePasswords = (): boolean => {
    clearErrors();
    let isValid = true;

    // Validate current password (required)
    const currentError = validateRequired(passwords.currentPassword, 'Current password');
    if (currentError) {
      setFieldError('currentPassword', currentError);
      isValid = false;
    }

    // Validate new password (required, strength)
    const newPasswordError = validatePassword(passwords.newPassword);
    if (newPasswordError) {
      setFieldError('newPassword', newPasswordError);
      isValid = false;
    }

    // Validate confirm password (required, match)
    const confirmError = validateRequired(passwords.confirmPassword, 'Confirm password');
    if (confirmError) {
      setFieldError('confirmPassword', confirmError);
      isValid = false;
    } else if (passwords.newPassword !== passwords.confirmPassword) {
      setFieldError('confirmPassword', 'Passwords do not match');
      isValid = false;
    }

    // Check if new password is different from current
    if (passwords.currentPassword && passwords.newPassword && 
        passwords.currentPassword === passwords.newPassword) {
      setFieldError('newPassword', 'New password must be different from current password');
      isValid = false;
    }

    return isValid;
  };

  const handleChangePassword = async () => {
    setMessage(null);
    
    // Client-side validation
    if (!validatePasswords()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await adminApi.changePassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
        confirmPassword: passwords.confirmPassword
      });

      if (response.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        clearErrors();

        // Clear message after 3 seconds
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (error: any) {
      console.error('Change password error:', error);
      
      // Handle specific error messages from backend
      if (error.message === 'Current password is incorrect') {
        setFieldError('currentPassword', 'Current password is incorrect');
      } else if (error.message === 'New password must be different from current password') {
        setFieldError('newPassword', 'New password must be different from current password');
      } else {
        handleApiError(error);
        if (!getError('currentPassword') && !getError('newPassword') && !getError('confirmPassword')) {
          setMessage({ type: 'error', text: createErrorMessage(error) });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    clearErrors();
    setMessage(null);
  };

  const calculatePasswordStrength = (password: string): { score: number; label: string; color: string } => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&#]/.test(password)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score === 3) return { score, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 4) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = calculatePasswordStrength(passwords.newPassword);

  return (
    <AdminLayout
      title="Change Password"
      description="Update your account password to maintain security"
    >
      <div className="w-full max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Change Password
            </CardTitle>
            <CardDescription>
              Keep your account secure by using a strong password
            </CardDescription>
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

            {/* Current Password */}
            <div>
              <Label htmlFor="currentPassword">
                Current Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwords.currentPassword}
                  onChange={(e) => handleChange('currentPassword', e.target.value)}
                  placeholder="Enter your current password"
                  className={getError('currentPassword') ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FormError error={getError('currentPassword')} />
            </div>

            {/* New Password */}
            <div>
              <Label htmlFor="newPassword">
                New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwords.newPassword}
                  onChange={(e) => handleChange('newPassword', e.target.value)}
                  placeholder="Enter your new password"
                  className={getError('newPassword') ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FormError error={getError('newPassword')} />
              {passwords.newPassword && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all ${passwordStrength.color}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium">{passwordStrength.label}</span>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Must be at least 8 characters with uppercase, lowercase, number, and special character
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <Label htmlFor="confirmPassword">
                Confirm New Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative mt-2">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwords.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your new password"
                  className={getError('confirmPassword') ? 'border-red-500' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                  className="absolute right-3 top-3 text-gray-500 hover:text-gray-700"
                >
                  {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <FormError error={getError('confirmPassword')} />
              {passwords.newPassword && passwords.confirmPassword && !getError('confirmPassword') && (
                <p
                  className={`text-xs mt-1 ${
                    passwords.newPassword === passwords.confirmPassword
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {passwords.newPassword === passwords.confirmPassword
                    ? '✓ Passwords match'
                    : '✗ Passwords do not match'}
                </p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm font-medium mb-2">Password Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ At least 8 characters long</li>
                <li>✓ Mix of uppercase and lowercase letters</li>
                <li>✓ Include numbers and special characters</li>
                <li>✓ Different from your current password</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
              <Button
                onClick={handleChangePassword}
                disabled={isLoading || !passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
              >
                {isLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
