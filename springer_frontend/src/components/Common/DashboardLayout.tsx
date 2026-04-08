import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import "../../css/Common/DashboardLayout.css";

function DashboardLayout() {
  return (
    <div className="layout">
      <Navbar />
      <Sidebar />
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
