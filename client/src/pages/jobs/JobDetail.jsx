import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { MapPin, Briefcase, Calendar, Clock, Upload, Building, X, CheckCircle2, Banknote, FileText, Pencil, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';
import useCurrentUser from '../../hooks/useCurrentUser';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Textarea } from '../../components/ui/Textarea';
import { assetUrl } from '../../utils/assets';
import { formatSalary, formatDate } from '../../utils/format';
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES, labelOf, STATUS_VARIANT, statusLabel } from '../../utils/jobOptions';

function ApplyModal({ job, onClose, onApplied }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [resumeId, setResumeId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');

  const { data: resumeData, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => axiosClient.get('/applications/resumes'),
  });
  const resumes = resumeData?.data?.resumes || [];
  const selected = resumeId || resumes.find((r) => r.isDefault)?._id || resumes[0]?._id || '';

  const apply = useMutation({
    mutationFn: async () => {
      let id = selected;
      // a new file was chosen -> upload it first and use it
      if (file) {
        const fd = new FormData();
        fd.append('file', file);
        const up = await axiosClient.post('/applications/resumes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        id = up.data.resume._id;
        queryClient.invalidateQueries({ queryKey: ['resumes'] });
      }
      if (!id) throw new Error('Please choose or upload a resume');
      return axiosClient.post('/applications/apply', { jobId: job._id, resumeId: id, coverLetter });
    },
    onSuccess: () => {
      toast.success('Application submitted!');
      onApplied();
    },
    onError: (err) => {
      toast.error(err.message || 'Failed to apply');
      // already applied (e.g. in another tab) -> refresh the page state
      if (err.status === 409) onApplied();
    },
  });

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error('Maximum file size is 5MB');
    setFile(f);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="fixed inset-0 bg-slate-900/60" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 z-10">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Submit application</h3>
              <p className="text-sm text-slate-500 mt-1">
                <span className="font-medium text-slate-700">{job.title}</span> at {job.company?.name}
              </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Close"><X className="w-5 h-5" /></button>
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); if (!apply.isPending) apply.mutate(); }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Resume <span className="text-red-600">*</span></label>

              {isLoading ? (
                <p className="text-sm text-slate-400">Loading your resumes...</p>
              ) : (
                resumes.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {resumes.map((r) => (
                      <label key={r._id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${!file && selected === r._id ? 'border-primary-950 bg-slate-50' : 'border-slate-200'}`}>
                        <input type="radio" name="resume" checked={!file && selected === r._id} onChange={() => { setFile(null); setResumeId(r._id); }} />
                        <FileText className="w-4 h-4 text-slate-500 shrink-0" />
                        <span className="text-sm text-slate-800 truncate flex-1">{r.fileName}</span>
                        {r.isDefault && <Badge variant="warning">Default</Badge>}
                      </label>
                    ))}
                  </div>
                )
              )}

              <label className="flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed border-slate-200 rounded-lg hover:border-slate-400 cursor-pointer bg-slate-50 text-sm text-slate-600">
                <Upload className="w-5 h-5 text-slate-400" />
                {file ? <span className="font-medium text-slate-900 truncate">{file.name}</span> : resumes.length ? 'Or upload a new resume (PDF, DOC, DOCX · max 5MB)' : 'Upload your resume (PDF, DOC, DOCX · max 5MB)'}
                <input type="file" className="sr-only" accept=".pdf,.doc,.docx" onChange={pickFile} />
              </label>
              {file && <button type="button" onClick={() => setFile(null)} className="text-xs text-slate-500 underline mt-1">Remove new file</button>}
            </div>

            <Textarea
              label="Cover letter (optional)"
              placeholder="Why are you a great fit for this role?"
              value={coverLetter}
              maxLength={3000}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
            />

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
              <Button type="submit" disabled={apply.isPending || (!file && !selected)} className="flex-1">
                {apply.isPending ? 'Submitting...' : 'Submit application'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function JobDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useCurrentUser({ required: false });
  const [showApply, setShowApply] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['job', slug, user?._id || 'guest'],
    queryFn: () => axiosClient.get(`/jobs/${slug}`),
  });

  const refreshAfterApply = () => {
    setShowApply(false);
    ['job', 'jobs', 'myApplications', 'recommendedJobs'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
  };

  if (isLoading) return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="animate-pulse h-48" />
      <Card className="animate-pulse h-96" />
    </div>
  );

  if (error || !data?.data?.job) return (
    <div className="text-center py-20 border border-slate-200 border-dashed rounded-lg max-w-4xl mx-auto bg-white">
      <h3 className="text-xl font-semibold text-slate-900 mb-2">Job not found</h3>
      <p className="text-slate-500">{error?.message || 'This role may have been closed or removed.'}</p>
      <Link to="/jobs"><Button variant="outline" className="mt-6">Browse jobs</Button></Link>
    </div>
  );

  const job = data.data.job;
  const company = job.company;
  const salary = formatSalary(job);
  const app = job.myApplication;
  const closed = job.status !== 'PUBLISHED' || job.isExpired;
  const isSeeker = user?.role === 'JOB_SEEKER';

  // The one place that decides what the apply area shows
  let action;
  if (job.isOwner) {
    action = (
      <div className="space-y-2">
        <Link to={`/employer/jobs/${job._id}/applicants`}><Button fullWidth><Users className="w-4 h-4 mr-2" />View applicants</Button></Link>
        <Link to={`/employer/jobs/${job._id}/edit`}><Button fullWidth variant="secondary"><Pencil className="w-4 h-4 mr-2" />Edit job</Button></Link>
      </div>
    );
  } else if (app) {
    action = (
      <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center">
        <CheckCircle2 className="w-6 h-6 text-green-600 mx-auto mb-1" />
        <p className="font-semibold text-green-800">You applied for this job</p>
        <div className="mt-2"><Badge variant={STATUS_VARIANT[app.status]}>{statusLabel(app.status)}</Badge></div>
        <p className="text-xs text-green-700 mt-2">on {formatDate(app.createdAt)}</p>
        <Link to="/profile/seeker/applications" className="text-sm font-medium text-green-800 underline mt-2 inline-block">Track application</Link>
      </div>
    );
  } else if (closed) {
    action = <div className="rounded-lg bg-slate-100 p-4 text-center text-sm font-medium text-slate-600">{job.isExpired ? 'Application deadline has passed' : 'This job is not accepting applications'}</div>;
  } else if (!user) {
    action = (
      <Button fullWidth size="lg" onClick={() => navigate('/login', { state: { from: location.pathname } })}>
        Login to apply
      </Button>
    );
  } else if (isSeeker) {
    action = <Button fullWidth size="lg" onClick={() => setShowApply(true)}>Apply now</Button>;
  } else {
    action = <p className="text-sm text-slate-500 text-center">Only job seeker accounts can apply for jobs.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <Link to="/jobs" className="text-sm text-slate-500 hover:text-slate-900 mb-4 inline-block">&larr; Back to jobs</Link>

      {job.status !== 'PUBLISHED' && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3">
          This job is <b>{statusLabel(job.status)}</b> and is not visible to job seekers.
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6 min-w-0">
          <Card>
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                {company?.logo ? <img src={assetUrl(company.logo)} alt={company.name} className="h-full w-full object-cover" /> : <Building className="h-8 w-8 text-slate-400" />}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight">{job.title}</h1>
                {company?.slug && (
                  <Link to={`/companies/${company.slug}`} className="text-lg text-slate-600 hover:text-primary-700 hover:underline mt-1 inline-block font-medium">{company.name}</Link>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600 border-t border-slate-100 pt-5">
              <span className="flex items-center"><MapPin className="h-4 w-4 mr-2 text-slate-400" /><b className="font-medium text-slate-700">{job.location || 'Not specified'}</b>&nbsp;({labelOf(WORK_MODES, job.remoteType)})</span>
              <span className="flex items-center"><Briefcase className="h-4 w-4 mr-2 text-slate-400" /><b className="font-medium text-slate-700">{labelOf(EMPLOYMENT_TYPES, job.employmentType)}</b></span>
              <span className="flex items-center"><Clock className="h-4 w-4 mr-2 text-slate-400" /><b className="font-medium text-slate-700">{labelOf(EXPERIENCE_LEVELS, job.experienceLevel)}</b></span>
              {salary && <span className="flex items-center"><Banknote className="h-4 w-4 mr-2 text-slate-400" /><b className="font-medium text-slate-700">{salary}</b></span>}
            </div>

            {/* mobile apply */}
            <div className="md:hidden mt-5">{action}</div>
          </Card>

          <Card className="space-y-8">
            <section>
              <h2 className="text-lg font-bold text-slate-900 mb-3">About the role</h2>
              <div className="text-slate-600 whitespace-pre-wrap leading-relaxed">{job.description}</div>
            </section>
            {job.requirements && (
              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-3">Requirements</h2>
                <div className="text-slate-600 whitespace-pre-wrap leading-relaxed">{job.requirements}</div>
              </section>
            )}
            {job.responsibilities && (
              <section>
                <h2 className="text-lg font-bold text-slate-900 mb-3">Responsibilities</h2>
                <div className="text-slate-600 whitespace-pre-wrap leading-relaxed">{job.responsibilities}</div>
              </section>
            )}
          </Card>
        </div>

        <div className="w-full md:w-80 shrink-0">
          <div className="sticky top-20 space-y-6">
            <Card className="hidden md:block">
              {action}
              <div className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center">
                <Calendar className="h-3 w-3 mr-1.5" />
                Posted {formatDate(job.publishedAt || job.createdAt)}
              </div>
              {job.applicationDeadline && !job.isExpired && (
                <p className="mt-1 text-center text-xs text-amber-700">Apply before {formatDate(job.applicationDeadline)}</p>
              )}
            </Card>

            {job.skills?.length > 0 && (
              <Card>
                <h3 className="font-bold text-slate-900 mb-3">Required skills</h3>
                <div className="flex flex-wrap gap-2">{job.skills.map((s) => <Badge key={s}>{s}</Badge>)}</div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {showApply && <ApplyModal job={job} onClose={() => setShowApply(false)} onApplied={refreshAfterApply} />}
    </div>
  );
}
