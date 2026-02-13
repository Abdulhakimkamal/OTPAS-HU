import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useFormValidation } from '@/hooks/useFormValidation';
import { FormError } from '@/components/common/FormError';
import { validateRequired } from '@/utils/validationErrors';

export default function AuthPage() {
  const navigate = useNavigate();
  const { signIn, superAdminLogin } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);

  // Function to handle logo clicks for Super-Admin mode
  const handleLogoClick = () => {
    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);
    
    if (newCount === 5) {
      setIsSuperAdminMode(!isSuperAdminMode);
      setLogoClickCount(0);
    }
  };

  // Form state
  const [formData, setFormData] = useState({
    emailOrUsername: '',
    password: '',
  });

  // Form validation hook
  const { errors, touched, isSubmitting, handleSubmit, setFieldTouched, clearErrors } = useFormValidation({
    onSubmit: async (data) => {
      setError(null);
      clearErrors();
      
      let result;
      
      try {
        // If Super-Admin mode is enabled, use superAdminLogin
        if (isSuperAdminMode) {
          result = await superAdminLogin(data.emailOrUsername, data.password);
        } else {
          result = await signIn(data.emailOrUsername, data.password);
        }

        const { error, role, mustChangePassword } = result;
        
        if (error) {
          if (error.message.includes('Invalid')) {
            setError('Invalid email/username or password.');
          } else if (error.message.includes('fetch')) {
            setError('Network error. Please check your connection and try again.');
          } else {
            setError(error.message);
          }
          throw error;
        } else {
          // Check if user must change password
          if (mustChangePassword) {
            // Redirect to change password page based on role
            if (role === 'admin' || role === 'super_admin') {
              navigate('/admin/change-password');
            } else if (role === 'department_head') {
              navigate('/department/change-password');
            } else if (role === 'instructor') {
              navigate('/instructor/change-password');
            } else if (role === 'student') {
              navigate('/student/change-password');
            }
            return;
          }
          
          // Redirect based on role
          if (role === 'admin' || role === 'super_admin') {
            navigate('/admin');
          } else if (role === 'department_head') {
            navigate('/department');
          } else if (role === 'instructor') {
            navigate('/instructor');
          } else if (role === 'student') {
            navigate('/student');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (err) {
        // Error already set above
      }
    },
    validate: (data) => {
      const validationErrors: Record<string, string> = {};
      
      const emailError = validateRequired(data.emailOrUsername, 'Email or username');
      if (emailError) validationErrors.emailOrUsername = emailError;
      
      const passwordError = validateRequired(data.password, 'Password');
      if (passwordError) validationErrors.password = passwordError;
      
      return validationErrors;
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setFieldTouched(e.target.name, true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-sm">
          {/* Login Card */}
          <Card className="bg-white/80 backdrop-blur-xl border-0 shadow-2xl rounded-3xl overflow-hidden relative">
            {/* Card glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-green-500/10 rounded-3xl blur-xl"></div>
            
            <CardContent className="p-8 relative z-10">
              {/* University Logo - Centered */}
              <div className="text-center mb-6">
                <div 
                  className="mx-auto w-20 h-20 mb-4 cursor-pointer relative group"
                  onClick={handleLogoClick}
                >
                  {/* Logo glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  
                  <div className="relative w-full h-full bg-white rounded-full p-1 shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                    <img 
                      src={`/images/logo-haramaya.png?v=${Date.now()}`}
                      alt="Haramaya University Logo" 
                      className="w-full h-full object-cover rounded-full"
                      onLoad={(e) => {
                        console.log('Logo loaded successfully');
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = 'none';
                      }}
                      onError={(e) => {
                        console.log('Logo failed to load from /images/, showing fallback');
                        e.currentTarget.style.display = 'none';
                        const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                        if (nextElement) nextElement.style.display = 'flex';
                      }}
                    />
                    <span className="text-green-800 font-black text-lg select-none hidden items-center justify-center w-full h-full">HU</span>
                  </div>
                </div>
                
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6">
                  LOGIN TO SECURE ACCESS
                  {isSuperAdminMode && <span className="text-xs text-amber-600 ml-2 bg-amber-100 px-2 py-1 rounded-full">[Super-Admin]</span>}
                </h1>
              </div>

              {/* Super Admin Mode Indicator */}
              {isSuperAdminMode && (
                <div className="mb-6 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl">
                  <p className="text-amber-800 text-sm text-center font-medium flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                    Super-Admin Mode Activated
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="flex items-start gap-3 p-4 mb-6 rounded-2xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={(e) => handleSubmit(e, formData)} className="space-y-6">
                {/* Email or Username */}
                <div className="space-y-2">
                  <Label htmlFor="emailOrUsername" className="text-gray-700 font-medium text-sm flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></span>
                    Username
                  </Label>
                  <div className="relative group">
                    <Input
                      id="emailOrUsername"
                      name="emailOrUsername"
                      type="text"
                      placeholder="Enter your username"
                      className={`w-full px-4 py-3 rounded-2xl border-2 bg-white/50 backdrop-blur-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 transition-all duration-300 group-hover:shadow-md ${
                        errors.emailOrUsername && touched.emailOrUsername ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200'
                      }`}
                      value={formData.emailOrUsername}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  {touched.emailOrUsername && (
                    <FormError error={errors.emailOrUsername} className="text-red-500 text-xs ml-1" />
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-700 font-medium text-sm flex items-center gap-2">
                    <span className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full"></span>
                    Password
                  </Label>
                  <div className="relative group">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      className={`w-full px-4 py-3 pr-12 rounded-2xl border-2 bg-white/50 backdrop-blur-sm text-gray-800 placeholder-gray-400 focus:bg-white focus:border-purple-400 focus:ring-4 focus:ring-purple-400/20 transition-all duration-300 group-hover:shadow-md ${
                        errors.password && touched.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : 'border-gray-200'
                      }`}
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-100"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                  {touched.password && (
                    <FormError error={errors.password} className="text-red-500 text-xs ml-1" />
                  )}
                </div>

                {/* Login Button */}
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-blue-700 hover:from-blue-700 hover:via-purple-700 hover:to-blue-800 text-white font-semibold py-3.5 rounded-2xl text-base transition-all duration-300 transform hover:scale-[1.02] hover:shadow-xl disabled:transform-none shadow-lg relative overflow-hidden group"
                  disabled={isSubmitting}
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Logging in...
                      </>
                    ) : (
                      'Login'
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}