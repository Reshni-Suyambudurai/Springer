import { useCallback, useEffect, useState } from 'react';
import { CircularProgress } from '@mui/material';
import { adminApi } from '../../services/admin.api';
import { showToast } from '../../utils/toast';
import type { AppError } from '../../services/api.error';
import type { UserResponse } from '../../types/Common/admin.types';
import '../../css/Admin/Manage.css';

const ROLE_LABELS: Record<string, string> = {
  TA_MANAGER:           'TA Manager',
  TA_HEAD:              'TA Head',
  HIRING_MANAGER:       'Hiring Manager',
  MEMBERS:              'Panel Member',
  TRAINING_COORDINATOR: 'Training Coordinator',
  SYSTEM_ADMIN:         'System Admin',
  HR_OPERATIONS:        'HR Operations',
  BU_SPOC:              'BU SPOC',
};

function groupByRole(users: UserResponse[]): Record<string, UserResponse[]> {
  return users.reduce<Record<string, UserResponse[]>>((acc, user) => {
    const key = user.roleName ?? 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(user);
    return acc;
  }, {});
}

function Manage() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getAllUsersExceptInternRole();
      setUsers(res.data);
    } catch (err) {
      const appErr = err as AppError;
      showToast(appErr?.message ?? 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggle = useCallback(async (userId: number) => {
    setTogglingId(userId);
    try {
      const res = await adminApi.toggleStatusUsingId(userId);
      setUsers(prev => prev.map(u => u.userId === userId ? res.data : u));
      showToast('User status updated successfully', 'success');
    } catch (err) {
      const appErr = err as AppError;
      showToast(appErr?.message ?? 'Failed to update status', 'error');
    } finally {
      setTogglingId(null);
    }
  }, []);

  const grouped = groupByRole(users);
  const roleOrder = Object.keys(grouped).sort();

  return (
    <div className="mg-page">
     

      {/* Content */}
      <div className="mg-content">
        {loading ? (
          <div className="mg-loading">
            <CircularProgress size={32} className="mg-spinner" />
            <span className="mg-loading-text">Loading users…</span>
          </div>
        ) : users.length === 0 ? (
          <div className="mg-empty">
            <p className="mg-empty-text">No users found.</p>
          </div>
        ) : (
          roleOrder.map(role => (
            <section key={role} className="mg-role-section">
              <div className="mg-role-heading">
                <span className="mg-role-label">{ROLE_LABELS[role] ?? role}</span>
                <span className="mg-role-count">{grouped[role].length}</span>
              </div>
              <div className="mg-cards-grid">
                {grouped[role].map(user => (
                  <div
                    key={user.userId}
                    className={`mg-card${user.isActive ? '' : ' mg-card--inactive'}`}
                  >
                    {/* Card header */}
                    <div className="mg-card-header">
                      <div className="mg-avatar">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="mg-card-info">
                        <span className="mg-card-name">{user.username}</span>
                        <span className="mg-card-email">{user.email}</span>
                      </div>
                      <span className={`mg-status-badge${user.isActive ? ' mg-status-badge--active' : ' mg-status-badge--inactive'}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Card meta */}
                    <div className="mg-card-meta">
                      {user.department && (
                        <span className="mg-meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="7" width="20" height="14" rx="2" />
                            <path d="M16 7V5a2 2 0 00-4 0v2" />
                          </svg>
                          {user.department}
                        </span>
                      )}
                      {user.location && (
                        <span className="mg-meta-item">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          {user.location}
                        </span>
                      )}
                    </div>

                    {/* Toggle button */}
                    <div className="mg-card-footer">
                      <button
                        className={`mg-toggle-btn${user.isActive ? ' mg-toggle-btn--deactivate' : ' mg-toggle-btn--activate'}`}
                        onClick={() => handleToggle(user.userId)}
                        disabled={togglingId === user.userId}
                      >
                        {togglingId === user.userId ? (
                          <CircularProgress size={14} className="mg-btn-spinner" />
                        ) : user.isActive ? (
                          'Deactivate'
                        ) : (
                          'Activate'
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

export default Manage;
