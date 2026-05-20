import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { tokenstore } from '../../auth/tokenstore';
import { notificationApi } from '../../services/notification.api';
import { useNavbarAction } from '../../contexts/NavbarActionContext';
import type { NotificationResponse } from '../../types/notification.types';
import '../../css/Common/Navbar.css';

const NOTIFICATION_DISABLED_ROLES = new Set(['TA_MANAGER', 'HIRING_MANAGER', 'TA_HEAD']);

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Welcome back' },
  '/ta-recruiter/dashboard': { title: 'Dashboard', subtitle: 'Welcome back' },
  '/ta-recruiter/institutes': { title: 'Institutes Management', subtitle: 'Manage and view all registered institutes' },
  '/ta-recruiter/candidates': { title: 'Candidates', subtitle: 'Manage and view all candidates' },
  '/ta-recruiter/hiring-cycles': { title: 'Hiring Cycle', subtitle: 'Manage hiring cycles' },
  '/ta-recruiter/drive-calendar': { title: 'Hiring Calendar', subtitle: 'View and manage hiring calendar' },
  '/ta-recruiter/drive-schedules/add': { title: 'Schedule New Drive', subtitle: 'Create a new drive schedule' },
  '/ta-recruiter/send-email': { title: 'Send Email', subtitle: 'Compose and send email to recipients' },
  '/ta-recruiter/documents': { title: 'Document Processing', subtitle: 'Manage candidate documents and offers' },
  '/ta-recruiter/academy': { title: 'Academy', subtitle: 'Manage training programs, courses, and intern progress' },
  '/ta-recruiter/settings': { title: 'Manage', subtitle: 'Settings and configurations' },
  '/ta-recruiter/settings/skills': { title: 'Skills Management', subtitle: 'Manage technical and soft skills' },
  '/ta-recruiter/settings/eligibility': { title: 'Eligibility Management', subtitle: 'Define and configure candidate eligibility criteria' },
  '/ta-recruiter/settings/round-templates': { title: 'Round Template Management', subtitle: 'Create and manage interview round templates' },
  '/ta-recruiter/settings/email-templates': { title: 'Email Template Management', subtitle: 'Manage email templates for candidate communication' },
  '/ta-head/settings/skills': { title: 'Skills Management', subtitle: 'Manage technical and soft skills' },
  '/ta-head/settings/eligibility': { title: 'Eligibility Management', subtitle: 'Define and configure candidate eligibility criteria' },
  '/ta-head/settings/round-templates': { title: 'Round Template Management', subtitle: 'Create and manage interview round templates' },
  '/ta-head/settings/email-templates': { title: 'Email Template Management', subtitle: 'Manage email templates for candidate communication' },
  '/drive-process/drive-cycle': { title: 'Drive Dashboard', subtitle: 'Manage drive cycles' },
  '/drive-process/drive-list': { title: 'Drive List', subtitle: 'All drives for the selected cycle' },
  '/drive-process/drive-details': { title: 'Drive Details', subtitle: 'Analytics and overview for this drive' },
  '/drive-process/drive-candidates': { title: 'Drive Candidates', subtitle: 'Candidates assigned to this drive' },
  '/drive-process/panel-allocation': { title: 'Panel Allocation', subtitle: 'Assign panel members to candidates' },
  '/drive-process/application-history': { title: 'Application History', subtitle: 'Candidate drive and evaluation history' },
  '/ta-head/dashboard': { title: 'Dashboard', subtitle: 'Welcome back' },
  '/ta-head/hiring-cycles': { title: 'Hiring Cycle', subtitle: 'Manage hiring cycles' },
  '/ta-head/hiring-demands': { title: 'Demand Details', subtitle: 'Review hiring demand' },
  '/ta-head/academy': { title: 'Academy Dashboard', subtitle: 'Academy management' },
  '/ta-head/settings': { title: 'Requests', subtitle: 'Manage pending requests' },
  '/hiring-manager/dashboard': { title: 'Dashboard', subtitle: 'Welcome back' },
  '/hiring-manager/hiring-cycles': { title: 'Hiring Cycle', subtitle: 'Manage hiring cycles' },
  '/hiring-manager/hiring-demands': { title: 'Demand Details', subtitle: 'View and manage hiring demand' },
  '/hiring-manager/requests': { title: 'Requests', subtitle: 'Manage hiring requests' },
  '/admin/dashboard': { title: 'Dashboard', subtitle: 'System administration' },
  '/admin/users': { title: 'Users', subtitle: 'Manage system users' },
  '/admin/manage': { title: 'Manage Users', subtitle: 'View and manage all users' },
  '/admin/settings': { title: 'Settings', subtitle: 'System settings' },
  '/members/dashboard': { title: 'Dashboard', subtitle: 'Welcome back' },
  '/members/panel-assignments': { title: 'My Assignments', subtitle: 'Assignments waiting for your evaluation' },
  '/members/panel-scoring': { title: 'Panel Scoring', subtitle: 'Evaluate candidate performance' },
  '/members/panel-history': { title: 'Allocation History', subtitle: 'View your past panel assignments' },
  // Training Coordinator
  '/training-coordinator/dashboard': { title: 'Dashboard', subtitle: 'Training overview and quick actions' },
  '/training-coordinator/academy': { title: 'Academy', subtitle: 'Manage attendance, scores, and interns' },
  // Intern
  '/intern/dashboard': { title: 'Dashboard', subtitle: 'Your training overview' },
  '/intern/scores': { title: 'My Scores', subtitle: 'View your course scores and leaderboard' },
  '/intern/progress': { title: 'My Progress', subtitle: 'Track your training journey' },
  '/intern/calendar': { title: 'Calendar', subtitle: 'View schedule and events' },
  '/intern/certificates': { title: 'Certificates', subtitle: 'Upload and manage your certificates' },
  '/intern/profile': { title: 'My Profile', subtitle: 'Update your profile and links' },
  '/intern/leaves': { title: 'Leave Requests', subtitle: 'Apply and track your leave requests' },
  '/intern/warnings': { title: 'Notices', subtitle: 'View and acknowledge notices' },
};

