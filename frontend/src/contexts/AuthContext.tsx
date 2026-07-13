import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  email: string;
  role: string;
  restaurant_id?: string;
  name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      setAccessToken(savedToken);
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Failed to parse user data:', error);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    }

    setIsLoading(false);
  }, []);

  const setAuth = (newUser: User, newAccessToken: string, newRefreshToken: string) => {
    setUser(newUser);
    setAccessToken(newAccessToken);
    localStorage.setItem('accessToken', newAccessToken);
    localStorage.setItem('refreshToken', newRefreshToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Login failed');
      }

      const { user, accessToken, refreshToken } = result.data;
      setAuth(user, accessToken, refreshToken);
      return user; // Return user data for role-based redirect
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!user && !!accessToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated,
        isLoading,
        login,
        logout,
        setAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
