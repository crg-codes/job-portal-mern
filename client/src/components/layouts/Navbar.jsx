import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, Briefcase, UserCircle, Bell, Search, Settings, FileText, Sparkles, Building2, KeyRound, Menu, X, PlusCircle, LayoutDashboard } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const LINKS = {
  JOB_SEEKER: [
    ['/jobs', Search, 'Browse Jobs'],
    ['/recommended-jobs', Sparkles, 'For You'],
    ['/profile/seeker/applications', FileText, 'Applications'],
    ['/profile/seeker/resumes', FileText, 'Resumes'],
  ],
  EMPLOYER: [
    ['/employer/jobs', Briefcase, 'Manage Jobs'],
    ['/employer/jobs/create', PlusCircle, 'Post a Job'],
    ['/company/edit', Building2, 'Company'],
    ['/jobs', Search, 'Browse Jobs'],
  ],
  ADMIN: [
    ['/admin/dashboard', Settings, 'Overview'],
    ['/admin/users', UserCircle, 'Users'],
    ['/admin/jobs', Briefcase, 'Jobs'],
  ],
  GUEST: [['/jobs', Search, 'Browse Jobs']],
};

function NavLink({ to, children, icon: Icon, onClick, block }) {
  const { pathname } = useLocation();
  // exact for list pages that have sibling routes, prefix for the rest
  const active = pathname === to || (to !== '/jobs' && pathname.startsWith(to + '/'));
  return (
    <Link
      to={to}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${block ? 'w-full' : ''} ${
        active ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
      }`}
    >
      {Icon && <Icon className="w-4 h-4 text-slate-500" />}
      <span>{children}</span>
    </Link>
  );
}

export default function Navbar({ user }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const links = LINKS[user?.role || 'GUEST'] || LINKS.GUEST;

  const { data: notif } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => axiosClient.get('/notifications', { params: { limit: 1 } }),
    enabled: !!user,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const unread = notif?.data?.unreadCount || 0;

  const handleLogout = async () => {
    try {
      await axiosClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      queryClient.clear();
      navigate('/login', { replace: true });
    }
  };

  const close = () => setOpen(false);
  const profilePath = user?.role === 'EMPLOYER' ? '/profile/employer' : '/profile/seeker';

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to={user ? '/dashboard' : '/jobs'} className="flex items-center gap-2 group">
              <div className="h-8 w-8 bg-primary-950 text-white rounded-md flex items-center justify-center font-bold text-lg">J</div>
              <span className="text-lg font-bold text-slate-900 tracking-tight">Portal</span>
            </Link>
            <div className="hidden md:flex gap-1">
              {user && <NavLink to="/dashboard" icon={LayoutDashboard}>Dashboard</NavLink>}
              {links.map(([to, icon, label]) => (
                <NavLink key={to + label} to={to} icon={icon}>{label}</NavLink>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {user ? (
              <>
                <Link to="/notifications" title="Notifications" className="p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50 relative">
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </Link>
                <Link to="/change-password" title="Change password" className="hidden sm:block p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50">
                  <KeyRound className="w-5 h-5" />
                </Link>
                {user.role !== 'ADMIN' && (
                  <Link to={profilePath} title="My profile" className="hidden sm:block p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50">
                    <UserCircle className="w-5 h-5" />
                  </Link>
                )}
                <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block" />
                <button onClick={handleLogout} className="hidden sm:flex items-center gap-2 p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-50">
                  <span className="text-sm font-medium">{user.firstName}</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900">Sign in</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium bg-primary-950 text-white rounded-md hover:bg-primary-800">Sign up</Link>
              </div>
            )}
            <button className="md:hidden p-2 rounded-md text-slate-600 hover:bg-slate-50" onClick={() => setOpen((o) => !o)} aria-label="Menu">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {user && <NavLink to="/dashboard" icon={LayoutDashboard} onClick={close} block>Dashboard</NavLink>}
          {links.map(([to, icon, label]) => (
            <NavLink key={to + label} to={to} icon={icon} onClick={close} block>{label}</NavLink>
          ))}
          {user ? (
            <>
              {user.role !== 'ADMIN' && <NavLink to={profilePath} icon={UserCircle} onClick={close} block>My profile</NavLink>}
              <NavLink to="/change-password" icon={KeyRound} onClick={close} block>Change password</NavLink>
              <button onClick={handleLogout} className="flex items-center gap-2 px-3 py-2 w-full rounded-md text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut className="w-4 h-4" /> Log out ({user.firstName})
              </button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Link to="/login" onClick={close} className="flex-1 text-center px-3 py-2 text-sm font-medium border border-slate-200 rounded-md">Sign in</Link>
              <Link to="/register" onClick={close} className="flex-1 text-center px-3 py-2 text-sm font-medium bg-primary-950 text-white rounded-md">Sign up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
