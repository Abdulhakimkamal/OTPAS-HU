import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { getApiUrl } from '@/utils/api';

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  students: number;
  instructors: number;
  courses: number;
}

interface UseDepartmentsReturn {
  departments: Department[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createDepartment: (deptData: Partial<Department>) => Promise<Department>;
  updateDepartment: (deptId: string, deptData: Partial<Department>) => Promise<Department>;
  deleteDepartment: (deptId: string) => Promise<void>;
}

export function useDepartments(): UseDepartmentsReturn {
  const { token } = useAuth();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(getApiUrl('/api/admin/departments'), {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load departments: ${response.status}`);
      }

      const data = await response.json();
      setDepartments(data.departments || data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load departments');
      console.error('Load departments error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const createDepartment = async (deptData: Partial<Department>): Promise<Department> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(getApiUrl('/api/admin/departments'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(deptData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create department');
    }

    const newDept = await response.json();
    setDepartments([...departments, newDept]);
    return newDept;
  };

  const updateDepartment = async (deptId: string, deptData: Partial<Department>): Promise<Department> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(getApiUrl(`/api/admin/departments/${deptId}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(deptData)
    });

    if (!response.ok) {
      throw new Error('Failed to update department');
    }

    const updatedDept = await response.json();
    setDepartments(departments.map(d => d.id === deptId ? { ...d, ...updatedDept } : d));
    return updatedDept;
  };

  const deleteDepartment = async (deptId: string): Promise<void> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(getApiUrl(`/api/admin/departments/${deptId}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete department');
    }

    setDepartments(departments.filter(d => d.id !== deptId));
  };

  return {
    departments,
    loading,
    error,
    refetch: fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
