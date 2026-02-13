import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings, Lock, Database, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useSimpleFormValidation } from '@/hooks/useFormValidation';
import { FormError } from '@/components/common/FormError';
import { validateEmail, validateRequired, validateLength, validateRange, createErrorMessage } from '@/utils/validationErrors';
import { adminApi } from '@/services/adminApi';

export default function AdminSettings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { errors, handleApiError, clearErrors, clearFieldError, getError, setFieldError } = useSimpleFormValidation();
  
  const [settings, setSettings] = useState({
    systemName: 'OTPAS-HU',
    adminEmail: 'admin@haramaya.edu',
    maintenanceMode: false,
    emailNotifications: true,
    autoBackup: true,
    backupFrequency: 'daily',
    maxUploadSize: '100',
    sessionTimeout: '30',
  });

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsFetching(true);
        const data = await adminApi.getSettings();
        
        // Map backend settings to frontend state
        setSettings({
          systemName: data.site_name || 'OTPAS-HU',
          adminEmail: data.admin_email || 'admin@haramaya.edu',
          maintenanceMode: data.maintenance_mode || false,
          emailNotifications: data.enable_email_notifications || true,
          autoBackup: data.auto_backup || true,
          backupFrequency: data.backup_frequency || 'daily',
          maxUploadSize: data.max_file_upload_size ? Math.round(data.max_file_upload_size / (1024 * 1024)).toString() : '100',
          sessionTimeout: data.session_timeout ? Math.round(data.session_timeout / 60).toString() : '30',
        });
      } catch (error) {
        console.error('Failed to fetch settings:', error);
        setMessage({ type: 'error', text: 'Failed to load settings' });
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    if (typeof value === 'string') {
      clearFieldError(field);
    }
    setMessage(null);
  };

  const validateForm = (): boolean => {
    clearErrors();
    let isValid = true;

    // Validate system name (required, 2-100 chars)
    const nameError = validateRequired(settings.systemName, 'System name') || 
                      validateLength(settings.systemName, 2, 100, 'System name');
    if (nameError) {
      setFieldError('systemName', nameError);
      isValid = false;
    }

    // Validate admin email (required, valid format)
    const emailError = validateEmail(settings.adminEmail);
    if (emailError) {
      setFieldError('adminEmail', emailError);
      isValid = false;
    }

    // Validate max upload size (required, 1-1000 MB)
    const uploadSize = parseInt(settings.maxUploadSize);
    if (isNaN(uploadSize)) {
      setFieldError('maxUploadSize', 'Max upload size must be a number');
      isValid = false;
    } else {
      const uploadError = validateRange(uploadSize, 1, 1000, 'Max upload size');
      if (uploadError) {
        setFieldError('maxUploadSize', uploadError);
        isValid = false;
      }
    }

    // Validate session timeout (required, 5-1440 minutes)
    const timeout = parseInt(settings.sessionTimeout);
    if (isNaN(timeout)) {
      setFieldError('sessionTimeout', 'Session timeout must be a number');
      isValid = false;
    } else {
      const timeoutError = validateRange(timeout, 5, 1440, 'Session timeout');
      if (timeoutError) {
        setFieldError('sessionTimeout', timeoutError);
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSave = async () => {
    setMessage(null);
    
    // Client-side validation
    if (!validateForm()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('📤 Sending settings to backend:', settings);
    setIsLoading(true);
    try {
      const response = await adminApi.updateSettings(settings);
      console.log('✅ Backend response:', response);
      
      clearErrors();
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
      
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
      handleApiError(error);
      if (!getError('systemName') && !getError('adminEmail')) {
        setMessage({ type: 'error', text: createErrorMessage(error) });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AdminLayout
      title="System Settings"
      description="Configure system-wide settings and preferences"
    >
      {isFetching ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
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

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
            <CardDescription>Basic system configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="systemName">
                System Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="systemName"
                value={settings.systemName}
                onChange={(e) => handleChange('systemName', e.target.value)}
                className={getError('systemName') ? 'border-red-500' : ''}
              />
              <FormError error={getError('systemName')} />
              <p className="text-xs text-muted-foreground mt-1">2-100 characters</p>
            </div>
            <div>
              <Label htmlFor="adminEmail">
                Admin Email <span className="text-red-500">*</span>
              </Label>
              <Input
                id="adminEmail"
                type="email"
                value={settings.adminEmail}
                onChange={(e) => handleChange('adminEmail', e.target.value)}
                className={getError('adminEmail') ? 'border-red-500' : ''}
              />
              <FormError error={getError('adminEmail')} />
              <p className="text-xs text-muted-foreground mt-1">Primary contact for system notifications</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-muted-foreground">Disable user access for maintenance</p>
              </div>
              <Switch
                checked={settings.maintenanceMode}
                onCheckedChange={(checked) => handleChange('maintenanceMode', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Settings
            </CardTitle>
            <CardDescription>Configure email notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Send email alerts for system events</p>
              </div>
              <Switch
                checked={settings.emailNotifications}
                onCheckedChange={(checked) => handleChange('emailNotifications', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup Settings
            </CardTitle>
            <CardDescription>Configure automatic backups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Backup</Label>
                <p className="text-sm text-muted-foreground">Enable automatic database backups</p>
              </div>
              <Switch
                checked={settings.autoBackup}
                onCheckedChange={(checked) => handleChange('autoBackup', checked)}
              />
            </div>
            {settings.autoBackup && (
              <div>
                <Label htmlFor="backupFrequency">Backup Frequency</Label>
                <select
                  id="backupFrequency"
                  value={settings.backupFrequency}
                  onChange={(e) => handleChange('backupFrequency', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <p className="text-xs text-muted-foreground mt-1">How often to create database backups</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Configure security parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="maxUploadSize">
                Max Upload Size (MB) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="maxUploadSize"
                type="number"
                min="1"
                max="1000"
                value={settings.maxUploadSize}
                onChange={(e) => handleChange('maxUploadSize', e.target.value)}
                className={getError('maxUploadSize') ? 'border-red-500' : ''}
              />
              <FormError error={getError('maxUploadSize')} />
              <p className="text-xs text-muted-foreground mt-1">1-1000 MB, maximum file size for uploads</p>
            </div>
            <div>
              <Label htmlFor="sessionTimeout">
                Session Timeout (minutes) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="sessionTimeout"
                type="number"
                min="5"
                max="1440"
                value={settings.sessionTimeout}
                onChange={(e) => handleChange('sessionTimeout', e.target.value)}
                className={getError('sessionTimeout') ? 'border-red-500' : ''}
              />
              <FormError error={getError('sessionTimeout')} />
              <p className="text-xs text-muted-foreground mt-1">5-1440 minutes, auto-logout after inactivity</p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => window.location.reload()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
      )}
    </AdminLayout>
  );
}
