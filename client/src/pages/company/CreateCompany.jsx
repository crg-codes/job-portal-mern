import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

import { assetUrl } from '../../utils/assets';

export default function CreateCompany() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [logo, setLogo] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['myCompany'],
    queryFn: () => axiosClient.get('/companies/me'),
  });

  const company = companyData?.data?.company;
  const isEditing = !!company;

  useEffect(() => {
    if (company) {
      const keys = ['name', 'description', 'website', 'industry', 'companySize', 'foundedYear', 'location', 'headquarters', 'contactEmail', 'contactPhone'];
      reset(Object.fromEntries(keys.map((k) => [k, company[k] ?? ''])));
    }
  }, [company, reset]);

  const mutation = useMutation({
    mutationFn: async (form) => {
      // only send what the API accepts; empty fields become null/removed
      const data = { name: form.name.trim() };
      ['description', 'website', 'industry', 'companySize', 'location', 'headquarters', 'contactEmail', 'contactPhone'].forEach((k) => {
        data[k] = form[k] ?? '';
      });
      data.foundedYear = form.foundedYear === '' || form.foundedYear == null ? null : Number(form.foundedYear);
      const response = isEditing
        ? await axiosClient.patch(`/companies/${company._id}`, data)
        : await axiosClient.post('/companies', data);
      const savedCompany = response.data.company;
      if (logo) {
        const formData = new FormData();
        formData.append('file', logo);
        await axiosClient.post(`/companies/${savedCompany._id}/logo`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return response;
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Company updated successfully!' : 'Company created successfully!');
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['myCompany'] });
      setLogo(null);
      navigate('/profile/employer');
    },
    onError: (error) => toast.error(error.errors?.[0]?.message || error.message || 'Failed to save company information.'),
  });

  if (isLoading) return <div className="py-20 text-center">Loading company...</div>;

  return (
    <div className="bg-white shadow rounded-lg p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-900 mb-6">{isEditing ? 'Edit Company Profile' : 'Create Company Profile'}</h2>
      <form onSubmit={handleSubmit(data => mutation.mutate(data))} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
          <input {...register('name', { required: 'Company name is required' })} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Company Logo</label>
          {company?.logo && <img src={assetUrl(company.logo)} alt="Company logo" className="h-16 w-16 rounded-lg object-cover mb-2" />}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => setLogo(e.target.files?.[0] || null)} className="w-full border border-slate-300 rounded-md p-2" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea {...register('description')} rows={5} className="w-full px-3 py-2 border border-slate-300 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Website</label><input {...register('website')} type="url" className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Industry</label><input {...register('industry')} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Company Size</label><select {...register('companySize')} className="w-full px-3 py-2 border rounded-md"><option value="">Select size...</option><option value="1-10">1-10 employees</option><option value="11-50">11-50 employees</option><option value="51-200">51-200 employees</option><option value="201-500">201-500 employees</option><option value="501-1000">501-1000 employees</option><option value="1000+">1000+ employees</option></select></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Founded Year</label><input {...register('foundedYear')} type="number" className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Location</label><input {...register('location')} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Headquarters</label><input {...register('headquarters')} className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label><input {...register('contactEmail')} type="email" className="w-full px-3 py-2 border rounded-md" /></div>
          <div><label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone</label><input {...register('contactPhone')} className="w-full px-3 py-2 border rounded-md" /></div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/profile/employer')} className="px-5 py-2 border rounded-lg">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="px-5 py-2 bg-slate-900 text-white rounded-lg disabled:opacity-50">{mutation.isPending ? 'Saving...' : isEditing ? 'Update Company' : 'Create Company'}</button>
        </div>
      </form>
    </div>
  );
}
