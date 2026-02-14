import { createContext, useContext, useState, ReactNode } from 'react';
import { getApiUrl } from '@/utils/api';

export type AppRole = 'admin' | 'department_head' | 'instructor' | 'student' | 'super_admin';

interface RegisteredUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: AppRole;
}

interface AuthContextType {
  user: { id: string; email: string; username: string } | null;
  role: AppRole | null;
  profileId: string | null;
  loading: boolean;
  token: string | null;
  signIn: (emailOrUsername: string, password: string, selectedRole?: AppRole) => Promise<{ error: Error | null; role?: AppRole; mustChangePassword?: boolean }>;
  signUp: (email: string, password: string, fullName: string, username: string, selectedRole?: AppRole) => Promise<{ error: Error | null; role?: AppRole }>;
  signOut: () => Promise<void>;
  setRole: (role: AppRole | null) => void;
  superAdminLogin: (username: string, password: string) => Promise<{ error: Error | null; role?: AppRole }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role-based user mapping for demo
const roleUserMap: Record<AppRole, { id: string; email: string; name: string }> = {
  admin: { id: '1', email: 'admin@haramaya.edu', name: 'System Administrator' },
  department_head: { id: '2', email: 'john.doe@haramaya.edu', name: 'Dr. John Doe' },
  instructor: { id: '3', email: 'jane.smith@haramaya.edu', name: 'Prof. Jane Smith' },
  student: { id: '4', email: 'abebe.kebede@student.haramaya.edu', name: 'Abebe Kebede' },
  super_admin: { id: '0', email: 'superadmin@haramaya.edu', name: 'Super Administrator' },
};

// Initial registered users
const initialRegisteredUsers: RegisteredUser[] = [
  { id: '1', email: 'admin@haramaya.edu', username: 'admin', fullName: 'System Administrator', role: 'admin' },
  { id: '2', email: 'john.doe@haramaya.edu', username: 'john_doe', fullName: 'Dr. John Doe', role: 'department_head' },
  { id: '3', email: 'jane.smith@haramaya.edu', username: 'jane_smith', fullName: 'Prof. Jane Smith', role: 'instructor' },
  { id: '4', email: 'abebe.kebede@student.haramaya.edu', username: 'abebe_kebede', fullName: 'Abebe Kebede', role: 'student' },
];

// Helper to get initial registered users from localStorage or use defaults
const getInitialRegisteredUsers = (): RegisteredUser[] => {
  try {
    const stored = localStorage.getItem('registeredUsers');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to parse stored users:', e);
  }
  return initialRegisteredUsers;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; username: string } | null>(null);
  const [role, setRoleState] = useState<AppRole | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [registeredUsers, setRegisteredUsersState] = useState<RegisteredUser[]>(getInitialRegisteredUsers());

  // Helper to update registered users and persist to localStorage
  const setRegisteredUsers = (users: RegisteredUser[]) => {
    setRegisteredUsersState(users);
    try {
      localStorage.setItem('registeredUsers', JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage:', e);
    }
  };

  const superAdminLogin = async (username: string, password: string): Promise<{ error: Error | null; role?: AppRole }> => {
    try {
      setLoading(true);
      
      const response = await fetch(getApiUrl('/api/auth/super-admin/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername: username, password }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        return { error: new Error('Server returned invalid response. Please try again.') };
      }

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.message || 'Super-Admin login failed') };
      }

      // Store token and user info
      setToken(data.token);
      setUser({ id: data.user.id, email: data.user.email, username: data.user.username });
      setRoleState('super_admin');
      setProfileId(`profile-${data.user.id}`);
      
      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', 'super_admin');
      localStorage.setItem('user', JSON.stringify(data.user));

      return { error: null, role: 'super_admin' };
    } catch (error) {
      console.error('Super admin login error:', error);
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (emailOrUsername: string, password: string, selectedRole?: AppRole) => {
    try {
      setLoading(true);
      
      const response = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        return { error: new Error('Server returned invalid response. Please try again.') };
      }

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.message || 'Invalid email/username or password') };
      }

      // Backend login successful
      setToken(data.token);
      setUser({ id: data.user.id, email: data.user.email, username: data.user.username });
      setRoleState(data.user.role as AppRole);
      setProfileId(`profile-${data.user.id}`);
      
      // Store token and user info in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('mustChangePassword', data.mustChangePassword ? 'true' : 'false');

      return { 
        error: null, 
        role: data.user.role as AppRole,
        mustChangePassword: data.mustChangePassword 
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, username: string, selectedRole?: AppRole) => {
    try {
      setLoading(true);

      const userRole = selectedRole || 'student';

      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, full_name: fullName, username, role: userRole }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: new Error(data.message || 'Registration failed') };
      }

      // Backend registration successful
      setToken(data.token);
      setUser({ id: data.user.id, email: data.user.email, username: data.user.username });
      setRoleState(userRole);
      setProfileId(`profile-${data.user.id}`);
      
      // Store token in localStorage
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('userRole', userRole);
      localStorage.setItem('user', JSON.stringify(data.user));

      return { error: null, role: userRole };
    } catch (error) {
      console.error('Registration error:', error);
      return { error: error as Error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    setRoleState(null);
    setProfileId(null);
    setToken(null);
    
    // Clear localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    localStorage.removeItem('mustChangePassword');
  };

  const setRole = (newRole: AppRole | null) => {
    setRoleState(newRole);
    if (newRole) {
      const foundUser = registeredUsers.find(u => u.role === newRole);
      if (foundUser) {
        setUser({ id: foundUser.id, email: foundUser.email, username: foundUser.username });
        setProfileId(`profile-${foundUser.id}`);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, profileId, loading, token, signIn, signUp, signOut, setRole, superAdminLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
