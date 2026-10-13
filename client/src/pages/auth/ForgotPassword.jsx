import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const mutation = useMutation({
    mutationFn: data => axiosClient.post('/auth/forgot-password', data),
    onSuccess: data => toast.success(data.message || 'If the account exists, a reset link has been sent.'),
    onError: error => toast.error(error.response?.data?.message || error.message || 'Request failed'),
  });

  return <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
    <div className="w-full max-w-md bg-white p-8 rounded-xl shadow border border-slate-100">
      <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
      <p className="text-sm text-slate-500 mt-2">Enter your email to request a password reset link.</p>
      <form onSubmit={handleSubmit(d => mutation.mutate(d))} className="mt-6 space-y-4">
        <div><label className="text-sm font-medium">Email</label><input {...register('email', { required: 'Email is required' })} type="email" className="mt-1 w-full border rounded-lg p-2.5" />{errors.email && <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>}</div>
        <button disabled={mutation.isPending} className="w-full rounded-lg bg-slate-900 text-white py-2.5">{mutation.isPending ? 'Sending...' : 'Send Reset Link'}</button>
      </form>
      <Link to="/login" className="block text-center text-sm text-slate-600 mt-5">Back to login</Link>
    </div>
  </div>;
}
