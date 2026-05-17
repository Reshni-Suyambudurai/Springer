import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// TA Manager
import DashboardTAR from './components/TA_Recruiter/DashboardTAR'
import TARHiringCycleList from './components/TA_Recruiter/HiringCycle/HiringCycleList'
import TARHiringCycleDetails from './components/TA_Recruiter/HiringCycle/HiringCycleDetails'
import InstitutesList from './components/TA_Recruiter/Institutes/InstitutesList'
import InstitutesDetails from './components/TA_Recruiter/Institutes/InstitutesDetails'
import AddInstitute from './components/TA_Recruiter/Institutes/AddInstitute'
import CandidateList from './components/TA_Recruiter/Candidates/CandidateList'
import CandidatesHistory from './components/TA_Recruiter/Candidates/CandidatesHistory'
import CandidateDetails from './components/TA_Recruiter/Candidates/CandidateDetails'
import AddCandidates from './components/TA_Recruiter/Candidates/AddCandidates'
import Form from './components/TA_Recruiter/Candidates/Form'
import PublicCandidateRegistration from './components/TA_Recruiter/Candidates/PublicCandidateRegistration'

// Settings
import Settings from './components/TA_Recruiter/Settings/Settings'
import EmailTemplateManagement from './components/TA_Recruiter/Settings/EmailTemplateManagement'
import EligibilityManagement from './components/TA_Recruiter/Settings/EligibilityManagement'
import RoundTemplateManagement from './components/TA_Recruiter/Settings/RoundTemplateManagement'
import SkillsManagement from './components/TA_Recruiter/Settings/SkillsManagement'

// Drive + Schedule
import DriveCalendar from './components/TA_Recruiter/DriveSchedule/DriveCalendar'
import AddSchedule from './components/TA_Recruiter/DriveSchedule/AddSchedule'

//  Your existing Drive Process (kept)
import DriveCycle from './components/TA_Recruiter/DriveProcess/DriveCycle'
import DriveList from './components/TA_Recruiter/DriveProcess/DriveList'
import DriveDetails from './components/TA_Recruiter/DriveProcess/DriveDetails'
import DriveCandidates from './components/TA_Recruiter/DriveProcess/DriveCandidates'
import PanelAllocation from './components/TA_Recruiter/DriveProcess/PanelAllocation'
import AddRound1 from './components/TA_Recruiter/DriveProcess/AddScores/AddRound1'

import ApplicationHistory from './components/TA_Recruiter/DriveProcess/ApplicationHistory'

// Document Processing
import DocumentProcessingDashboard from './components/TA_Recruiter/DocumentProcessing/DocumentProcessingDashboard'

// Academy
import TrainingCoordinatorDashboard from './components/Academy/TrainingCoordinator/TrainingCoordinatorDashboard'
import AcademyDashboard from './components/Academy/TrainingCoordinator/AcademyDashboard'
import InternDashboard from './components/Academy/Intern/InternDashboard'
import InternScoresPage from './components/Academy/Intern/InternScoresPage'
import InternAttendancePage from './components/Academy/Intern/InternAttendancePage'
import InternProgressPage from './components/Academy/Intern/InternProgressPage'
import InternCertificatesPage from './components/Academy/Intern/InternCertificatesPage'
import InternProfilePage from './components/Academy/Intern/InternProfilePage'
import InternCalendarPage from './components/Academy/Intern/InternCalendarPage'
import InternLeavePage from './components/Academy/Intern/InternLeavePage'
import InternWarningsPage from './components/Academy/Intern/InternWarningsPage'
// TA Head
import TAHiringCycleList from './components/TA_Head/HiringCycle/HiringCycleList'
import TAHiringCycleDetails from './components/TA_Head/HiringCycle/HiringCycleDetails'
import TAHiringDemandDetails from './components/TA_Head/HiringCycle/HiringDemandDetails'

