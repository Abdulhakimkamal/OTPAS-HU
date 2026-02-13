import { CheckCircle, XCircle, Clock, AlertCircle, Loader2, Ban, Info, HelpCircle } from 'lucide-react';

type StatusType = 
  | 'active' 
  | 'inactive' 
  | 'pending' 
  | 'approved' 
  | 'rejected' 
  | 'processing' 
  | 'suspended'
  | 'unknown';

interface StatusBadgeProps {
  status: StatusType | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

const statusConfig = {
  active: {
    label: 'Active',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: XCircle,
  },
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
  processing: {
    label: 'Processing',
    className: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Loader2,
  },
  suspended: {
    label: 'Suspended',
    className: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: Ban,
  },
  unknown: {
    label: 'Unknown',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: HelpCircle,
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

export function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const normalizedStatus = status.toLowerCase() as StatusType;
  const config = statusConfig[normalizedStatus] || statusConfig.unknown;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.className} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={`${iconSizes[size]} ${normalizedStatus === 'processing' ? 'animate-spin' : ''}`} />}
      {config.label}
    </span>
  );
}