interface NavbarProps {
    onMobileMenuToggle?: () => void;
}

function formatTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function Navbar({ onMobileMenuToggle }: NavbarProps) {
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const location = useLocation();
    const user = tokenstore.getUser();
    const { action } = useNavbarAction();
    const [theme, setTheme] = useState<'light' | 'dark'>(tokenstore.getTheme());
    const shouldDisableNotifications = user?.roleName ? NOTIFICATION_DISABLED_ROLES.has(user.roleName) : false;
    const visibleNotifications = shouldDisableNotifications ? [] : notifications;

    const isSettingsSubPage = [
        '/ta-recruiter/settings/skills',
        '/ta-recruiter/settings/eligibility',
        '/ta-recruiter/settings/round-templates',
        '/ta-recruiter/settings/email-templates',
        '/ta-head/settings/skills',
        '/ta-head/settings/eligibility',
        '/ta-head/settings/round-templates',
        '/ta-head/settings/email-templates',
    ].includes(location.pathname);
    const showBackBtn = location.pathname.startsWith('/ta-recruiter/institutes/')
        || isSettingsSubPage
        || location.pathname === '/ta-recruiter/drive-schedules/add'
        || location.pathname === '/ta-recruiter/send-email'
        || location.pathname.startsWith('/drive-process/drive-list/')
        || location.pathname.startsWith('/drive-process/drive-details/')
        || location.pathname.startsWith('/drive-process/drive-candidates/')
        || location.pathname.startsWith('/drive-process/panel-allocation/')
        || location.pathname === '/drive-process/application-history'
        || location.pathname === '/members/panel-scoring'
        || location.pathname.startsWith('/ta-head/hiring-cycles/')
        || location.pathname.startsWith('/ta-head/hiring-demands/')
        || location.pathname.startsWith('/hiring-manager/hiring-cycles/')
        || location.pathname.startsWith('/hiring-manager/hiring-demands/')
        || location.pathname.startsWith('/ta-recruiter/hiring-cycles/');

    const unreadCount = visibleNotifications.filter(n => !n.isRead).length;

    const getPageInfo = () => {
        const path = location.pathname;
        if (PAGE_TITLES[path]) return PAGE_TITLES[path];
        // Check for 3-segment paths like /ta-recruiter/settings/skills
        const base3 = '/' + path.split('/').slice(1, 4).join('/');
        if (PAGE_TITLES[base3]) return PAGE_TITLES[base3];
        // Check for 2-segment paths like /ta-recruiter/institutes/:id
        const base2 = '/' + path.split('/').slice(1, 3).join('/');
        if (PAGE_TITLES[base2]) return PAGE_TITLES[base2];
        return { title: 'Springer', subtitle: '' };
    };

    const { title, subtitle } = getPageInfo();

    useEffect(() => {
        if (!user?.userId || shouldDisableNotifications) return;

        (async () => {
            try {
                const res = await notificationApi.getNotifications(user.userId);
                if (res.success && res.data) setNotifications(res.data);
            } catch { /* silent */ }
        })();
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
    }, [shouldDisableNotifications, user?.userId]);

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

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        tokenstore.setTheme(newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-left">
                    {onMobileMenuToggle && (
                        <button className="navbar-hamburger" onClick={onMobileMenuToggle} aria-label="Open menu">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    )}
                    {showBackBtn && (
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

                    {/* Page Action Button (from NavbarActionContext) */}
                    {action && (
                        <button className="navbar-action-btn" onClick={action.onClick}>
                            {action.icon && <span className="navbar-action-btn-icon">{action.icon}</span>}
                            {action.label}
                        </button>
                    )}

                    {/* Portal target for page-level actions (e.g. cycle selector) */}
                    <div id="navbar-actions-slot" />

                    {/* Notification Bell */}
                    <div className="navbar-notif" ref={notifRef}>
                        <button
                            className="navbar-icon-btn"
                            aria-label="Notifications"
                            onClick={() => {
                                if (shouldDisableNotifications) return;
                                setShowNotifications(!showNotifications);
                            }}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                            )}
                        </button>

                        {!shouldDisableNotifications && showNotifications && (
                            <div className="notif-dropdown">
                                <div className="notif-dropdown-header">
                                    <span className="notif-dropdown-title">Notifications</span>
                                    {unreadCount > 0 && (
                                        <button className="notif-mark-all" onClick={handleMarkAllRead}>Mark all read</button>
                                    )}
                                </div>
                                <div className="notif-dropdown-list">
                                    {visibleNotifications.length === 0 ? (
                                        <div className="notif-empty">No notifications yet</div>
                                    ) : (
                                        visibleNotifications.slice(0, 10).map(n => (
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

                    <button
                        className="navbar-icon-btn navbar-theme-btn"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
                    >
                        {theme === 'light' ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="5" />
                                <line x1="12" y1="1" x2="12" y2="3" />
                                <line x1="12" y1="21" x2="12" y2="23" />
                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                <line x1="1" y1="12" x2="3" y2="12" />
                                <line x1="21" y1="12" x2="23" y2="12" />
                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
