import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Card } from '../../components/ui/Card';
import { assetUrl } from '../../utils/assets';
import { toDateInput } from '../../utils/format';
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES } from '../../utils/jobOptions';

const list = (s) => (s || '').split(',').map((x) => x.trim()).filter(Boolean);
const nullIfEmpty = (v) => (v === '' || v === undefined ? null : v);

function Section({ title, hint, children }) {
  return (
    <Card className="flex flex-col md:flex-row gap-8 items-start">
      <div className="w-full md:w-1/3 shrink-0">
        <h3 className="text-lg font-bold text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-500">{hint}</p>
      </div>
      <div className="w-full space-y-5">{children}</div>
    </Card>
  );
}

const selectCls = 'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm';

export default function SeekerProfile() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    defaultValues: { experience: [], education: [], preferences: { jobTypes: [] } },
  });
  const exp = useFieldArray({ control, name: 'experience' });
  const edu = useFieldArray({ control, name: 'education' });

  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: () => axiosClient.get('/profile/me') });
  const profile = data?.data?.profile;

  useEffect(() => {
    if (!profile) return;
    const p = profile;
    reset({
      firstName: p.user?.firstName || '',
      lastName: p.user?.lastName || '',
      phone: p.user?.phone || '',
      headline: p.headline || '',
      bio: p.bio || '',
      location: p.location || '',
      website: p.website || '',
      linkedin: p.socialLinks?.linkedin || '',
      github: p.socialLinks?.github || '',
      skills: (p.skills || []).join(', '),
      experience: (p.experience || []).map((e) => ({ ...e, from: toDateInput(e.from), to: toDateInput(e.to) })),
      education: (p.education || []).map((e) => ({ ...e, from: toDateInput(e.from), to: toDateInput(e.to) })),
      preferences: {
        locations: (p.preferences?.locations || []).join(', '),
        jobTypes: p.preferences?.jobTypes || [],
        salaryMin: p.preferences?.salaryMin ?? '',
        experienceLevel: p.preferences?.experienceLevel || '',
        remotePreference: p.preferences?.remotePreference || '',
      },
    });
  }, [profile, reset]);

  const save = useMutation({
    mutationFn: (d) => {
      const cleanRow = (r) => ({
        title: r.title, company: r.company, school: r.school, degree: r.degree, fieldOfStudy: r.fieldOfStudy,
        location: r.location || null, description: r.description || null,
        from: r.from, to: r.current ? null : nullIfEmpty(r.to), current: !!r.current,
      });
      const pick = (r, keys) => Object.fromEntries(keys.map((k) => [k, cleanRow(r)[k]]).filter(([, v]) => v !== undefined));
      return axiosClient.patch('/profile/me/job-seeker', {
        firstName: d.firstName,
        lastName: d.lastName,
        phone: d.phone || null,
        headline: d.headline,
        bio: d.bio,
        location: d.location,
        website: d.website,
        socialLinks: { linkedin: d.linkedin, github: d.github },
        skills: list(d.skills),
        experience: d.experience.map((r) => pick(r, ['title', 'company', 'location', 'description', 'from', 'to', 'current'])),
        education: d.education.map((r) => pick(r, ['school', 'degree', 'fieldOfStudy', 'description', 'from', 'to', 'current'])),
        preferences: {
          locations: list(d.preferences.locations),
          jobTypes: d.preferences.jobTypes || [],
          salaryMin: d.preferences.salaryMin === '' ? null : Number(d.preferences.salaryMin),
          experienceLevel: nullIfEmpty(d.preferences.experienceLevel),
          remotePreference: nullIfEmpty(d.preferences.remotePreference),
        },
      });
    },
    onSuccess: () => {
      toast.success('Profile saved');
      ['profile', 'me', 'recommendedJobs'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    },
    onError: (e) => toast.error(e.errors?.[0] ? `${e.errors[0].field}: ${e.errors[0].message}` : e.message),
  });

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await axiosClient.post('/profile/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Photo updated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading) return <div className="py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900 mx-auto" /></div>;

  const pct = profile?.profileCompletionPercentage || 0;
  const jobTypes = watch('preferences.jobTypes') || [];

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">My profile</h1>
          <p className="text-slate-500 mt-2">A complete profile gives you better job recommendations.</p>
        </div>
        <div className="w-full sm:w-56">
          <div className="flex justify-between text-xs text-slate-500 mb-1"><span>Profile completion</span><b>{pct}%</b></div>
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-green-600" style={{ width: `${pct}%` }} /></div>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => save.mutate(d))} className="space-y-8">
        <Section title="Basic details" hint="Your name, photo and headline.">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
              {profile?.user?.avatar ? <img src={assetUrl(profile.user.avatar)} alt="Avatar" className="h-full w-full object-cover" /> : <User className="h-8 w-8 text-slate-400" />}
            </div>
            <label className="cursor-pointer inline-flex items-center justify-center font-medium border-2 border-primary-950 text-primary-950 hover:bg-primary-50 h-8 px-3 text-xs rounded-md">
              Upload photo
              <input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp,image/gif" onChange={uploadAvatar} />
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="First name" {...register('firstName', { required: 'Required' })} error={errors.firstName?.message} />
            <Input label="Last name" {...register('lastName', { required: 'Required' })} error={errors.lastName?.message} />
          </div>
          <Input label="Professional headline" placeholder="e.g. MERN Stack Developer" maxLength={100} {...register('headline')} />
          <Textarea label="About you" rows={4} placeholder="Your experience, goals and what you are looking for..." {...register('bio')} />
        </Section>

        <Section title="Contact & links" hint="How employers can reach you.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Phone" placeholder="+919876543210" {...register('phone', { pattern: { value: /^\+?[1-9]\d{1,14}$/, message: 'Digits only, optional + country code' } })} error={errors.phone?.message} />
            <Input label="Current location" placeholder="e.g. Chennai" {...register('location')} />
          </div>
          <Input label="Portfolio / website" type="url" placeholder="https://..." {...register('website')} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="LinkedIn" type="url" placeholder="https://linkedin.com/in/..." {...register('linkedin')} />
            <Input label="GitHub" type="url" placeholder="https://github.com/..." {...register('github')} />
          </div>
        </Section>

        <Section title="Skills" hint="Used to match you with relevant jobs.">
          <Input label="Skills (comma separated)" placeholder="React, Node.js, MongoDB, Tailwind CSS" {...register('skills')} />
        </Section>

        <Section title="Job preferences" hint="We use these to recommend jobs.">
          <Input label="Preferred locations (comma separated)" placeholder="Chennai, Bangalore" {...register('preferences.locations')} />
          <div>
            <p className="block text-sm font-medium text-slate-700 mb-1.5">Preferred job types</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              {EMPLOYMENT_TYPES.map((t) => (
                <label key={t.value} className="flex items-center gap-2 text-sm text-slate-600">
                  <input type="checkbox" value={t.value} className="h-4 w-4 rounded border-slate-300" {...register('preferences.jobTypes')} />
                  {t.label}
                </label>
              ))}
            </div>
            <span className="hidden">{jobTypes.length}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Experience level</label>
              <select className={selectCls} {...register('preferences.experienceLevel')}>
                <option value="">Not set</option>
                {EXPERIENCE_LEVELS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Work mode</label>
              <select className={selectCls} {...register('preferences.remotePreference')}>
                <option value="">Not set</option>
                {WORK_MODES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <Input label="Expected min. salary" type="number" min="0" placeholder="e.g. 600000" {...register('preferences.salaryMin')} />
          </div>
        </Section>

        <Section title="Experience" hint="Your work history.">
          {exp.fields.map((f, i) => (
            <div key={f.id} className="border border-slate-200 rounded-lg p-4 space-y-4 relative">
              <button type="button" onClick={() => exp.remove(i)} className="absolute top-3 right-3 text-slate-400 hover:text-red-600" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6">
                <Input label="Job title" {...register(`experience.${i}.title`, { required: 'Required' })} error={errors.experience?.[i]?.title?.message} />
                <Input label="Company" {...register(`experience.${i}.company`, { required: 'Required' })} error={errors.experience?.[i]?.company?.message} />
                <Input label="From" type="date" {...register(`experience.${i}.from`, { required: 'Required' })} error={errors.experience?.[i]?.from?.message} />
                <Input label="To" type="date" disabled={watch(`experience.${i}.current`)} {...register(`experience.${i}.to`)} />
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="h-4 w-4" {...register(`experience.${i}.current`)} /> I currently work here</label>
              <Textarea label="Description" rows={2} {...register(`experience.${i}.description`)} />
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => exp.append({ title: '', company: '', from: '', to: '', current: false, description: '' })}><Plus className="w-4 h-4 mr-1" />Add experience</Button>
        </Section>

        <Section title="Education" hint="Your qualifications.">
          {edu.fields.map((f, i) => (
            <div key={f.id} className="border border-slate-200 rounded-lg p-4 space-y-4 relative">
              <button type="button" onClick={() => edu.remove(i)} className="absolute top-3 right-3 text-slate-400 hover:text-red-600" aria-label="Remove"><Trash2 className="w-4 h-4" /></button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-6">
                <Input label="School / college" {...register(`education.${i}.school`, { required: 'Required' })} error={errors.education?.[i]?.school?.message} />
                <Input label="Degree" {...register(`education.${i}.degree`, { required: 'Required' })} error={errors.education?.[i]?.degree?.message} />
                <Input label="Field of study" {...register(`education.${i}.fieldOfStudy`, { required: 'Required' })} error={errors.education?.[i]?.fieldOfStudy?.message} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="From" type="date" {...register(`education.${i}.from`, { required: 'Required' })} error={errors.education?.[i]?.from?.message} />
                  <Input label="To" type="date" disabled={watch(`education.${i}.current`)} {...register(`education.${i}.to`)} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="h-4 w-4" {...register(`education.${i}.current`)} /> Currently studying</label>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => edu.append({ school: '', degree: '', fieldOfStudy: '', from: '', to: '', current: false })}><Plus className="w-4 h-4 mr-1" />Add education</Button>
        </Section>

        <div className="flex justify-end">
          <Button type="submit" disabled={save.isPending} className="w-full md:w-auto">{save.isPending ? 'Saving...' : 'Save profile'}</Button>
        </div>
      </form>
    </div>
  );
}
