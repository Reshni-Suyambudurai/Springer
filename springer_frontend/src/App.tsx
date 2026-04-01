import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// TA Recruiter
import DashboardTAR from './components/TA_Recruiter/DashboardTAR'
import TARHiringCycleList from './components/TA_Head/HiringCycle/HiringCycleList'
import TARHiringCycleDetails from './components/TA_Head/HiringCycle/HiringCycleDetails'
import InstitutesList from './components/TA_Recruiter/Institutes/InstitutesList'
import InstitutesDetails from './components/TA_Recruiter/Institutes/InstitutesDetails'
import AddInstitute from './components/TA_Recruiter/Institutes/AddInstitute'
import CandidateList from './components/TA_Recruiter/Candidates/CandidateList'
import CandidateDetails from './components/TA_Recruiter/Candidates/CandidateDetails'
import AddCandidates from './components/TA_Recruiter/Candidates/AddCandidates'

// Settings
import Settings from './components/TA_Recruiter/Settings/Settings'
import DocumentsManagement from './components/TA_Recruiter/Settings/DocumentsManagement'
import EligibilityManagement from './components/TA_Recruiter/Settings/EligibilityManagement'
import RoundTemplateManagement from './components/TA_Recruiter/Settings/RoundTemplateManagement'
import SkillsManagement from './components/TA_Recruiter/Settings/SkillsManagement'

// Drive + Schedule
import DriveCalendar from './components/TA_Recruiter/DriveSchedule/DriveCalendar'
import AddSchedule from './components/TA_Recruiter/DriveSchedule/AddSchedule'

// 🔥 Your existing Drive Process (kept)
import DriveCycle from './components/TA_Recruiter/DriveProcess/DriveCycle'
import DriveList from './components/TA_Recruiter/DriveProcess/DriveList'
import DriveDetails from './components/TA_Recruiter/DriveProcess/DriveDetails'
import DriveCandidates from './components/TA_Recruiter/DriveProcess/DriveCandidates'

// Document Processing
import DocumentProcessingDashboard from './components/TA_Recruiter/DocumentProcessing/DocumentProcessingDashboard'

// Academy
import TrainingCoordinatorDashboard from './components/Academy/TrainingCoordinator/TrainingCoordinatorDashboard'
import AcademyDashboard from './components/Academy/TrainingCoordinator/AcademyDashboard'
// TA Head
import DashboardTAH from './components/TA_Head/DashboardTAH'
import TAHiringCycleList from './components/TA_Head/HiringCycle/HiringCycleList'
import TAHiringCycleDetails from './components/TA_Head/HiringCycle/HiringCycleDetails'
import TAHiringDemandDetails from './components/TA_Head/HiringCycle/HiringDemandDetails'

// Hiring Manager
import DashboardHM from './components/HiringManager/DashboardHM'
import HiringCycleList from './components/HiringManager/HiringCycle/HiringCycleList'
import HiringCycleDetails from './components/HiringManager/HiringCycle/HiringCycleDetails'
import AddHiringDemand from './components/HiringManager/HiringDemand/AddHiringDemand'
import HiringDemandDetails from './components/HiringManager/HiringDemand/HiringDemandDetails'

// Panel
import DashboardPM from './components/Panel_Member/DashboardPM'

// Admin
import AdminDashboard from './components/Admin/AdminDashboard'

// Common
import ProtectedRoute from './auth/ProtectedRoutes'
import DashboardLayout from './components/Common/DashboardLayout'
import LoginRedirect from './components/Authentication/LoginRedirect'
import { tokenstore } from './auth/tokenstore'

// Pages
import DocumentSubmitPage from './pages/DocumentSubmitPage'
import Page404 from './pages/Page404'
import Unauthorized from './pages/Unauthorized'

import './App.css'

