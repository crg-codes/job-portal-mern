import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Building2, User } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';
import { assetUrl } from '../../utils/assets';

export default function EmployerProfile() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => axiosClient.get('/profile/me'),
  });

  useEffect(() => {
    if (profileData?.data?.profile) {
      reset({
        firstName: profileData.data.profile.user?.firstName,
        lastName: profileData.data.profile.user?.lastName,
        phone: profileData.data.profile.user?.phone || '',
        jobTitle: profileData.data.profile.jobTitle,
        designation: profileData.data.profile.designation,
        contactDetails: profileData.data.profile.contactDetails,
      });
    }
  }, [profileData, reset]);

  const mutation = useMutation({
    mutationFn: (data) => axiosClient.patch('/profile/me/employer', data),
    onSuccess: () => {
      toast.success('Profile updated successfully');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update profile');
    }
  });

  const onSubmit = (data) => {
    mutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      jobTitle: data.jobTitle,
      designation: data.designation,
      contactDetails: { alternativeEmail: data.contactDetails?.alternativeEmail || '' },
    });
  };

  if (isLoading) return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900 mx-auto"></div>
    </div>
  );

  const profile = profileData?.data?.profile;
  const company = profile?.company;

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Employer Settings</h1>
        <p className="text-slate-500 mt-2">Manage your personal details and company association.</p>
      </div>

      {/* Company Status Card */}
      <Card className="border-l-4 border-l-primary-900">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Company Association</h3>
              <p className="text-sm text-slate-500 mt-1">
                {company ? `Linked to ${company.name}` : 'You must create or link a company to post jobs.'}
              </p>
            </div>
          </div>
          <Link to={company ? `/company/edit` : `/company/create`}>
            <Button variant={company ? 'secondary' : 'primary'}>
              {company ? 'Manage Company' : 'Create Company'}
            </Button>
          </Link>
        </div>
      </Card>

      {/* Personal Employer Profile */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <Card className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/3 shrink-0">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Your Identity</h3>
            <p className="text-sm text-slate-500">How candidates will see you.</p>
          </div>
          
          <div className="w-full space-y-5">
            <div className="flex items-center space-x-4 mb-2">
              <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden">
                {profile?.user?.avatar ? (
                  <img src={assetUrl(profile.user.avatar)} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <User className="h-8 w-8 text-slate-400" />
                )}
              </div>
              <div className="relative">
                <input 
                  type="file" 
                  id="avatar-upload" 
                  className="sr-only" 
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      await axiosClient.post('/profile/avatar', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                      });
                      queryClient.invalidateQueries({ queryKey: ['profile'] });
                      toast.success('Avatar updated successfully');
                    } catch (err) {
                      toast.error(err.message || 'Failed to update avatar');
                      console.error(err);
                    }
                  }}
                />
                <label htmlFor="avatar-upload">
                  <span className="inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 border-2 border-primary-950 text-primary-950 hover:bg-primary-50 focus:ring-primary-950 h-8 px-3 text-xs rounded-md cursor-pointer">
                    Update Avatar
                  </span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input label="First name" {...register('firstName', { required: true })} />
              <Input label="Last name" {...register('lastName', { required: true })} />
              <Input label="Phone" placeholder="+919876543210" {...register('phone')} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Job Title / Role"
                placeholder="e.g. HR Manager, Recruiter"
                {...register('jobTitle')}
              />
              <Input
                label="Designation"
                placeholder="e.g. Talent Acquisition"
                {...register('designation')}
              />
            </div>
            
            <Input
              label="Alternative Contact Email"
              type="email"
              placeholder="team@company.com"
              {...register('contactDetails.alternativeEmail')}
            />
          </div>
        </Card>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving Settings...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
