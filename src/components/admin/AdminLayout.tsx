import { ReactNode } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const { role } = useAuth();

  // Redirect if not admin or super_admin
  if (role !== 'admin' && role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <AdminSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto lg:ml-64">
        {/* Header */}
        {(title || description) && (
          <div className="bg-white border-b border-slate-200 p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
            {description && <p className="text-slate-600 mt-2">{description}</p>}
          </div>
        )}

        {/* Content */}
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