function App() {

  useEffect(() => {
    const savedTheme = tokenstore.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  return (
    <Routes>

      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Public */}
      <Route path="/login" element={<LoginRedirect />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/documents/submit" element={<DocumentSubmitPage />} />

      <Route element={<DashboardLayout />}>

        {/* TA_HEAD */}
        <Route element={<ProtectedRoute allowedRoles={['TA_HEAD']} />}>
          <Route path="/ta-head/dashboard" element={<DashboardTAH />} />
          <Route path="/ta-head/hiring-cycles" element={<TAHiringCycleList />} />
          <Route path="/ta-head/hiring-cycles/:cycleId" element={<TAHiringCycleDetails />} />
          <Route path="/ta-head/hiring-demands/:demandId" element={<TAHiringDemandDetails />} />
          <Route path="/ta-head/drive-calendar" element={<DriveCalendar />} />
          <Route path="/ta-head/academy" element={<AcademyDashboard />} />
          <Route path="/ta-head/settings" element={<Settings />} />
          <Route path="/ta-head/settings/documents" element={<DocumentsManagement />} />
          <Route path="/ta-head/settings/eligibility" element={<EligibilityManagement />} />
          <Route path="/ta-head/settings/round-templates" element={<RoundTemplateManagement />} />
          <Route path="/ta-head/settings/skills" element={<SkillsManagement />} />
        </Route>

        {/* TA_RECRUITER */}
        <Route element={<ProtectedRoute allowedRoles={['TA_RECRUITER']} />}>
          <Route path="/ta-recruiter/dashboard" element={<DashboardTAR />} />
          <Route path="/ta-recruiter/hiring-cycles" element={<TARHiringCycleList />} />
          <Route path="/ta-recruiter/hiring-cycles/:cycleId" element={<TARHiringCycleDetails />} />
          <Route path="/ta-recruiter/institutes" element={<InstitutesList />} />
          <Route path="/ta-recruiter/institutes/add" element={<AddInstitute />} />
          <Route path="/ta-recruiter/institutes/:instituteId" element={<InstitutesDetails />} />

          <Route path="/ta-recruiter/candidates" element={<CandidateList />} />
          <Route path="/ta-recruiter/candidates/add" element={<AddCandidates />} />
          <Route path="/ta-recruiter/candidates/:id" element={<CandidateDetails />} />
          <Route path="/ta-recruiter/documents" element={<DocumentProcessingDashboard />} />
          <Route path="/ta-recruiter/academy" element={<AcademyDashboard />} />
          <Route path="/ta-recruiter/drive-calendar" element={<DriveCalendar />} />
          <Route path="/ta-recruiter/drive-schedules/add" element={<AddSchedule />} />

          {/* 🔥 Your Drive Process */}
          <Route path="/drive-process/drive-cycle" element={<DriveCycle />} />
          <Route path="/drive-process/drive-list/:cycleId" element={<DriveList />} />
          <Route path="/drive-process/drive-details/:driveId" element={<DriveDetails />} />
          <Route path="/drive-process/drive-candidates/:driveId" element={<DriveCandidates />} />

          {/* Settings */}
          <Route path="/ta-recruiter/settings" element={<Settings />} />
          <Route path="/ta-recruiter/settings/documents" element={<DocumentsManagement />} />
          <Route path="/ta-recruiter/settings/eligibility" element={<EligibilityManagement />} />
          <Route path="/ta-recruiter/settings/round-templates" element={<RoundTemplateManagement />} />
          <Route path="/ta-recruiter/settings/skills" element={<SkillsManagement />} />
        </Route>

        {/* HIRING_MANAGER */}
        <Route element={<ProtectedRoute allowedRoles={['HIRING_MANAGER']} />}>
          <Route path="/hiring-manager/dashboard" element={<DashboardHM />} />
          <Route path="/hiring-manager/hiring-cycles" element={<HiringCycleList />} />
          <Route path="/hiring-manager/hiring-cycles/:cycleId" element={<HiringCycleDetails />} />
          <Route path="/hiring-manager/hiring-demands/add" element={<AddHiringDemand />} />
          <Route path="/hiring-manager/hiring-demands/:demandId" element={<HiringDemandDetails />} />
        </Route>

        {/* MEMBERS */}
        <Route element={<ProtectedRoute allowedRoles={['MEMBERS']} />}>
          <Route path="/members/dashboard" element={<DashboardPM />} />
        </Route>

        {/* ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={['SYSTEM_ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>

        {/* TRAINING_COORDINATOR */}
        <Route element={<ProtectedRoute allowedRoles={['TRAINING_COORDINATOR']} />}>
          <Route path="/training-coordinator/dashboard" element={<TrainingCoordinatorDashboard />} />
          <Route path="/training-coordinator/academy" element={<AcademyDashboard />} />
        </Route>

      </Route>

      <Route path="*" element={<Page404 />} />

    </Routes>
  )
}

export default App