import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tokenstore } from '../../auth/tokenstore';
import '../../css/Common/Navbar.css';

interface NavbarProps {
    onSidebarToggle?: () => void;
}

function Navbar({ onSidebarToggle }: NavbarProps) {
    const [showProfile, setShowProfile] = useState(false);
    const [theme, setTheme] = useState<'light' | 'dark'>(tokenstore.getTheme());
    const [notifications] = useState(0); // example unread count
    const profileRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    const user = tokenstore.getUser();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setShowProfile(false);
            }
        };

        if (showProfile) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfile]);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        tokenstore.setTheme(newTheme);
    };

    const handleLogout = () => {
        tokenstore.clear();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-content">
                <div className="navbar-left">
                    {onSidebarToggle && (
                        <button
                            className="hamburger-btn"
                            onClick={onSidebarToggle}
                            aria-label="Toggle sidebar"
                            title="Toggle sidebar"
                        >
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <line x1="3" y1="12" x2="21" y2="12" />
                                <line x1="3" y1="18" x2="21" y2="18" />
                            </svg>
                        </button>
                    )}
                    <div className="navbar-logo">
                        <span className="logo-icon">S</span>
                    </div>
                    <span className="navbar-title">Springer</span>
                </div>

                <div className="navbar-right">
                    <button
                        className="navbar-icon-btn"
                        onClick={toggleTheme}
                        aria-label="Toggle theme"
                        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
                    >
                        {theme === 'light' ? (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                            </svg>
                        ) : (
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
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

                    <button
                        className="navbar-icon-btn"
                        aria-label="Notifications"
                        title="Notifications"
                    >
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>

                        {notifications > 0 && (
                            <span className="notification-badge">{notifications}</span>
                        )}
                    </button>

                    <div className="navbar-profile" ref={profileRef}>
                        <button
                            className="navbar-icon-btn profile-btn"
                            onClick={() => setShowProfile(!showProfile)}
                            aria-label="Profile menu"
                            title="Profile"
                        >
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
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
                                <button className="profile-logout-btn" onClick={handleLogout}>
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
