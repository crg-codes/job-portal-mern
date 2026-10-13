import { useQuery } from '@tanstack/react-query';
import { Users, Briefcase, Building2, FileText } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';

export default function AdminDashboard() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => axiosClient.get('/admin/stats'),
  });

  if (isLoading) return (
    <div className="space-y-6">
      <div className="h-8 w-64 bg-slate-200 animate-pulse rounded"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => <Card key={i} className="h-32 animate-pulse"></Card>)}
      </div>
    </div>
  );

  if (error) return (
    <div className="p-6 bg-red-50 text-red-600 rounded-lg border border-red-100">
      Failed to load platform statistics.
    </div>
  );

  const stats = data?.data?.stats || {};

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users },
    { label: 'Active Jobs', value: stats.activeJobs, icon: Briefcase },
    { label: 'Companies', value: stats.totalCompanies, icon: Building2 },
    { label: 'Applications', value: stats.totalApplications, icon: FileText },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">System Overview</h1>
        <p className="text-slate-500 mt-2">Monitor the health and activity of the Job Portal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <Card key={i} className="flex flex-col p-6 hover:border-slate-300 transition-colors bg-white">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <Icon className="h-5 w-5 text-slate-400" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{stat.value || 0}</h3>
            </Card>
          );
        })}
      </div>

      {/* Additional Analytics can go here later */}
    </div>
  );
}
