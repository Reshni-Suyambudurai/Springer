import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "../../css/Common/DashboardLayout.css";

function DashboardLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const hideNavbar = location.pathname.startsWith('/ta-recruiter/candidates');

  const isMobile = () => window.innerWidth <= 768;

  const handleMobileToggle = () => setMobileOpen(prev => !prev);

  return (
    <div className={`layout${hideNavbar ? ' layout--candidates' : ''}`}>
      <div className={`layout-sidebar${sidebarCollapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
        <Sidebar collapsed={isMobile() ? false : sidebarCollapsed} onToggle={() => {
          if (isMobile()) {
            setMobileOpen(false);
          } else {
            setSidebarCollapsed(prev => !prev);
          }
        }} />
      </div>
      <div className={`layout-mobile-backdrop${mobileOpen ? ' visible' : ''}`} onClick={() => setMobileOpen(false)} />
      <div className="layout-main">
        {!hideNavbar && <Navbar onMobileMenuToggle={handleMobileToggle} />}
        <main className={`layout-content${hideNavbar ? ' layout-content--candidates' : ''}`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
