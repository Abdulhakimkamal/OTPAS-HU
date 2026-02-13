import { Navigate } from 'react-router-dom';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: AppRole[];
}

const roleRedirects: Record<AppRole, string> = {
  admin: '/admin',
  department_head: '/department-head',
  instructor: '/instructor',
  student: '/student',
  super_admin: '/admin',
};

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // If user doesn't have a role yet, show a message
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold mb-2">Account Pending</h2>
          <p className="text-muted-foreground mb-4">
            Your account has been created but a role has not been assigned yet. 
            Please contact an administrator to activate your account.
          </p>
        </div>
      </div>
    );
  }

  // Check if user has one of the allowed roles
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={roleRedirects[role]} replace />;
  }

  return <>{children}</>;
}

export function RoleBasedRedirect() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!role) {
    return <Navigate to="/auth" replace />;
  }

  return <Navigate to={roleRedirects[role]} replace />;
}