// Hiring Manager
import HiringCycleList from './components/HiringManager/HiringCycle/HiringCycleList'
import HiringCycleDetails from './components/HiringManager/HiringCycle/HiringCycleDetails'
import AddHiringDemand from './components/HiringManager/HiringDemand/AddHiringDemand'
import HiringDemandDetails from './components/HiringManager/HiringDemand/HiringDemandDetails'

// Panel
import PanelAssignments from './components/Panel_Member/PanelAllocation'
import PanelScoring from './components/Panel_Member/PanelScoring'
import AllocationHistory from './components/Panel_Member/AllocationHistory'

// Admin
import AdminDashboard from './components/Admin/AdminDashboard'
import AddUsers from './components/Admin/AddUsers'
import Manage from './components/Admin/Manage'

// Common
import ProtectedRoute from './auth/ProtectedRoutes'
import DashboardLayout from './components/Common/DashboardLayout'
import LoginRedirect from './components/Authentication/LoginRedirect'
import SendEmail from './components/Common/SendEmail'
import { tokenstore } from './auth/tokenstore'

// Pages
import DocumentSubmitPage from './pages/DocumentSubmitPage'
import Page404 from './pages/Page404'
import Unauthorized from './pages/Unauthorized'

import InternLayout from './components/Academy/Intern/InternLayout'
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
      <Route path="/kanini-reg/:driveName/:formName/:formId" element={<PublicCandidateRegistration />} />

      <Route element={<DashboardLayout />}>

        {/* TA_HEAD */}
        <Route element={<ProtectedRoute allowedRoles={['TA_HEAD']} />}>
          <Route path="/ta-head/dashboard" element={<DashboardTAR />} />
          <Route path="/ta-head/hiring-cycles" element={<TAHiringCycleList />} />
          <Route path="/ta-head/hiring-cycles/:cycleId" element={<TAHiringCycleDetails />} />
          <Route path="/ta-head/hiring-demands/:demandId" element={<TAHiringDemandDetails />} />
          <Route path="/ta-head/drive-calendar" element={<DriveCalendar />} />
          <Route path="/ta-head/academy" element={<AcademyDashboard />} />
          <Route path="/ta-head/settings" element={<Settings />} />
          <Route path="/ta-head/settings/email-templates" element={<EmailTemplateManagement />} />
          <Route path="/ta-head/settings/eligibility" element={<EligibilityManagement />} />
          <Route path="/ta-head/settings/round-templates" element={<RoundTemplateManagement />} />
          <Route path="/ta-head/settings/skills" element={<SkillsManagement />} />
          <Route path="/ta-head/drive-analytics" element={<DashboardTAR />} />
        </Route>

        {/* TA_MANAGER */}
        <Route element={<ProtectedRoute allowedRoles={['TA_MANAGER']} />}>
          <Route path="/ta-recruiter/dashboard" element={<DashboardTAR />} />
          <Route path="/ta-recruiter/hiring-cycles" element={<TARHiringCycleList />} />
          <Route path="/ta-recruiter/hiring-cycles/:cycleId" element={<TARHiringCycleDetails />} />
          <Route path="/ta-recruiter/institutes" element={<InstitutesList />} />
          <Route path="/ta-recruiter/institutes/add" element={<AddInstitute />} />
          <Route path="/ta-recruiter/institutes/:instituteId" element={<InstitutesDetails />} />

          <Route path="/ta-recruiter/candidates" element={<CandidateList />} />
          <Route path="/ta-recruiter/candidates/history" element={<CandidatesHistory />} />
          <Route path="/ta-recruiter/candidates/add" element={<AddCandidates />} />
          <Route path="/ta-recruiter/forms" element={<Form />} />
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
          <Route path="/drive-process/panel-allocation/:driveId" element={<PanelAllocation />} />
          <Route path="/drive-process/add-scores/:driveId/round1" element={<AddRound1 />} />

          <Route path="/drive-process/application-history" element={<ApplicationHistory />} />

          {/* Settings */}
          <Route path="/ta-recruiter/settings" element={<Settings />} />
          <Route path="/ta-recruiter/settings/email-templates" element={<EmailTemplateManagement />} />
          <Route path="/ta-recruiter/settings/eligibility" element={<EligibilityManagement />} />
          <Route path="/ta-recruiter/settings/round-templates" element={<RoundTemplateManagement />} />
          <Route path="/ta-recruiter/settings/skills" element={<SkillsManagement />} />
          <Route path="/ta-recruiter/send-email" element={<SendEmail />} />
        </Route>

        {/* HIRING_MANAGER */}
        <Route element={<ProtectedRoute allowedRoles={['HIRING_MANAGER']} />}>
          <Route path="/hiring-manager/hiring-cycles" element={<HiringCycleList />} />
          <Route path="/hiring-manager/hiring-cycles/:cycleId" element={<HiringCycleDetails />} />
          <Route path="/hiring-manager/hiring-demands/add" element={<AddHiringDemand />} />
          <Route path="/hiring-manager/hiring-demands/:demandId" element={<HiringDemandDetails />} />
        </Route>

        {/* MEMBERS */}
        <Route element={<ProtectedRoute allowedRoles={['MEMBERS']} />}>
          <Route path="/members/dashboard" element={<DashboardTAR />} />
          <Route path="/members/panel-assignments" element={<PanelAssignments />} />
          <Route path="/members/panel-scoring" element={<PanelScoring />} />
          <Route path="/members/panel-history" element={<AllocationHistory />} />
          <Route path="/members/drive-analytics" element={<DashboardTAR />} />
          <Route path="/members/academy" element={<AcademyDashboard />} />
        </Route>

        {/* ADMIN */}
        <Route element={<ProtectedRoute allowedRoles={['SYSTEM_ADMIN']} />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AddUsers />} />
          <Route path="/admin/manage" element={<Manage />} />
        </Route>

        {/* INTERN */}
        <Route element={<ProtectedRoute allowedRoles={['INTERN']} />}>
          <Route element={<InternLayout />}>
            <Route path="/intern/dashboard"     element={<InternDashboard />} />
            <Route path="/intern/scores"        element={<InternScoresPage />} />
            <Route path="/intern/attendance"    element={<InternAttendancePage />} />
            <Route path="/intern/progress"      element={<InternProgressPage />} />
            <Route path="/intern/certificates"  element={<InternCertificatesPage />} />
            <Route path="/intern/profile"       element={<InternProfilePage />} />
            <Route path="/intern/calendar"      element={<InternCalendarPage />} />
            <Route path="/intern/leaves"        element={<InternLeavePage />} />
            <Route path="/intern/warnings"      element={<InternWarningsPage />} />
          </Route>
        </Route>

        {/* TRAINING_COORDINATOR */}
        <Route element={<ProtectedRoute allowedRoles={['TRAINING_COORDINATOR']} />}>
          <Route path="/training-coordinator/dashboard" element={<TrainingCoordinatorDashboard />} />
          <Route path="/training-coordinator/academy" element={<AcademyDashboard />} />
        </Route>

        {/* HR_OPERATIONS — redirect to unauthorized (no dedicated dashboard yet) */}
        <Route element={<ProtectedRoute allowedRoles={['HR_OPERATIONS']} />}>
          <Route path="/hr-operations/dashboard" element={<Unauthorized />} />
        </Route>

        {/* BU_SPOC — redirect to unauthorized (no dedicated dashboard yet) */}
        <Route element={<ProtectedRoute allowedRoles={['BU_SPOC']} />}>
          <Route path="/bu-spoc/dashboard" element={<Unauthorized />} />
        </Route>

      </Route>

      <Route path="*" element={<Page404 />} />

    </Routes>
  )
}

export default App