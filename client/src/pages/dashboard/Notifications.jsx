import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { timeAgo } from '../../utils/format';

const PAGE_SIZE = 15;

export default function Notifications() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications', 'list', page],
    queryFn: () => axiosClient.get('/notifications', { params: { page, limit: PAGE_SIZE } }),
    placeholderData: keepPreviousData,
    refetchInterval: 15000, // check for new notifications every 15 seconds
    refetchOnWindowFocus: true,
  });

  // refreshes the list AND the red badge in the navbar
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['notifications'] });

  const markRead = useMutation({ mutationFn: (id) => axiosClient.patch(`/notifications/${id}/read`), onSuccess: refresh });
  const markAllRead = useMutation({ mutationFn: () => axiosClient.patch('/notifications/mark-all-read'), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (id) => axiosClient.delete(`/notifications/${id}`), onSuccess: refresh });

  const open = (n) => {
    if (!n.read) markRead.mutate(n._id);
    if (n.actionUrl) navigate(n.actionUrl);
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto space-y-4 py-10">{[1, 2, 3].map((i) => <Card key={i} className="animate-pulse h-24" />)}</div>
  );

  if (isError) return (
    <div className="max-w-3xl mx-auto py-16 text-center border border-red-200 bg-red-50 rounded-lg">
      <h3 className="text-lg font-semibold text-red-800 mb-1">Could not load notifications</h3>
      <p className="text-red-700 text-sm">{error?.message}</p>
      <Button variant="secondary" className="mt-4" onClick={() => refetch()}>Try again</Button>
    </div>
  );

  const notifications = data?.data?.notifications || [];
  const unreadCount = data?.data?.unreadCount || 0;
  const pagination = data?.data?.pagination;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Notifications</h1>
            {unreadCount > 0 && <Badge variant="primary">{unreadCount} new</Badge>}
          </div>
          <p className="text-slate-500 mt-2">Updates on your applications and account activity.</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
            <CheckCircle2 className="w-4 h-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-20 text-center border border-slate-200 rounded-xl border-dashed bg-white">
          <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <Bell className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">You're all caught up!</h3>
          <p className="text-slate-500">You'll see updates here when someone applies to your job or your application status changes.</p>
        </div>
      ) : (
        <Card noPadding className="divide-y divide-slate-100 bg-white">
          {notifications.map((n) => (
            <div key={n._id} className={`p-5 flex gap-4 ${n.read ? 'bg-white' : 'bg-primary-50/50'}`}>
              <div className="pt-1.5 shrink-0">
                <Circle className={`w-2.5 h-2.5 ${n.read ? 'text-slate-300 fill-slate-300' : 'text-primary-600 fill-primary-600'}`} />
              </div>

              <button type="button" onClick={() => open(n)} className="flex-1 min-w-0 text-left">
                <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-1 gap-1">
                  <h4 className={`font-semibold text-base ${n.read ? 'text-slate-700' : 'text-slate-900'}`}>{n.title}</h4>
                  <span className="text-xs font-medium text-slate-400 shrink-0">{timeAgo(n.createdAt)}</span>
                </div>
                <p className={`text-sm ${n.read ? 'text-slate-500' : 'text-slate-700'}`}>{n.message}</p>
                {n.actionUrl && <span className="inline-block mt-2 text-sm font-medium text-primary-700">View details</span>}
              </button>

              {/* always visible (works on mobile too) */}
              <div className="shrink-0 flex items-start gap-1">
                {!n.read && (
                  <button onClick={() => markRead.mutate(n._id)} title="Mark as read" className="p-2 text-slate-400 hover:text-primary-700 hover:bg-slate-100 rounded-full">
                    <Check className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => remove.mutate(n._id)} title="Delete" className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 pt-6">
          <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</Button>
          <span className="text-sm text-slate-600">Page {pagination.page} of {pagination.totalPages}</span>
          <Button variant="ghost" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}
