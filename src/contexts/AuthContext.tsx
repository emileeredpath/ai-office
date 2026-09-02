import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSession, login as loginRequest, logout as logoutRequest, type SessionRole } from '@/services/authApi';
import { onSessionExpired } from '@/services/apiConfig';
import { useAppStore } from '@/store/useAppStore';

interface AuthContextType {
  status: 'checking' | 'signed-out' | 'signed-in';
  role: SessionRole;
  isEditor: boolean;
  login: (password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<'checking' | 'signed-out' | 'signed-in'>('checking');
  const [role, setRole] = useState<SessionRole>(null);

  useEffect(() => {
    getSession().then((session) => {
      setRole(session.role);
      setStatus(session.authenticated ? 'signed-in' : 'signed-out');
      if (session.authenticated) {
        useAppStore.getState().syncTasksFromApi();
        useAppStore.getState().syncCampaignsFromApi();
      }
    });
  }, []);

  // A 401 from any protected route (not just the initial check above)
  // means the backend no longer recognises this session — most commonly a
  // Railway redeploy clearing the in-memory session store. Drop straight
  // back to signed-out so LoginGate shows the password screen again,
  // rather than leaving stale "signed in" UI in front of data that can no
  // longer load.
  useEffect(() => {
    onSessionExpired(() => {
      setRole(null);
      setStatus('signed-out');
    });
    return () => onSessionExpired(null);
  }, []);

  const login = useCallback(async (password: string) => {
    const result = await loginRequest(password);
    if (result.success) {
      setRole(result.role ?? null);
      setStatus('signed-in');
      useAppStore.getState().syncTasksFromApi();
      useAppStore.getState().syncCampaignsFromApi();
      return { success: true };
    }
    return { success: false, message: result.message || 'Incorrect password.' };
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest();
    setRole(null);
    setStatus('signed-out');
  }, []);

  return (
    <AuthContext.Provider value={{ status, role, isEditor: role === 'edit', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
