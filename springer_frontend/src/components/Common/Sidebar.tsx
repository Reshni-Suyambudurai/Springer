import { useEffect, useState } from "react";
import { tokenstore } from "../../auth/tokenstore";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { MenuItem } from "../../types/sidebar";
import '../../css/Common/Sidebar.css';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [collapsedHoverEnabled, setCollapsedHoverEnabled] = useState(false);
  const [showCollapsedToggle, setShowCollapsedToggle] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const user = tokenstore.getUser();
  const location = useLocation();
  const navigate = useNavigate();
  const role = user?.roleName;

  const handleLogout = () => {
    tokenstore.clear();
    navigate('/login');
  };

  useEffect(() => {
    if (collapsed) {
      setCollapsedHoverEnabled(false);
      setShowCollapsedToggle(false);
      return;
    }
    setCollapsedHoverEnabled(false);
    setShowCollapsedToggle(false);
  }, [collapsed]);

  const menu: Record<string, MenuItem[]> = {

    TA_HEAD: [
      {
        name: "Dashboard",
        path: "/ta-head/dashboard",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        )
      },
      {
        name: "Hiring Cycle",
        path: "/ta-head/hiring-cycles",
        icon: (
          <img src="/hiring_lifeCycle.png" alt="Hiring Cycle" width="20" height="20" style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        )
      },
      {
        name: "Hiring Calendar",
        path: "/hiring-calendar",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        )
      },
      {
        name: "Academy Dashboard",
        path: "/ta-head/academy",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10L12 5 2 10l10 5 10-5z" />
            <path d="M6 12v5c3 2 9 2 12 0v-5" />
          </svg>
        )
      },
      {
        name: "Request",
        path: "/ta-head/settings",
        icon: (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="8" y="2" width="8" height="4" />
            <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
          </svg>
        )
      }
    ],

    TRAINING_COORDINATOR: [
      {
        name: "Dashboard",
        path: "/training-coordinator/dashboard",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        )
      },
      {
        name: "Academy",
        path: "/training-coordinator/academy",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10L12 5 2 10l10 5 10-5z" />
            <path d="M6 12v5c3 2 9 2 12 0v-5" />
          </svg>
        )
      },
    ],

    TA_MANAGER: [
      {
        name: "Dashboard",
        path: "/ta-recruiter/dashboard",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        )
      },
      {
        name: "Hiring Cycle",
        path: "/ta-recruiter/hiring-cycles",
        icon: (
          <img src="/hiring_lifeCycle.png" alt="Hiring Cycle" width="20" height="20" style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        )
      },
      {
        name: "Hiring Calendar",
        path: "/ta-recruiter/drive-calendar",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        )
      },
      {
        name: "Institutes",
        path: "/ta-recruiter/institutes",
        icon: (
          <img src="/Institute_Icon.svg" alt="Institutes" width="20" height="20" style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        )
      },
      {
        name: "Candidates",
        path: "/ta-recruiter/candidates",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="7" r="4" />
            <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
            <path d="M16 3.13a4 4 0 010 7.75" />
            <path d="M21 21v-2a4 4 0 00-3-3.85" />
          </svg>
        )
      },
      {
        name: "Drive Dashboard",
        path: "/drive-process/drive-cycle",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        )
      },
      {
        name: "Document Processing",
        path: "/ta-recruiter/documents",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="9" y1="13" x2="15" y2="13" />
            <line x1="9" y1="17" x2="15" y2="17" />
          </svg>
        )
      },
      {
        name: "Academy",
        path: "/ta-recruiter/academy",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10L12 5 2 10l10 5 10-5z" />
            <path d="M6 12v5c3 2 9 2 12 0v-5" />
            <line x1="12" y1="15" x2="12" y2="22" />
          </svg>
        )
      },
      {
        name: "Manage",
        path: "/ta-recruiter/settings",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
          </svg>
        )
      }
    ],

    HIRING_MANAGER: [
      {
        name: "Dashboard",
        path: "/hiring-manager/dashboard",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        )
      },
      {
        name: "Hiring Cycle",
        path: "/hiring-manager/hiring-cycles",
        icon: (
          <img src="/hiring_lifeCycle.png" alt="Hiring Cycle" width="20" height="20" style={{ objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
        )
      },
      {
        name: "Request",
        path: "/hiring-manager/requests",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="8" y="2" width="8" height="4" />
            <path d="M16 4h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h3" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <line x1="9" y1="16" x2="15" y2="16" />
          </svg>
        )
      }
    ],

    MEMBERS: [
      {
        name: "Dashboard",
        path: "/members/dashboard",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        )
      },
      {
        name: "Panel Allocation",
        path: "/members/panel-assignments",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-8 0v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        )
      },
      {
        name: "Panel History",
        path: "/members/panel-history",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-8 0v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        )
      },
      {
        name: "Academy Scoreboard",
        path: "/members/academy",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 10L12 5 2 10l10 5 10-5z" />
            <path d="M6 12v5c3 2 9 2 12 0v-5" />
            <line x1="12" y1="15" x2="12" y2="22" />
          </svg>
        )
      }

    ],

    SYSTEM_ADMIN: [
      {
        name: "Dashboard",
        path: "/admin/dashboard",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
        )
      },
      {
        name: "Users",
        path: "/admin/users",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-8 0v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )
      },
      {
        name: "Manage Users",
        path: "/admin/manage",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-8 0v2" />
            <circle cx="12" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 00-3-3.87" />
            <path d="M16 3.13a4 4 0 010 7.75" />
          </svg>
        )
      }
    ],

    INTERN: [
      {
        name: "Dashboard",
        path: "/intern/dashboard",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="13" width="7" height="7" rx="1" />
            <rect x="14" y="13" width="7" height="7" rx="1" />
          </svg>
        )
      },
      {
        name: "My Scores",
        path: "/intern/scores",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="4" />
            <line x1="12" y1="20" x2="12" y2="10" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
        )
      },
      {
        name: "My Progress",
        path: "/intern/progress",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        )
      },
      {
        name: "Calendar",
        path: "/intern/calendar",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        )
      },
      {
        name: "Certificates",
        path: "/intern/certificates",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="6" />
            <path d="M8.21 13.89L7 23l5-3 5 3-1.21-9.12" />
          </svg>
        )
      },
      {
        name: "My Profile",
        path: "/intern/profile",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )
      },
      {
        name: "Leave Requests",
        path: "/intern/leaves",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
            <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
          </svg>
        )
      },
      {
        name: "Notices",
        path: "/intern/warnings",
        icon: (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        )
      }
    ]
  };

  const links = menu[role as keyof typeof menu] || [];

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="sidebar-header">
        <div
          className={`sidebar-logo-hamburger-wrapper${showCollapsedToggle ? ' show-collapsed-toggle' : ''}`}
          onMouseEnter={() => {
            if (collapsed && collapsedHoverEnabled) {
              setShowCollapsedToggle(true);
            }
          }}
          onMouseLeave={() => {
            if (collapsed) {
              setCollapsedHoverEnabled(true);
              setShowCollapsedToggle(false);
            }
          }}
        >
          {collapsed ? (
            <>
              <div className="sidebar-logo sidebar-collapsed-logo">
                <img src="/Image (Springer).png" alt="Springer" className="sidebar-logo-img" />
              </div>
              <button className="sidebar-hamburger" onClick={onToggle} aria-label="Expand sidebar" tabIndex={0}>
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_3_2)">
                    <path d="M6.6683 19.5016V0.834961M17.1683 19.5016H3.1683C2.54946 19.5016 1.95596 19.2558 1.51838 18.8182C1.08079 18.3806 0.834961 17.7871 0.834961 17.1683V3.16829C0.834961 2.54946 1.08079 1.95596 1.51838 1.51838C1.95596 1.08079 2.54946 0.834961 3.1683 0.834961H17.1683C17.7871 0.834961 18.3806 1.08079 18.8182 1.51838C19.2558 1.95596 19.5016 2.54946 19.5016 3.16829V17.1683C19.5016 17.7871 19.2558 18.3806 18.8182 18.8182C18.3806 19.2558 17.7871 19.5016 17.1683 19.5016Z" stroke="#D1D5DC" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.8348 12.5016L12.5015 10.1683L14.8348 7.83496" stroke="#D1D5DC" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_3_2">
                      <rect width="21" height="21" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </button>
            </>
          ) : (
            <>
              <div className="sidebar-logo">
                <img src="/Image (Springer).png" alt="Springer" className="sidebar-logo-img" />
                <span className="sidebar-logo-text">SPRINGER</span>
              </div>
              <button className="sidebar-hamburger sidebar-hamburger-expanded" onClick={onToggle} aria-label="Collapse sidebar" tabIndex={0}>
                <svg width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_3_2)">
                    <path d="M6.6683 19.5016V0.834961M17.1683 19.5016H3.1683C2.54946 19.5016 1.95596 19.2558 1.51838 18.8182C1.08079 18.3806 0.834961 17.7871 0.834961 17.1683V3.16829C0.834961 2.54946 1.08079 1.95596 1.51838 1.51838C1.95596 1.08079 2.54946 0.834961 3.1683 0.834961H17.1683C17.7871 0.834961 18.3806 1.08079 18.8182 1.51838C19.2558 1.95596 19.5016 2.54946 19.5016 3.16829V17.1683C19.5016 17.7871 19.2558 18.3806 18.8182 18.8182C18.3806 19.2558 17.7871 19.5016 17.1683 19.5016Z" stroke="#D1D5DC" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14.8348 12.5016L12.5015 10.1683L14.8348 7.83496" stroke="#D1D5DC" strokeWidth="1.67" strokeLinecap="round" strokeLinejoin="round"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_3_2">
                      <rect width="21" height="21" fill="white"/>
                    </clipPath>
                  </defs>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`sidebar-link${location.pathname === item.path || location.pathname.startsWith(item.path + '/') ? ' active' : ''}`}
          >
            <span className="sidebar-icon">{item.icon}</span>
            {!collapsed && <span className="sidebar-text">{item.name}</span>}
          </Link>
        ))}
      </nav>
      <div className="sidebar-user" onClick={() => setShowUserMenu(!showUserMenu)} style={{ cursor: 'pointer' }}>
        {showUserMenu && (
          <div className="sidebar-user-popup">
            <div className="sidebar-user-popup-header">
              <span className="sidebar-user-popup-name">{user?.username}</span>
              <span className="sidebar-user-popup-role">{user?.roleName}</span>
            </div>
            <button className="sidebar-user-logout" onClick={(e) => { e.stopPropagation(); handleLogout(); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Logout
            </button>
          </div>
        )}
        <div className="sidebar-user-avatar">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        {!collapsed && (
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.username}</span>
            <span className="sidebar-user-role">{user?.roleName}</span>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
