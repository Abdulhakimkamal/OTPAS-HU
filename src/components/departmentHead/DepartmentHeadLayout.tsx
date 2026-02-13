import { ReactNode } from 'react';
import { DepartmentHeadSidebar } from './DepartmentHeadSidebar';
import { useAuth } from '@/hooks/useAuth';
import { Navigate, Outlet } from 'react-router-dom';

interface DepartmentHeadLayoutProps {
  children?: ReactNode;
  title?: string;
  description?: string;
}

export function DepartmentHeadLayout({ children, title, description }: DepartmentHeadLayoutProps) {
  const { role } = useAuth();

  // Redirect if not department_head
  if (role !== 'department_head') {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <DepartmentHeadSidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto lg:ml-64">
        {/* Render nested routes OR children */}
        {children || <Outlet />}
      </main>
    </div>
  );
}
