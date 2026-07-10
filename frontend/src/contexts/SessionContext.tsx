import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { SessionDetail } from '../services/api';

interface SessionContextType {
  sessionToken: string | null;
  sessionData: SessionDetail | null;
  setSession: (token: string, data: SessionDetail) => void;
  clearSession: () => void;
  isSessionActive: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionDetail | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('sessionToken');
    const savedData = localStorage.getItem('sessionData');
    
    if (savedToken && savedData) {
      setSessionToken(savedToken);
      try {
        setSessionData(JSON.parse(savedData));
      } catch (error) {
        console.error('Failed to parse session data:', error);
        localStorage.removeItem('sessionToken');
        localStorage.removeItem('sessionData');
      }
    }
  }, []);

  const setSession = (token: string, data: SessionDetail) => {
    setSessionToken(token);
    setSessionData(data);
    localStorage.setItem('sessionToken', token);
    localStorage.setItem('sessionData', JSON.stringify(data));
  };

  const clearSession = () => {
    setSessionToken(null);
    setSessionData(null);
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('sessionData');
  };

  const isSessionActive = sessionToken !== null && sessionData !== null;

  return (
    <SessionContext.Provider
      value={{
        sessionToken,
        sessionData,
        setSession,
        clearSession,
        isSessionActive,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}
