import { Outlet } from 'react-router-dom';
import useCurrentUser from '../../hooks/useCurrentUser';
import Navbar from './Navbar';

// Pages anyone can open (jobs, company pages). Shows the full menu when logged in.
export default function PublicLayout() {
  const { user } = useCurrentUser({ required: false });
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ user }} />
      </main>
    </div>
  );
}
