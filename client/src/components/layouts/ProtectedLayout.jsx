import { Outlet, Navigate, useLocation } from 'react-router-dom';
import useCurrentUser from '../../hooks/useCurrentUser';
import Navbar from './Navbar';

export function Spinner() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900" />
    </div>
  );
}

// Logged-in pages. Guests are sent to /login and come back here afterwards.
export default function ProtectedLayout() {
  const { user, isLoading } = useCurrentUser({ required: true });
  const location = useLocation();

  if (isLoading) return <div className="min-h-screen bg-slate-50"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}

// Use inside ProtectedLayout:  <Route element={<RoleGuard roles={['EMPLOYER']} />}> ... </Route>
export function RoleGuard({ roles }) {
  const location = useLocation();
  const { user } = useCurrentUser({ required: true });
  if (!user) return null;
  if (!roles.includes(user.role)) return <Navigate to="/dashboard" replace state={{ denied: location.pathname }} />;
  return <Outlet context={{ user }} />;
}
