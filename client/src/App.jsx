import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Layouts
import ProtectedLayout, { RoleGuard } from './components/layouts/ProtectedLayout';
import PublicLayout from './components/layouts/PublicLayout';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Pages
import Dashboard from './pages/dashboard/Dashboard';
import SeekerProfile from './pages/profile/SeekerProfile';
import EmployerProfile from './pages/profile/EmployerProfile';
import ResumeManager from './pages/profile/ResumeManager';
import ChangePassword from './pages/profile/ChangePassword';
import CreateCompany from './pages/company/CreateCompany';
import CompanyProfile from './pages/company/CompanyProfile';
import JobSearch from './pages/jobs/JobSearch';
import JobDetail from './pages/jobs/JobDetail';
import ManageJobs from './pages/employer/ManageJobs';
import CreateJob from './pages/employer/CreateJob';
import ApplicationsBoard from './pages/employer/ApplicationsBoard';
import MyApplications from './pages/profile/MyApplications';
import Notifications from './pages/dashboard/Notifications';
import RecommendedJobs from './pages/jobs/RecommendedJobs';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageUsers from './pages/admin/ManageUsers';
import ManagePlatformJobs from './pages/admin/ManagePlatformJobs';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<Navigate to="/jobs" replace />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Public pages (guests see Sign in / Sign up, logged-in users see their menu) */}
        <Route element={<PublicLayout />}>
          <Route path="/jobs" element={<JobSearch />} />
          <Route path="/jobs/:slug" element={<JobDetail />} />
          <Route path="/companies/:slug" element={<CompanyProfile />} />
        </Route>

        {/* Logged-in pages */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Job seeker only */}
          <Route element={<RoleGuard roles={['JOB_SEEKER']} />}>
            <Route path="/recommended-jobs" element={<RecommendedJobs />} />
            <Route path="/profile/seeker" element={<SeekerProfile />} />
            <Route path="/profile/seeker/applications" element={<MyApplications />} />
            <Route path="/profile/seeker/resumes" element={<ResumeManager />} />
          </Route>

          {/* Employer only */}
          <Route element={<RoleGuard roles={['EMPLOYER']} />}>
            <Route path="/profile/employer" element={<EmployerProfile />} />
            <Route path="/company/create" element={<CreateCompany />} />
            <Route path="/company/edit" element={<CreateCompany />} />
            <Route path="/employer/jobs" element={<ManageJobs />} />
            <Route path="/employer/jobs/create" element={<CreateJob />} />
            <Route path="/employer/jobs/:id/edit" element={<CreateJob />} />
            <Route path="/employer/jobs/:jobId/applicants" element={<ApplicationsBoard />} />
          </Route>

          {/* Admin only */}
          <Route element={<RoleGuard roles={['ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<ManageUsers />} />
            <Route path="/admin/jobs" element={<ManagePlatformJobs />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/jobs" replace />} />
      </Routes>
    </>
  );
}

export default App;
