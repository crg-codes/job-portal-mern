import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Sparkles, Lightbulb } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import JobCard from '../../components/jobs/JobCard';

export default function RecommendedJobs() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['recommendedJobs'],
    queryFn: () => axiosClient.get('/recommendations/jobs'),
  });

  if (isLoading) return (
    <div className="max-w-4xl mx-auto space-y-4 py-6">
      {[1, 2, 3].map((i) => <Card key={i} className="animate-pulse h-32" />)}
    </div>
  );

  if (error) return (
    <div className="max-w-4xl mx-auto py-16 text-center border border-red-200 bg-red-50 rounded-lg">
      <h3 className="text-lg font-semibold text-red-800 mb-1">Could not load recommendations</h3>
      <p className="text-red-700 text-sm">{error.message}</p>
      <Button variant="secondary" className="mt-4" onClick={() => refetch()}>Try again</Button>
    </div>
  );

  const { jobs = [], tips = [], basedOn } = data?.data || {};
  const matched = jobs.filter((j) => !j.isFallback);
  const others = jobs.filter((j) => j.isFallback);

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      <div className="text-center">
        <div className="h-14 w-14 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
          <Sparkles className="h-7 w-7 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Recommended for you</h1>
        <p className="text-slate-500 mt-2">
          Based on your skills, profile preferences and {basedOn?.appliedJobs ? `${basedOn.appliedJobs} past application${basedOn.appliedJobs > 1 ? 's' : ''}` : 'your activity'}.
        </p>
      </div>

      {tips.length > 0 && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900">
          <Lightbulb className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Get better matches</p>
            <p className="mt-0.5">{tips.join(' · ')}.</p>
          </div>
          <Link to="/profile/seeker"><Button size="sm">Update profile</Button></Link>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="py-16 text-center border border-slate-200 rounded-lg border-dashed bg-white">
          <h3 className="text-lg font-semibold text-slate-900 mb-1">No jobs to recommend yet</h3>
          <p className="text-slate-500 mb-5">New jobs appear here as soon as employers publish them.</p>
          <Link to="/jobs"><Button>Browse all jobs</Button></Link>
        </div>
      ) : (
        <>
          {matched.length > 0 && <div className="space-y-3">{matched.map((j) => <JobCard key={j._id} job={j} showMatch />)}</div>}
          {others.length > 0 && (
            <>
              <h2 className="text-lg font-bold text-slate-900 pt-4">{matched.length ? 'Other new jobs' : 'Latest jobs'}</h2>
              <div className="space-y-3">{others.map((j) => <JobCard key={j._id} job={j} />)}</div>
            </>
          )}
        </>
      )}
    </div>
  );
}
