import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Users, Trash2, ChevronLeft, ChevronRight, Briefcase, Eye, Pause, Play, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { formatDate } from '../../utils/format';
import { STATUS_VARIANT, statusLabel, EMPLOYMENT_TYPES, labelOf } from '../../utils/jobOptions';

const TABS = ['', 'PUBLISHED', 'DRAFT', 'PAUSED', 'CLOSED'];

export default function ManageJobs() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['myJobs', page, status, q],
    queryFn: () => axiosClient.get('/jobs/employer/me', { params: { page, limit: 10, status: status || undefined, q: q || undefined } }),
  });

  const refresh = () => ['myJobs', 'jobs'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));

  const setJobStatus = useMutation({
    mutationFn: ({ id, status }) => axiosClient.patch(`/jobs/${id}`, { status }),
    onSuccess: (_, v) => { toast.success(`Job ${statusLabel(v.status).toLowerCase()}`); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id) => axiosClient.delete(`/jobs/${id}`),
    onSuccess: () => { toast.success('Job deleted'); refresh(); },
    onError: (e) => toast.error(e.message),
  });

  const jobs = data?.data?.jobs || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Job postings</h1>
          <p className="text-slate-500 mt-1">Create, publish and manage your jobs and applicants.</p>
        </div>
        <Link to="/employer/jobs/create"><Button><Plus className="w-4 h-4 mr-2" /> Post new job</Button></Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t || 'ALL'}
              onClick={() => { setStatus(t); setPage(1); }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border ${status === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {t ? statusLabel(t) : 'All'}
            </button>
          ))}
        </div>
        <div className="relative md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            placeholder="Search by title"
            className="w-full h-10 pl-9 pr-3 rounded-md border border-slate-200 text-sm bg-white"
          />
        </div>
      </div>

      <Card noPadding>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Position</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5">Applicants</th>
                <th className="py-3 px-5">Posted</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {isLoading ? (
                <tr><td colSpan="5" className="py-16 text-center text-slate-400">Loading...</td></tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 mx-auto mb-3"><Briefcase className="w-5 h-5 text-slate-400" /></div>
                    <p className="text-slate-900 font-medium text-sm">No jobs found</p>
                    <p className="text-slate-500 text-sm">Create a listing to start hiring.</p>
                  </td>
                </tr>
              ) : jobs.map((job) => (
                <tr key={job._id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-5">
                    <Link to={`/employer/jobs/${job._id}/edit`} className="font-semibold text-slate-900 hover:text-primary-700 block">{job.title}</Link>
                    <span className="text-xs text-slate-500 mt-0.5 block">{job.location || 'No location'} &bull; {labelOf(EMPLOYMENT_TYPES, job.employmentType)}</span>
                  </td>
                  <td className="py-4 px-5"><Badge variant={STATUS_VARIANT[job.status]}>{statusLabel(job.status)}</Badge></td>
                  <td className="py-4 px-5">
                    <Link to={`/employer/jobs/${job._id}/applicants`} className="text-sm font-medium text-slate-800 hover:underline">
                      {job.applicantCount}
                    </Link>
                    {job.newApplicantCount > 0 && <span className="ml-2 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{job.newApplicantCount} new</span>}
                  </td>
                  <td className="py-4 px-5 text-sm text-slate-500">{formatDate(job.createdAt)}</td>
                  <td className="py-4 px-5">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <Link to={`/employer/jobs/${job._id}/applicants`}><Button variant="secondary" size="sm"><Users className="w-3.5 h-3.5 mr-1.5" />ATS</Button></Link>
                      {job.status === 'PUBLISHED' && (
                        <Link to={`/jobs/${job.slug || job._id}`} title="View public page"><Button variant="ghost" size="sm" className="w-8 p-0"><Eye className="w-4 h-4 text-slate-500" /></Button></Link>
                      )}
                      {job.status === 'PUBLISHED' ? (
                        <Button variant="ghost" size="sm" className="w-8 p-0" title="Pause" disabled={setJobStatus.isPending} onClick={() => setJobStatus.mutate({ id: job._id, status: 'PAUSED' })}><Pause className="w-4 h-4 text-slate-500" /></Button>
                      ) : (
                        <Button variant="ghost" size="sm" className="w-8 p-0" title="Publish" disabled={setJobStatus.isPending} onClick={() => setJobStatus.mutate({ id: job._id, status: 'PUBLISHED' })}><Play className="w-4 h-4 text-green-600" /></Button>
                      )}
                      <Link to={`/employer/jobs/${job._id}/edit`} title="Edit"><Button variant="ghost" size="sm" className="w-8 p-0"><Edit2 className="w-4 h-4 text-slate-500" /></Button></Link>
                      <Button
                        variant="ghost" size="sm" className="w-8 p-0" title="Delete" disabled={remove.isPending}
                        onClick={() => window.confirm(`Delete "${job.title}"? Candidates will no longer see it.`) && remove.mutate(job._id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-slate-100 bg-slate-50/50 py-3 px-5 flex items-center justify-between">
            <p className="text-sm text-slate-500">Page <b>{page}</b> of <b>{pagination.totalPages}</b></p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
