import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { toDateInput } from '../../utils/format';
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES, CURRENCIES, SALARY_PERIODS } from '../../utils/jobOptions';

const DEFAULTS = {
  title: '', employmentType: 'FULL_TIME', experienceLevel: 'ENTRY', remoteType: 'ONSITE', location: '',
  description: '', requirements: '', responsibilities: '', skills: '', salaryMin: '', salaryMax: '',
  salaryCurrency: 'INR', salaryPeriod: 'YEARLY', applicationDeadline: '', status: 'DRAFT',
};

const section = 'bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6';

export default function CreateJob() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, getValues, formState: { errors } } = useForm({ defaultValues: DEFAULTS });

  // an employer must have a company before posting
  const { data: companyData, isLoading: loadingCompany } = useQuery({
    queryKey: ['myCompany'],
    queryFn: () => axiosClient.get('/companies/me'),
  });

  const { data: jobData, isLoading } = useQuery({
    queryKey: ['job', id, 'edit'],
    queryFn: () => axiosClient.get(`/jobs/${id}`),
    enabled: isEditing,
  });

  useEffect(() => {
    const job = jobData?.data?.job;
    if (!isEditing || !job) return;
    reset({
      ...DEFAULTS,
      ...Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, job[k] ?? DEFAULTS[k]])),
      skills: job.skills?.join(', ') || '',
      applicationDeadline: toDateInput(job.applicationDeadline),
    });
  }, [jobData, isEditing, reset]);

  const mutation = useMutation({
    mutationFn: (payload) => (isEditing ? axiosClient.patch(`/jobs/${id}`, payload) : axiosClient.post('/jobs', payload)),
    onSuccess: () => {
      toast.success(isEditing ? 'Job updated' : 'Job created');
      ['myJobs', 'jobs', 'job'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      navigate('/employer/jobs');
    },
    onError: (e) => toast.error(e.errors?.[0]?.message ? `${e.errors[0].field}: ${e.errors[0].message}` : e.message),
  });

  const onSubmit = (d) => {
    const num = (v) => (v === '' || v === null || v === undefined ? null : Number(v));
    const payload = {
      title: d.title.trim(),
      employmentType: d.employmentType,
      experienceLevel: d.experienceLevel,
      remoteType: d.remoteType,
      location: d.location.trim(),
      description: d.description,
      requirements: d.requirements,
      responsibilities: d.responsibilities,
      skills: d.skills.split(',').map((s) => s.trim()).filter(Boolean),
      salaryMin: num(d.salaryMin),
      salaryMax: num(d.salaryMax),
      salaryCurrency: d.salaryCurrency,
      salaryPeriod: d.salaryPeriod,
      applicationDeadline: d.applicationDeadline ? new Date(`${d.applicationDeadline}T23:59:59`).toISOString() : null,
      status: d.status,
    };
    // creating: leave empty optional fields out
    if (!isEditing) {
      ['salaryMin', 'salaryMax', 'applicationDeadline'].forEach((k) => payload[k] === null && delete payload[k]);
    }
    mutation.mutate(payload);
  };

  if (loadingCompany || (isEditing && isLoading)) {
    return <div className="py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900 mx-auto" /></div>;
  }

  if (!companyData?.data?.company) {
    return (
      <div className="max-w-xl mx-auto text-center bg-white border border-slate-200 rounded-xl p-10">
        <h2 className="text-xl font-bold text-slate-900">Create your company profile first</h2>
        <p className="text-slate-500 mt-2">Jobs are posted on behalf of a company.</p>
        <Link to="/company/create"><Button className="mt-6">Create company</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-20">
      <button onClick={() => navigate('/employer/jobs')} className="text-sm text-slate-500 hover:text-slate-900 flex items-center mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to jobs
      </button>
      <h2 className="text-3xl font-bold text-slate-900 tracking-tight">{isEditing ? 'Edit job posting' : 'Create new job posting'}</h2>
      <p className="text-slate-500 mt-2 mb-8">Fill in the details to attract the best candidates.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <div className={section}>
          <h3 className="text-lg font-bold text-slate-900">Basic information</h3>
          <Input label="Job title *" placeholder="e.g. React Developer" {...register('title', { required: 'Job title is required', maxLength: { value: 100, message: 'Max 100 characters' } })} error={errors.title?.message} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="Employment type *" options={EMPLOYMENT_TYPES} {...register('employmentType', { required: true })} />
            <Select label="Experience level *" options={EXPERIENCE_LEVELS} {...register('experienceLevel', { required: true })} />
            <Select label="Work setup *" options={WORK_MODES} {...register('remoteType', { required: true })} />
            <Input label="Location" placeholder="e.g. Chennai, Tamil Nadu" {...register('location')} />
          </div>
        </div>

        <div className={section}>
          <h3 className="text-lg font-bold text-slate-900">Job details</h3>
          <Textarea label="Job description *" rows={6} placeholder="Describe the role, the team and the impact..." {...register('description', { required: 'Description is required' })} error={errors.description?.message} />
          <Textarea label="Requirements" rows={4} {...register('requirements')} />
          <Textarea label="Responsibilities" rows={4} {...register('responsibilities')} />
        </div>

        <div className={section}>
          <h3 className="text-lg font-bold text-slate-900">Skills & compensation</h3>
          <Input label="Required skills (comma separated)" placeholder="React, Node.js, MongoDB" {...register('skills')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="Currency" options={CURRENCIES} {...register('salaryCurrency')} />
            <Select label="Salary period" options={SALARY_PERIODS} {...register('salaryPeriod')} />
            <Input label="Minimum salary" type="number" min="0" placeholder="e.g. 600000" {...register('salaryMin', { min: { value: 0, message: 'Cannot be negative' } })} error={errors.salaryMin?.message} />
            <Input
              label="Maximum salary" type="number" min="0" placeholder="e.g. 1200000"
              {...register('salaryMax', {
                validate: (v) => v === '' || getValues('salaryMin') === '' || Number(v) >= Number(getValues('salaryMin')) || 'Must be at least the minimum salary',
              })}
              error={errors.salaryMax?.message}
            />
          </div>
          <Input label="Application deadline (optional)" type="date" min={new Date().toISOString().slice(0, 10)} {...register('applicationDeadline')} />
        </div>

        <div className={section}>
          <h3 className="text-lg font-bold text-slate-900">Publishing</h3>
          <Select
            label="Status"
            {...register('status')}
            options={[
              { value: 'DRAFT', label: 'Save as draft (hidden)' },
              { value: 'PUBLISHED', label: 'Publish now (visible to job seekers)' },
              ...(isEditing ? [{ value: 'PAUSED', label: 'Paused' }, { value: 'CLOSED', label: 'Closed' }] : []),
            ]}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="ghost" onClick={() => navigate('/employer/jobs')}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save job posting'}</Button>
        </div>
      </form>
    </div>
  );
}
