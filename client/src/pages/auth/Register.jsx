import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import axiosClient from '../../api/axiosClient';
import toast from 'react-hot-toast';

export default function Register() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const navigate = useNavigate();

  const password = watch('password');

  const registerMutation = useMutation({
    mutationFn: (data) => axiosClient.post('/auth/register', data),
    onSuccess: (data) => {
      if (data.success) {
        localStorage.setItem('accessToken', data.data.accessToken);
        toast.success('Registration successful!');
        navigate('/dashboard');
      }
    },
    onError: (error) => {
      toast.error(error.errors?.[0]?.message || error.message || 'Registration failed. Please try again.');
    },
  });

  const onSubmit = (data) => {
    registerMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      role: data.role,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-slate-100">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500 transition-colors">
              Sign in instead
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reg-firstName" className="block text-sm font-medium text-slate-700 mb-1">First Name</label>
              <input
                id="reg-firstName"
                {...register('firstName', { required: 'First name is required' })}
                type="text"
                aria-invalid={!!errors.firstName}
                aria-describedby={errors.firstName ? "reg-firstName-error" : undefined}
                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {errors.firstName && <p id="reg-firstName-error" className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
            </div>
            <div>
              <label htmlFor="reg-lastName" className="block text-sm font-medium text-slate-700 mb-1">Last Name</label>
              <input
                id="reg-lastName"
                {...register('lastName', { required: 'Last name is required' })}
                type="text"
                aria-invalid={!!errors.lastName}
                aria-describedby={errors.lastName ? "reg-lastName-error" : undefined}
                className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              {errors.lastName && <p id="reg-lastName-error" className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
            <input
              id="reg-email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              })}
              type="email"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "reg-email-error" : undefined}
              className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {errors.email && <p id="reg-email-error" className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          
          <div>
            <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              id="reg-password"
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' }
              })}
              type="password"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "reg-password-error" : undefined}
              className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {errors.password && <p id="reg-password-error" className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="reg-confirm" className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
            <input
              id="reg-confirm"
              {...register('confirmPassword', { 
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              type="password"
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "reg-confirm-error" : undefined}
              className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm placeholder-slate-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
            {errors.confirmPassword && <p id="reg-confirm-error" className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">I am a...</label>
            <select
              {...register('role')}
              className="appearance-none block w-full px-3 py-2.5 border border-slate-300 rounded-lg shadow-sm bg-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="JOB_SEEKER">Job Seeker</option>
              <option value="EMPLOYER">Employer</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
            >
              {registerMutation.isPending ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
