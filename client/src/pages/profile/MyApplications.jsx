import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, Calendar, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { assetUrl } from '../../utils/assets';
import { formatDate } from '../../utils/format';
import { STATUS_VARIANT, statusLabel } from '../../utils/jobOptions';

const TABS = ['ALL', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN'];

export default function MyApplications() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('ALL');
  const [openId, setOpenId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['myApplications'],
    queryFn: () => axiosClient.get('/applications/me'),
  });

  const withdraw = useMutation({
    mutationFn: (id) => axiosClient.patch(`/applications/${id}/withdraw`),
    onSuccess: () => {
      toast.success('Application withdrawn');
      ['myApplications', 'jobs', 'job', 'recommendedJobs'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return (
    <div className="max-w-5xl mx-auto space-y-4 py-6">{[1, 2, 3].map((i) => <Card key={i} className="animate-pulse h-24" />)}</div>
  );

  const applications = data?.data?.applications || [];
  const count = (s) => (s === 'ALL' ? applications.length : applications.filter((a) => a.status === s).length);
  const visible = tab === 'ALL' ? applications : applications.filter((a) => a.status === tab);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My applications</h1>
        <p className="text-slate-500 mt-2">Track the status of every job you applied for.</p>
      </div>

      {applications.length === 0 ? (
        <div className="py-20 text-center border border-slate-200 rounded-lg border-dashed bg-white">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Calendar className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No applications yet</h3>
          <p className="text-slate-500 mb-6">Start discovering opportunities!</p>
          <Link to="/jobs"><Button>Browse jobs</Button></Link>
        </div>
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-3 mb-3">
            {TABS.filter((t) => t === 'ALL' || count(t) > 0).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border ${tab === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
              >
                {t === 'ALL' ? 'All' : statusLabel(t)} ({count(t)})
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {visible.map((app) => {
              const open = openId === app._id;
              const canWithdraw = !['HIRED', 'REJECTED', 'WITHDRAWN'].includes(app.status);
              return (
                <Card key={app._id} className="p-5">
                  <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="h-12 w-12 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                        {app.company?.logo ? <img src={assetUrl(app.company.logo)} alt="" className="h-full w-full object-cover" /> : <Building2 className="h-6 w-6 text-slate-400" />}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-lg truncate">{app.job?.title || 'Job no longer available'}</h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500">
                          <span className="font-medium text-slate-700">{app.company?.name}</span>
                          {app.job?.location && <span className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-1" />{app.job.location}</span>}
                          <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1" />Applied {formatDate(app.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Badge variant={STATUS_VARIANT[app.status]}>{statusLabel(app.status)}</Badge>
                      {app.job?.status === 'PUBLISHED' && (
                        <Link to={`/jobs/${app.job.slug || app.job._id}`}><Button variant="secondary" size="sm">View job</Button></Link>
                      )}
                      <button onClick={() => setOpenId(open ? null : app._id)} className="p-1.5 text-slate-500 hover:text-slate-900" aria-label="Show progress">
                        {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {open && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <h4 className="text-sm font-semibold text-slate-900 mb-3">Progress</h4>
                      <ol className="relative border-l border-slate-200 ml-2 space-y-3">
                        {(app.statusHistory?.length ? app.statusHistory : [{ status: app.status, changedAt: app.createdAt }]).map((h, i) => (
                          <li key={i} className="ml-4">
                            <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-slate-900 border-2 border-white" />
                            <p className="text-sm font-medium text-slate-800">{statusLabel(h.status)}</p>
                            <p className="text-xs text-slate-500">{formatDate(h.changedAt, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                          </li>
                        ))}
                      </ol>
                      {app.resumeSnapshot?.fileName && <p className="text-xs text-slate-500 mt-4">Resume used: {app.resumeSnapshot.fileName}</p>}
                      {canWithdraw && (
                        <Button
                          variant="danger" size="sm" className="mt-4"
                          disabled={withdraw.isPending}
                          onClick={() => window.confirm('Withdraw this application?') && withdraw.mutate(app._id)}
                        >
                          Withdraw application
                        </Button>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
