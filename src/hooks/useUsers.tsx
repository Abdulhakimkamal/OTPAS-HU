import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: 'active' | 'inactive';
  joinDate: string;
}

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createUser: (userData: Partial<User>) => Promise<User>;
  updateUser: (userId: string, userData: Partial<User>) => Promise<User>;
  deleteUser: (userId: string) => Promise<void>;
}

export function useUsers(): UseUsersReturn {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('http://127.0.0.1:5000/api/admin/users', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load users: ${response.status}`);
      }

      const data = await response.json();
      const mappedUsers = (data.users || []).map((user: any) => ({
        id: user.id,
        name: user.name || user.full_name || 'Unknown',
        email: user.email,
        role: user.role || user.role_name || 'Unknown',
        department: user.department || user.department_name || 'N/A',
        status: user.status || (user.is_active ? 'active' : 'inactive'),
        joinDate: user.joinDate ? (typeof user.joinDate === 'string' ? user.joinDate.split('T')[0] : user.joinDate) : new Date().toISOString().split('T')[0]
      }));

      setUsers(mappedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = async (userData: Partial<User>): Promise<User> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch('http://127.0.0.1:5000/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create user');
    }

    const data = await response.json();
    const newUser = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role,
      department: data.user.department,
      status: data.user.status,
      joinDate: data.user.joinDate
    };

    setUsers([...users, newUser]);
    return newUser;
  };

  const updateUser = async (userId: string, userData: Partial<User>): Promise<User> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`http://127.0.0.1:5000/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Failed to update user');
    }

    const updatedUser = await response.json();
    setUsers(users.map(u => u.id === userId ? { ...u, ...updatedUser } : u));
    return updatedUser;
  };

  const deleteUser = async (userId: string): Promise<void> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`http://127.0.0.1:5000/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }

    setUsers(users.filter(u => u.id !== userId));
  };

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
