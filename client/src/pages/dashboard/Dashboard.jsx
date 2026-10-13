import { Link, useOutletContext } from 'react-router-dom';
import { Briefcase, FileText, UserCircle, Building2, Users, Sparkles, Bell, PlusCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';

function ActionCard({ to, icon: Icon, title, description }) {
  return (
    <Link to={to} className="block group">
      <Card className="h-full hover:border-slate-400 hover:shadow-md transition-all">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{description}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useOutletContext();

  const seekerActions = [
    ['/jobs', Briefcase, 'Find Jobs', 'Search and apply for published jobs.'],
    ['/recommended-jobs', Sparkles, 'Recommended Jobs', 'See jobs matched to your skills and preferences.'],
    ['/profile/seeker/applications', FileText, 'My Applications', 'Track every application and its current status.'],
    ['/profile/seeker/resumes', FileText, 'My Resumes', 'Upload, view, replace and delete your resumes.'],
    ['/profile/seeker', UserCircle, 'My Profile', 'Manage your skills, experience and profile photo.'],
    ['/notifications', Bell, 'Notifications', 'View application and platform updates.'],
  ];

  const employerActions = [
    ['/employer/jobs', Briefcase, 'Manage Job Postings', 'Create, edit, publish and delete your job postings.'],
    ['/employer/jobs/create', PlusCircle, 'Create Job', 'Publish a new opportunity for job seekers.'],
    ['/company/create', Building2, 'Company Profile', 'Create or update your company information and logo.'],
    ['/profile/employer', UserCircle, 'Employer Profile', 'Manage your recruiter details and company association.'],
    ['/notifications', Bell, 'Notifications', 'View platform and candidate-related updates.'],
  ];

  const adminActions = [
    ['/admin/dashboard', Users, 'Admin Overview', 'View platform statistics.'],
    ['/admin/users', Users, 'Manage Users', 'Manage registered users.'],
    ['/admin/jobs', Briefcase, 'Manage Jobs', 'Manage jobs across the platform.'],
  ];

  const actions = user.role === 'JOB_SEEKER' ? seekerActions : user.role === 'EMPLOYER' ? employerActions : adminActions;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Welcome, {user.firstName}</h1>
        <p className="text-slate-500 mt-2">Choose a section below to use your Job Portal features.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {actions.map(([to, icon, title, description]) => (
          <ActionCard key={to} to={to} icon={icon} title={title} description={description} />
        ))}
      </div>
    </div>
  );
}
