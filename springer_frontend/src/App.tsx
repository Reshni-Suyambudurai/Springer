import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardTAR from './components/TA_Recruiter/DashboardTAR'
import InstitutesList from './components/TA_Recruiter/Institutes/InstitutesList'
import InstitutesDetails from './components/TA_Recruiter/Institutes/InstitutesDetails'
import AddInstitute from './components/TA_Recruiter/Institutes/AddInstitute'
import CandidateList from './components/TA_Recruiter/Candidates/CandidateList'
import CandidateDetails from './components/TA_Recruiter/Candidates/CandidateDetails'
import Page404 from './pages/Page404'
import Unauthorized from './pages/Unauthorized'
import DashboardHM from './components/HiringManager/DashboardHM'
import DashboardPM from './components/Panel_Member/DashboardPM'
import DashboardTAH from './components/TA_Head/DashboardTAH'
import AdminDashboard from './components/Admin/AdminDashboard'
import ProtectedRoute from './auth/ProtectedRoutes'
import DashboardLayout from './components/Common/DashboardLayout'
import LoginRedirect from './components/Authentication/LoginRedirect'
import AddCandidates from './components/TA_Recruiter/Candidates/AddCandidates'
import Settings from './components/TA_Recruiter/Settings/Settings'
import DocumentsManagement from './components/TA_Recruiter/Settings/DocumentsManagement'
import EligibilityManagement from './components/TA_Recruiter/Settings/EligibilityManagement'
import RoundTemplateManagement from './components/TA_Recruiter/Settings/RoundTemplateManagement'
import SkillsManagement from './components/TA_Recruiter/Settings/SkillsManagement'
import TrainingCoordinatorDashboard from './components/Academy/TrainingCoordinator/TrainingCoordinatorDashboard'
import DriveCalendar from './components/TA_Recruiter/DriveSchedule/DriveCalendar'
import AddSchedule from './components/TA_Recruiter/DriveSchedule/AddSchedule'
import DriveCycle from './components/TA_Recruiter/DriveProcess/DriveCycle'
import DriveList from './components/TA_Recruiter/DriveProcess/DriveList'
import DriveCandidates from './components/TA_Recruiter/DriveProcess/DriveCandidates'
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
        <Route path="/ta-recruiter/institutes" element={<InstitutesList />} />
        <Route path="/ta-recruiter/institutes/add" element={<AddInstitute />} />
        <Route path="/ta-recruiter/institutes/:instituteId" element={<InstitutesDetails />} />
        <Route path="/ta-recruiter/candidates" element={<CandidateList />} />
        <Route path="/ta-recruiter/candidates/add" element={<AddCandidates />} />
        <Route path="/ta-recruiter/candidates/:id" element={<CandidateDetails />} />
        <Route path="/ta-recruiter/settings" element={<Settings />} />
        <Route path="/ta-recruiter/settings/documents" element={<DocumentsManagement />} />
        <Route path="/ta-recruiter/settings/eligibility" element={<EligibilityManagement />} />
        <Route path="/ta-recruiter/settings/round-templates" element={<RoundTemplateManagement />} />
        <Route path="/ta-recruiter/settings/skills" element={<SkillsManagement />} />
        <Route path="/ta-recruiter/drive-calendar" element={<DriveCalendar />} />
        <Route path="/ta-recruiter/drive-schedules/add" element={<AddSchedule />} />
        <Route path="/drive-process/drive-cycle" element={<DriveCycle />} />
        <Route path="/drive-process/drive-list/:cycleId" element={<DriveList />} />
        <Route path="/drive-process/drive-candidates/:driveId" element={<DriveCandidates />} />
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

       {/* Protected routes for TRAINING_COORDINATOR */}
      <Route element={<ProtectedRoute allowedRoles={['TRAINING_COORDINATOR']} />}>
        <Route path="/training-coordinator/dashboard" element={<TrainingCoordinatorDashboard />} />
      </Route>

      </Route>
      {/* 404 Not Found */}
      <Route path="*" element={<Page404 />} />
    </Routes>
    
  )
}

export default App
