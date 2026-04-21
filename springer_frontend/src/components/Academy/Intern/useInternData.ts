import { useState, useEffect } from 'react';
import { tokenstore } from '../../../auth/tokenstore';
import { internApi } from '../../../services/intern.api';
import { showToast } from '../../../utils/toast';
import type { InternDashboardData } from '../../../types/Academy/intern.types';

export const useInternData = () => {
  const user = tokenstore.getUser();
  const [data, setData]       = useState<InternDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const retry = () => setRetryCount(c => c + 1);

  useEffect(() => {
    let cancelled = false;

    if (!user?.userId) {
      setData(null);
      setLoading(false);
      return () => { cancelled = true; };
    }

    setLoading(true);
    internApi.getDashboard(user.userId)
      .then(res => {
        if (!cancelled && res.success && res.data) setData(res.data);
      })
      .catch(err => {
        if (!cancelled) {
          showToast(err.message || 'Failed to load data', 'error');
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.userId, retryCount]);

  return { data, loading, user, retry };
};
