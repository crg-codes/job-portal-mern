import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const mutation = useMutation({
    mutationFn: data => axiosClient.post('/auth/change-password', data),
    onSuccess: () => { toast.success('Password changed successfully'); navigate('/dashboard'); },
    onError: error => toast.error(error.response?.data?.message || error.message || 'Could not change password'),
  });
  const newPassword = watch('newPassword');
  return <div className="max-w-lg mx-auto"><Card><h1 className="text-2xl font-bold text-slate-900">Change Password</h1><form onSubmit={handleSubmit(d => mutation.mutate(d))} className="mt-6 space-y-4">
    <div><label className="text-sm font-medium">Current Password</label><input {...register('currentPassword', { required: 'Current password is required' })} type="password" className="mt-1 w-full border rounded-lg p-2.5" />{errors.currentPassword && <p className="text-sm text-red-600">{errors.currentPassword.message}</p>}</div>
    <div><label className="text-sm font-medium">New Password</label><input {...register('newPassword', { required: 'New password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })} type="password" className="mt-1 w-full border rounded-lg p-2.5" />{errors.newPassword && <p className="text-sm text-red-600">{errors.newPassword.message}</p>}</div>
    <div><label className="text-sm font-medium">Confirm New Password</label><input {...register('confirmPassword', { required: 'Confirm your password', validate: v => v === newPassword || 'Passwords do not match' })} type="password" className="mt-1 w-full border rounded-lg p-2.5" />{errors.confirmPassword && <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>}</div>
    <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? 'Updating...' : 'Change Password'}</Button>
  </form></Card></div>;
}
