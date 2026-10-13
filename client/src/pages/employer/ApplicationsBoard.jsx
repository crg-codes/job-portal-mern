import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, FileText, Clock, Search, MapPin, ChevronDown, ChevronUp, Mail, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';
import { Badge } from '../../components/ui/Badge';
import { assetUrl } from '../../utils/assets';
import { formatDate, timeAgo } from '../../utils/format';
import { statusLabel } from '../../utils/jobOptions';

const STATUSES = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED'];
const COLUMN_TONE = {
  APPLIED: 'border-t-slate-400', SCREENING: 'border-t-blue-500', INTERVIEW: 'border-t-amber-500',
  OFFER: 'border-t-purple-500', HIRED: 'border-t-green-600', REJECTED: 'border-t-red-500',
};

function CandidateCard({ app, onMove, onNote, busy }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const a = app.applicant || {};
  const resume = app.resumeFile;

  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/plain', app._id)}
      className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold shrink-0 text-sm">
          {a.firstName?.charAt(0)}{a.lastName?.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-slate-900 text-sm truncate">{a.firstName} {a.lastName}</h4>
          {app.applicantProfile?.headline && <p className="text-xs text-slate-500 truncate">{app.applicantProfile.headline}</p>}
        </div>
        {app.skillMatch !== null && app.skillMatch !== undefined && (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${app.skillMatch >= 70 ? 'bg-green-50 text-green-700' : app.skillMatch >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'}`} title="Skill match with this job">
            {app.skillMatch}%
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        {resume?.fileUrl ? (
          <a href={assetUrl(resume.fileUrl)} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 bg-slate-50 text-slate-700 rounded-md hover:bg-slate-100 border border-slate-200 font-medium">
            <FileText className="w-3.5 h-3.5" /> Resume
          </a>
        ) : (
          <span className="flex-1 text-center text-xs py-1.5 text-slate-400 border border-dashed border-slate-200 rounded-md">No resume</span>
        )}
        <select
          value={app.status}
          disabled={busy}
          onChange={(e) => onMove(app, e.target.value)}
          className="flex-1 text-xs border border-slate-200 rounded-md py-1.5 px-2 bg-white text-slate-700 font-medium"
          aria-label="Move to"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
        </select>
      </div>

      <button onClick={() => setOpen((o) => !o)} className="mt-3 w-full flex items-center justify-between text-[11px] text-slate-500 hover:text-slate-900 font-medium">
        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" />Applied {timeAgo(app.createdAt)}</span>
        <span className="flex items-center">{open ? 'Less' : 'Details'} {open ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}</span>
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-3 text-xs text-slate-600">
          <div className="space-y-1">
            {a.email && <a href={`mailto:${a.email}`} className="flex items-center gap-1.5 hover:text-slate-900"><Mail className="w-3.5 h-3.5" />{a.email}</a>}
            {a.phone && <a href={`tel:${a.phone}`} className="flex items-center gap-1.5 hover:text-slate-900"><Phone className="w-3.5 h-3.5" />{a.phone}</a>}
            {app.applicantProfile?.location && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{app.applicantProfile.location}</p>}
          </div>

          {app.applicantProfile?.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1">{app.applicantProfile.skills.slice(0, 10).map((s) => <Badge key={s}>{s}</Badge>)}</div>
          )}

          {app.coverLetter && (
            <div>
              <p className="font-semibold text-slate-800 mb-1">Cover letter</p>
              <p className="whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-100">{app.coverLetter}</p>
            </div>
          )}

          <div>
            <p className="font-semibold text-slate-800 mb-1">Notes</p>
            {app.notes?.length ? (
              <ul className="space-y-1.5 mb-2">
                {app.notes.map((n, i) => (
                  <li key={n._id || i} className="bg-amber-50 border border-amber-100 rounded p-2">
                    <p className="whitespace-pre-wrap">{n.text}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{n.addedBy?.firstName} · {formatDate(n.createdAt)}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-slate-400 mb-2">No notes yet.</p>}
            <form onSubmit={(e) => { e.preventDefault(); if (note.trim()) { onNote(app._id, note.trim()); setNote(''); } }} className="flex gap-1.5">
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} placeholder="Add a private note" className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-xs" />
              <button className="px-2.5 py-1.5 text-xs font-medium bg-slate-900 text-white rounded">Add</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsBoard() {
  const { jobId } = useParams();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showWithdrawn, setShowWithdrawn] = useState(false);
  const [dragOver, setDragOver] = useState(null);

  const { data: jobData, isLoading: loadingJob, error: jobError } = useQuery({
    queryKey: ['job', jobId, 'ats'],
    queryFn: () => axiosClient.get(`/jobs/${jobId}`),
  });
  const { data, isLoading: loadingApps, error: appsError } = useQuery({
    queryKey: ['applications', jobId],
    queryFn: () => axiosClient.get(`/applications/job/${jobId}`),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['applications', jobId] });

  const move = useMutation({
    mutationFn: ({ id, status }) => axiosClient.patch(`/applications/${id}/status`, { status }),
    onSuccess: (_, v) => { toast.success(`Moved to ${statusLabel(v.status)}`); refresh(); },
    onError: (e) => toast.error(e.message),
  });
  const addNote = useMutation({
    mutationFn: ({ id, text }) => axiosClient.post(`/applications/${id}/notes`, { text }),
    onSuccess: refresh,
    onError: (e) => toast.error(e.message),
  });

  const handleMove = (app, status) => {
    if (status === app.status) return;
    if (status === 'REJECTED' && !window.confirm(`Reject ${app.applicant?.firstName}? They will be notified.`)) return;
    move.mutate({ id: app._id, status });
  };

  const all = data?.data?.applications || [];
  const applications = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((a) => {
      if (!q) return true;
      const hay = `${a.applicant?.firstName} ${a.applicant?.lastName} ${a.applicant?.email} ${(a.applicantProfile?.skills || []).join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [all, search]);

  if (loadingJob || loadingApps) return <div className="flex items-center justify-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900" /></div>;

  if (jobError || appsError) return (
    <div className="max-w-xl mx-auto text-center py-16">
      <p className="text-slate-700 font-medium">{(appsError || jobError).message}</p>
      <Link to="/employer/jobs" className="text-sm underline mt-3 inline-block">Back to jobs</Link>
    </div>
  );

  const job = jobData?.data?.job;
  const withdrawn = applications.filter((a) => a.status === 'WITHDRAWN');
  const active = all.filter((a) => a.status !== 'WITHDRAWN');

  return (
    <div className="flex flex-col">
      <div className="mb-5 flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4">
        <div>
          <Link to="/employer/jobs" className="text-sm text-slate-500 hover:text-slate-900 flex items-center mb-2"><ChevronLeft className="w-4 h-4 mr-1" /> Back to jobs</Link>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Applicants: {job?.title}</h1>
          <p className="text-slate-500 text-sm mt-1">
            {active.length} candidate{active.length === 1 ? '' : 's'} · drag a card to another column or use the dropdown to change status.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, skill" className="h-9 w-64 pl-9 pr-3 rounded-md border border-slate-200 text-sm bg-white" />
          </div>
          {withdrawn.length > 0 && (
            <button onClick={() => setShowWithdrawn((s) => !s)} className="text-xs font-medium text-slate-600 underline">
              {showWithdrawn ? 'Hide' : 'Show'} withdrawn ({withdrawn.length})
            </button>
          )}
        </div>
      </div>

      {all.length === 0 && (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-lg bg-white mb-6">
          <p className="font-medium text-slate-900">No applications yet</p>
          <p className="text-sm text-slate-500 mt-1">Candidates will appear here when they apply.</p>
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-6 snap-x">
        {STATUSES.map((status) => {
          const col = applications.filter((a) => a.status === status);
          return (
            <div
              key={status}
              onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
              onDragLeave={() => setDragOver((d) => (d === status ? null : d))}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(null);
                const app = all.find((a) => a._id === e.dataTransfer.getData('text/plain'));
                if (app) handleMove(app, status);
              }}
              className={`shrink-0 w-80 rounded-xl border border-t-4 ${COLUMN_TONE[status]} flex flex-col snap-start ${dragOver === status ? 'bg-slate-200/70 border-slate-400' : 'bg-slate-100/60 border-slate-200'}`}
              style={{ minHeight: 280 }}
            >
              <div className="p-4 flex justify-between items-center">
                <h3 className="font-semibold text-slate-900 text-sm">{statusLabel(status)}</h3>
                <span className="bg-white text-slate-700 text-xs px-2.5 py-0.5 rounded-full font-medium border border-slate-200">{col.length}</span>
              </div>
              <div className="px-3 pb-3 space-y-3 flex-1">
                {col.map((app) => (
                  <CandidateCard key={app._id} app={app} busy={move.isPending} onMove={handleMove} onNote={(id, text) => addNote.mutate({ id, text })} />
                ))}
                {col.length === 0 && <div className="text-center text-slate-400 text-xs py-8 border-2 border-dashed border-slate-200 rounded-lg">No candidates</div>}
              </div>
            </div>
          );
        })}
      </div>

      {showWithdrawn && withdrawn.length > 0 && (
        <div className="mt-2">
          <h3 className="font-semibold text-slate-900 text-sm mb-2">Withdrawn by candidate</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {withdrawn.map((a) => (
              <div key={a._id} className="bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-600 opacity-80">
                {a.applicant?.firstName} {a.applicant?.lastName} · {a.applicant?.email}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
