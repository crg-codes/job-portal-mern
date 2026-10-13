import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Ban, CheckCircle, ExternalLink, Briefcase } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export default function ManagePlatformJobs() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminJobs', page],
    queryFn: () => axiosClient.get(`/admin/jobs?page=${page}&limit=10`),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => axiosClient.patch(`/admin/jobs/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminJobs'] });
    },
  });

  const handleStatusToggle = (job) => {
    const newStatus = job.status === 'PUBLISHED' ? 'CLOSED' : 'PUBLISHED';
    if (window.confirm(`Are you sure you want to change this job's status to ${newStatus}?`)) {
      statusMutation.mutate({ id: job._id, status: newStatus });
    }
  };

  const jobs = data?.data?.jobs || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Platform Jobs</h1>
        <p className="text-slate-500 mt-1">Monitor and moderate all job postings across the platform.</p>
      </div>

      <Card noPadding className="overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Position</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Company / Employer</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Posted Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 px-6 text-center text-slate-500">
                      No jobs found on the platform.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-start">
                          <div className="h-10 w-10 rounded bg-slate-50 border border-slate-100 flex items-center justify-center mr-3 shrink-0">
                            {job.company?.logo ? (
                              <img src={job.company.logo} alt="" className="h-full w-full object-cover rounded" />
                            ) : (
                              <Briefcase className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 line-clamp-1">{job.title}</p>
                            <div className="flex items-center text-xs text-slate-500 mt-1">
                              <span>{job.location}</span>
                              <span className="mx-1.5">•</span>
                              <span>{job.employmentType.replace('_', ' ')}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-slate-900">{job.company?.name || 'No Company'}</p>
                        <p className="text-xs text-slate-500">{job.createdBy?.email}</p>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={
                          job.status === 'PUBLISHED' ? 'success' : 
                          job.status === 'CLOSED' ? 'error' : 'warning'
                        }>
                          {job.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">
                        {new Date(job.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Link to={`/jobs/${job.slug || job._id}`} target="_blank">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="View Public Page">
                              <ExternalLink className="w-4 h-4 text-slate-500" />
                            </Button>
                          </Link>
                          <Button 
                            variant={job.status === 'PUBLISHED' ? 'outline' : 'secondary'}
                            size="sm"
                            className="h-8 text-xs px-2.5"
                            onClick={() => handleStatusToggle(job)}
                            disabled={statusMutation.isPending || job.status === 'DRAFT'}
                          >
                            {job.status === 'PUBLISHED' ? (
                              <><Ban className="w-3.5 h-3.5 mr-1 text-red-500" /> Takedown</>
                            ) : (
                              <><CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" /> Restore</>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-slate-100 bg-slate-50/50 py-3 px-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing page <span className="font-medium text-slate-900">{page}</span> of <span className="font-medium text-slate-900">{pagination.totalPages}</span>
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
