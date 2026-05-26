import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { tokenstore } from '../auth/tokenstore';
import { internApi } from '../services/intern.api';
import { showToast } from '../utils/toast';
import type { InternDashboardData } from '../types/Academy/intern.types';

interface InternDataContextType {
  data: InternDashboardData | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
  refresh: () => void;
}

const InternDataContext = createContext<InternDataContextType | undefined>(undefined);

export const InternDataProvider = ({ children }: { children: ReactNode }) => {
  // useMemo so tokenstore.getUser() is only called once per mount, not on every render
  const user = useMemo(() => tokenstore.getUser(), []);
  const [data, setData] = useState<InternDashboardData | null>(null);
  // Start loading=false and pre-set error if no user — avoids setState inside effect
  const [loading, setLoading] = useState<boolean>(!!user?.userId);
  const [error, setError] = useState<string | null>(user?.userId ? null : 'User not authenticated');
  const [retryCount, setRetryCount] = useState(0);

  // useCallback so retry/refresh have stable references across renders
  const retry = useCallback(() => setRetryCount(c => c + 1), []);
  const refresh = useCallback(() => setRetryCount(c => c + 1), []);

  useEffect(() => {
    if (!user?.userId) return; // state already initialised correctly above

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await internApi.getDashboard(user.userId);
        if (!cancelled) {
          if (res.success && res.data) {
            setData(res.data);
            setError(null);
          } else {
            setError('Failed to load dashboard data');
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to load data';
          setError(errorMsg);
          showToast(errorMsg, 'error');
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.userId, retryCount]);

  return (
    <InternDataContext.Provider value={{ data, loading, error, retry, refresh }}>
      {children}
    </InternDataContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useInternDataContext = () => {
  const context = useContext(InternDataContext);
  if (context === undefined) {
    throw new Error('useInternDataContext must be used within InternDataProvider');
  }
  return context;
};
