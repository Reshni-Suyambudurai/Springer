import { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { tokenstore } from '../../auth/tokenstore';
import { notificationApi } from '../../services/notification.api';
import type { NotificationResponse } from '../../types/notification.types';
import '../../css/Common/Navbar.css';

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back' },
  '/ta-recruiter/dashboard': { title: 'Dashboard', subtitle: 'Welcome back' },
  '/ta-recruiter/institutes': { title: 'Institutes Management', subtitle: 'Manage and view all registered institutes' },
  '/ta-recruiter/candidates': { title: 'Candidates', subtitle: 'Manage and view all candidates' },
  '/ta-recruiter/hiring-cycles': { title: 'Hiring Cycle', subtitle: 'Manage hiring cycles' },
  '/ta-recruiter/drive-calendar': { title: 'Hiring Calendar', subtitle: 'View and manage hiring calendar' },
  '/ta-recruiter/documents': { title: 'Document Processing', subtitle: 'Manage candidate documents and offers' },
  '/ta-recruiter/academy': { title: 'Academy', subtitle: 'Manage training programs, courses, and intern progress' },
  '/ta-recruiter/settings': { title: 'Manage', subtitle: 'Settings and configurations' },
  '/drive-process/drive-cycle': { title: 'Drive Dashboard', subtitle: 'Manage drive cycles' },
  '/ta-head/dashboard': { title: 'Dashboard', subtitle: 'Welcome back' },
  '/ta-head/hiring-cycles': { title: 'Hiring Cycle', subtitle: 'Manage hiring cycles' },
  '/ta-head/academy': { title: 'Academy Dashboard', subtitle: 'Academy management' },
  '/hiring-manager/dashboard': { title: 'Dashboard', subtitle: 'Welcome back' },
  '/hiring-manager/hiring-cycles': { title: 'Hiring Cycle', subtitle: 'Manage hiring cycles' },
  '/hiring-manager/requests': { title: 'Requests', subtitle: 'Manage hiring requests' },
  '/admin/dashboard': { title: 'Dashboard', subtitle: 'System administration' },
  '/admin/users': { title: 'Users', subtitle: 'Manage system users' },
  '/admin/settings': { title: 'Settings', subtitle: 'System settings' },
};

function Navbar() {
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const location = useLocation();
    const user = tokenstore.getUser();

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const getPageInfo = () => {
        const path = location.pathname;
        if (PAGE_TITLES[path]) return PAGE_TITLES[path];
        // Check for dynamic routes like /ta-recruiter/institutes/:id
        const base = '/' + path.split('/').slice(1, 3).join('/');
        if (PAGE_TITLES[base]) return PAGE_TITLES[base];
        return { title: 'Springer', subtitle: '' };
    };

    const { title, subtitle } = getPageInfo();

    const loadNotifications = useCallback(async () => {
        if (!user?.userId) return;
        try {
            const res = await notificationApi.getNotifications(user.userId);
            if (res.success && res.data) setNotifications(res.data);
        } catch { /* silent */ }
    }, [user?.userId]);

    useEffect(() => {
        if (!user?.userId) return;
        loadNotifications();
        // Use correct WebSocket port (8080, same as API)
        const wsUrl = `ws://localhost:8080/ws/notifications?userId=${user.userId}`;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;
        ws.onmessage = (event) => {
            try {
                const newNotif: NotificationResponse = JSON.parse(event.data);
                setNotifications(prev => [newNotif, ...prev]);
            } catch { /* ignore */ }
        };
        ws.onerror = () => { /* silent */ };
        return () => { ws.close(); };
    }, [user?.userId, loadNotifications]);

    const handleMarkAsRead = async (notificationId: number) => {
        try {
            await notificationApi.markAsRead(notificationId);
            setNotifications(prev =>
                prev.map(n => n.notificationId === notificationId ? { ...n, isRead: true } : n)
            );
        } catch { /* silent */ }
    };

    const handleMarkAllRead = async () => {
        const unread = notifications.filter(n => !n.isRead);
        await Promise.allSettled(unread.map(n => notificationApi.markAsRead(n.notificationId)));
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const formatTime = (iso: string) => {
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-left">
                    {location.pathname.startsWith('/ta-recruiter/institutes/') && (
                        <button className="navbar-back-btn" onClick={() => window.history.back()} aria-label="Go back">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                        </button>
                    )}
                    <div className="navbar-page-info">
                        <p className="navbar-page-title">{title}</p>
                        {subtitle && <p className="navbar-page-subtitle">{subtitle}</p>}
                    </div>
                </div>

                {/* Right: Page Actions + Notification */}
                <div className="navbar-right">

                    {/* Portal target for page-level actions (e.g. cycle selector) */}
                    <div id="navbar-actions-slot" />

                    {/* Notification Bell */}
                    <div className="navbar-notif" ref={notifRef}>
                        <button className="navbar-icon-btn" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="notif-dropdown">
                                <div className="notif-dropdown-header">
                                    <span className="notif-dropdown-title">Notifications</span>
                                    {unreadCount > 0 && (
                                        <button className="notif-mark-all" onClick={handleMarkAllRead}>Mark all read</button>
                                    )}
                                </div>
                                <div className="notif-dropdown-list">
                                    {notifications.length === 0 ? (
                                        <div className="notif-empty">No notifications yet</div>
                                    ) : (
                                        notifications.slice(0, 10).map(n => (
                                            <div
                                                key={n.notificationId}
                                                className={`notif-item ${!n.isRead ? 'notif-item--unread' : ''}`}
                                                onClick={() => handleMarkAsRead(n.notificationId)}
                                            >
                                                <div className="notif-item-icon">
                                                    {n.type === 'COURSE_ASSIGNMENT' ? '📚' : '🔔'}
                                                </div>
                                                <div className="notif-item-body">
                                                    <p className="notif-item-msg">{n.message}</p>
                                                    <span className="notif-item-time">{formatTime(n.createdAt)}</span>
                                                </div>
                                                {!n.isRead && <span className="notif-item-dot" />}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="navbar-profile" ref={profileRef}>
                        <button
                            className="navbar-profile-avatar-btn"
                            onClick={() => setShowProfile(!showProfile)}
                            aria-label="Profile menu"
                            title="Profile"
                        >
                            {user?.username.charAt(0).toUpperCase()}
                        </button>

                        {showProfile && user && (
                            <div className="profile-overlay">
                                <div className="profile-header">
                                    <div className="profile-avatar">
                                        {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="profile-info">
                                        <h3 className="profile-name">{user.username}</h3>
                                        <p className="profile-role">{user.roleName}</p>
                                    </div>
                                </div>
                                <div className="profile-details">
                                    <div className="profile-detail-item">
                                        <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                            <polyline points="22,6 12,13 2,6" />
                                        </svg>
                                        <span>{user.email}</span>
                                    </div>
                                </div>
                                <button className="profile-change-pwd-btn" onClick={() => { setShowProfile(false); setShowChangePwd(true); }}>
                                    🔐 Change Password
                                </button>
                                <button className="profile-logout-btn" onClick={handleLogout}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
