import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
  const user = tokenstore.getUser();
  const [data, setData] = useState<InternDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount(c => c + 1);
  const refresh = () => setRetryCount(c => c + 1);

  useEffect(() => {
    let cancelled = false;

    if (!user?.userId) {
      setData(null);
      setLoading(false);
      setError('User not authenticated');
      return () => { cancelled = true; };
    }

    setLoading(true);
    setError(null);

    internApi.getDashboard(user.userId)
      .then(res => {
        if (!cancelled && res.success && res.data) {
          setData(res.data);
          setError(null);
        } else if (!cancelled) {
          setError('Failed to load dashboard data');
        }
      })
      .catch(err => {
        if (!cancelled) {
          const errorMsg = err.message || 'Failed to load data';
          setError(errorMsg);
          showToast(errorMsg, 'error');
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.userId, retryCount]);

  return (
    <InternDataContext.Provider value={{ data, loading, error, retry, refresh }}>
      {children}
    </InternDataContext.Provider>
  );
};

export const useInternDataContext = () => {
  const context = useContext(InternDataContext);
  if (context === undefined) {
    throw new Error('useInternDataContext must be used within InternDataProvider');
  }
  return context;
};
