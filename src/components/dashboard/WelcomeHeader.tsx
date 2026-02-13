import { useAuth, AppRole } from '@/hooks/useAuth';

const roleGreetings: Record<AppRole, string> = {
  admin: 'System Administrator',
  department_head: 'Department Head',
  instructor: 'Instructor',
  student: 'Student',
};

const roleDescriptions: Record<AppRole, string> = {
  admin: 'Manage the entire OTPAS-HU system, users, and configurations.',
  department_head: 'Oversee your department, assign advisors, and monitor progress.',
  instructor: 'Manage tutorials, supervise projects, and provide feedback.',
  student: 'Access tutorials, submit projects, and track your academic progress.',
};

export function WelcomeHeader() {
  const { user, role } = useAuth();

  const displayName = user?.username || user?.email?.split('@')[0] || 'User';

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-display font-bold tracking-tight">
        Welcome, <span className="text-gradient">{displayName}</span>
      </h1>
      <p className="mt-2 text-muted-foreground">
        {role ? roleDescriptions[role] : 'Welcome to OTPAS-HU.'}
      </p>
    </div>
  );
}
