import { useQuery } from '@tanstack/react-query';
import axiosClient from '../api/axiosClient';

// `required: false` -> for public pages: guests simply get user = null (no redirect, no error)
export default function useCurrentUser({ required = true } = {}) {
  const hasToken = !!localStorage.getItem('accessToken');
  const query = useQuery({
    queryKey: ['me'],
    queryFn: () => axiosClient.get('/auth/me'),
    enabled: required || hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  return {
    user: query.data?.data?.user || null,
    isLoading: (required || hasToken) && query.isLoading,
    isError: query.isError,
  };
}
