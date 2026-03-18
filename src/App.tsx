import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardTAR from './components/TA_Recruiter/DashboardTAR'
import Page404 from './pages/Page404'
import Unauthorized from './pages/Unauthorized'
import DashboardHM from './components/HiringManager/DashboardHM'
import DashboardPM from './components/Panel_Member/DashboardPM'
import DashboardTAH from './components/TA_Head/DashboardTAH'
import AdminDashboard from './components/Admin/AdminDashboard'
import ProtectedRoute from './auth/ProtectedRoutes'
import DashboardLayout from './components/Common/DashboardLayout'
import LoginRedirect from './components/Authentication/LoginRedirect'
import './App.css'

function App() {
  return (
    <Routes>
      {/* Default route - redirect to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      
      {/* Public routes */}
      <Route path="/login" element={<LoginRedirect />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
       <Route element={<DashboardLayout />}>
      {/* Protected routes for TA_HEAD */}
      <Route element={<ProtectedRoute allowedRoles={['TA_HEAD']} />}>
        <Route path="/ta-head/dashboard" element={<DashboardTAH />} />
      </Route>
      
      {/* Protected routes for TA_RECRUITER */}
      <Route element={<ProtectedRoute allowedRoles={['TA_RECRUITER']} />}>
        <Route path="/ta-recruiter/dashboard" element={<DashboardTAR />} />
      </Route>
      
      {/* Protected routes for HIRING_MANAGER */}
      <Route element={<ProtectedRoute allowedRoles={['HIRING_MANAGER']} />}>
        <Route path="/hiring-manager/dashboard" element={<DashboardHM />} />
      </Route>
      
      {/* Protected routes for MEMBERS */}
      <Route element={<ProtectedRoute allowedRoles={['MEMBERS']} />}>
        <Route path="/members/dashboard" element={<DashboardPM />} />
      </Route>
      
      {/* Protected routes for SYSTEM_ADMIN */}
      <Route element={<ProtectedRoute allowedRoles={['SYSTEM_ADMIN']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>
      </Route>
      {/* 404 Not Found */}
      <Route path="*" element={<Page404 />} />
    </Routes>
  )
}

export default App
