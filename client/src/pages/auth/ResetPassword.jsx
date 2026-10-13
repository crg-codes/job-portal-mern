import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const password = watch('newPassword');
  const mutation = useMutation({
    mutationFn: data => axiosClient.post('/auth/reset-password', { token, newPassword: data.newPassword }),
    onSuccess: () => { toast.success('Password reset successfully'); navigate('/login'); },
    onError: error => toast.error(error.response?.data?.message || error.message || 'Reset failed'),
  });

  return <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow border border-slate-100">
      <h1 className="text-2xl font-bold text-slate-900">Reset Password</h1>
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="mt-6 space-y-4">
        <div><label className="text-sm font-medium">New Password</label><input {...register('newPassword', { required: 'Password is required', minLength: { value: 8, message: 'Minimum 8 characters' } })} type="password" className="mt-1 w-full border rounded-lg p-2.5" />{errors.newPassword && <p className="text-sm text-red-600 mt-1">{errors.newPassword.message}</p>}</div>
        <div><label className="text-sm font-medium">Confirm Password</label><input {...register('confirmPassword', { required: 'Please confirm password', validate: v => v === password || 'Passwords do not match' })} type="password" className="mt-1 w-full border rounded-lg p-2.5" />{errors.confirmPassword && <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>}</div>
        <button disabled={!token || mutation.isPending} className="w-full rounded-lg bg-slate-900 text-white py-2.5">{mutation.isPending ? 'Resetting...' : 'Reset Password'}</button>
      </form>
      <Link to="/login" className="block text-center text-sm text-slate-600 mt-5">Back to login</Link>
    </div>
  </div>;
}
