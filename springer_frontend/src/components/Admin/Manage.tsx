import { useCallback, useEffect, useState } from 'react';
import {
  Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
} from '@mui/material';
import { adminApi } from '../../services/admin.api';
import { showToast } from '../../utils/toast';
import type { AppError } from '../../services/api.error';
import type { UpdateUserRequest, UserResponse } from '../../types/Common/admin.types';
import { FigmaEditIcon } from '../Common/FigmaIcons';
import { DEPARTMENT_OPTIONS, LOCATION_OPTIONS, ROLE_OPTIONS } from '../../config/adminUserOptions';
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

interface EditUserForm extends UpdateUserRequest {
  password: string;
}

const EMPTY_EDIT_FORM: EditUserForm = {
  username: '', password: '', roleName: '', department: '', location: '',
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
  const [editTarget, setEditTarget] = useState<UserResponse | null>(null);
  const [editForm, setEditForm] = useState<EditUserForm>(EMPTY_EDIT_FORM);
  const [editErrors, setEditErrors] = useState<Partial<EditUserForm>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

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

  const openEditDialog = (user: UserResponse) => {
    setEditTarget(user);
    setEditForm({
      username: user.username,
      password: '',
      roleName: user.roleName,
      department: user.department ?? '',
      location: user.location ?? '',
    });
    setEditErrors({});
    setShowEditPassword(false);
  };

  const closeEditDialog = () => {
    if (savingEdit) return;
    setEditTarget(null);
    setEditForm(EMPTY_EDIT_FORM);
    setEditErrors({});
  };

  const handleEditChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setEditForm(previous => ({ ...previous, [name]: value }));
    setEditErrors(previous => ({ ...previous, [name]: undefined }));
  };

  const validateEdit = (): boolean => {
    const errors: Partial<EditUserForm> = {};
    if (!editForm.username.trim()) errors.username = 'Username is required';
    else if (editForm.username.trim().length < 3) errors.username = 'Username must be at least 3 characters';
    if (editForm.password && editForm.password.length < 6) errors.password = 'Password must be at least 6 characters';
    if (!editForm.roleName) errors.roleName = 'Role is required';
    if (!editForm.department) errors.department = 'Department is required';
    if (!editForm.location) errors.location = 'Location is required';
    setEditErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editTarget || !validateEdit()) return;

    setSavingEdit(true);
    try {
      const response = await adminApi.updateUser(editTarget.userId, {
        username: editForm.username.trim(),
        password: editForm.password || undefined,
        roleName: editForm.roleName,
        department: editForm.department,
        location: editForm.location,
      });
      setUsers(previous => previous.map(user => user.userId === editTarget.userId ? response.data : user));
      showToast('User updated successfully', 'success');
      setEditTarget(null);
      setEditForm(EMPTY_EDIT_FORM);
      setEditErrors({});
    } catch (err) {
      const appErr = err as AppError;
      showToast(appErr?.message ?? 'Failed to update user', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

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
                      <IconButton
                        className="mg-edit-btn"
                        aria-label={`Edit ${user.username}`}
                        title="Edit user"
                        onClick={() => openEditDialog(user)}
                      >
                        <FigmaEditIcon />
                      </IconButton>
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

      <Dialog open={!!editTarget} onClose={closeEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User</DialogTitle>
        <form onSubmit={handleEditSubmit} noValidate>
          <DialogContent>
            <div className="mg-edit-form">
              <div className="mg-edit-field">
                <label htmlFor="edit-username">Username <span>*</span></label>
                <input id="edit-username" name="username" value={editForm.username} onChange={handleEditChange}
                  className={editErrors.username ? 'mg-edit-input mg-edit-input--error' : 'mg-edit-input'} />
                <small>{editErrors.username || '\u00A0'}</small>
              </div>
              <div className="mg-edit-field">
                <label htmlFor="edit-email">Email</label>
                <input id="edit-email" value={editTarget?.email ?? ''} className="mg-edit-input" disabled />
            
              </div>
              <div className="mg-edit-field">
                <label htmlFor="edit-password">New Password</label>
                <div className="mg-edit-password-wrap">
                  <input id="edit-password" name="password" type={showEditPassword ? 'text' : 'password'}
                    value={editForm.password} onChange={handleEditChange} autoComplete="new-password"
                    placeholder="Leave blank to keep current password"
                    className={editErrors.password ? 'mg-edit-input mg-edit-input--error' : 'mg-edit-input'} />
                  <button type="button" className="mg-edit-password-toggle"
                    onClick={() => setShowEditPassword(previous => !previous)}
                    aria-label={showEditPassword ? 'Hide password' : 'Show password'}>
                    {showEditPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11 8-11 8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <small>{editErrors.password || '\u00A0'}</small>
              </div>
              <div className="mg-edit-field">
                <label htmlFor="edit-role">Role <span>*</span></label>
                <select id="edit-role" name="roleName" value={editForm.roleName} onChange={handleEditChange}
                  className={editErrors.roleName ? 'mg-edit-input mg-edit-input--error' : 'mg-edit-input'}>
                  {ROLE_OPTIONS.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
                <small>{editErrors.roleName || '\u00A0'}</small>
              </div>
              <div className="mg-edit-field">
                <label htmlFor="edit-department">Department <span>*</span></label>
                <select id="edit-department" name="department" value={editForm.department} onChange={handleEditChange}
                  className={editErrors.department ? 'mg-edit-input mg-edit-input--error' : 'mg-edit-input'}>
                  <option value="" disabled>Select department...</option>
                  {DEPARTMENT_OPTIONS.map(department => <option key={department} value={department}>{department}</option>)}
                </select>
                <small>{editErrors.department || '\u00A0'}</small>
              </div>
              <div className="mg-edit-field">
                <label htmlFor="edit-location">Location <span>*</span></label>
                <select id="edit-location" name="location" value={editForm.location} onChange={handleEditChange}
                  className={editErrors.location ? 'mg-edit-input mg-edit-input--error' : 'mg-edit-input'}>
                  <option value="" disabled>Select location...</option>
                  {LOCATION_OPTIONS.map(location => <option key={location} value={location}>{location}</option>)}
                </select>
                <small>{editErrors.location || '\u00A0'}</small>
              </div>
            </div>
          </DialogContent>
          <DialogActions>
            <Button variant="outlined" className="g-btn g-btn-outline-primary" onClick={closeEditDialog} disabled={savingEdit}>Cancel</Button>
            <Button type="submit" variant="contained" className="g-btn g-btn-primary" disabled={savingEdit}>
              {savingEdit ? <CircularProgress size={18} /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}

export default Manage;
