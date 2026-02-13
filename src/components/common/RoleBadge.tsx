import { Shield, User, Users, GraduationCap, Crown } from 'lucide-react';

type RoleType = 'super_admin' | 'admin' | 'department_head' | 'instructor' | 'student';

interface RoleBadgeProps {
  role: RoleType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const roleConfig = {
  super_admin: {
    label: 'Super Admin',
    className: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Crown,
  },
  admin: {
    label: 'Admin',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Shield,
  },
  department_head: {
    label: 'Department Head',
    className: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    icon: Users,
  },
  instructor: {
    label: 'Instructor',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: GraduationCap,
  },
  student: {
    label: 'Student',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: User,
  },
};

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

export function RoleBadge({ role, size = 'md', showIcon = true }: RoleBadgeProps) {
  const normalizedRole = role.toLowerCase().replace(/\s+/g, '_') as RoleType;
  const config = roleConfig[normalizedRole] || roleConfig.student;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.className} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
}
