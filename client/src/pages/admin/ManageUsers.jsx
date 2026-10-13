import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Ban, CheckCircle, Shield } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';

export default function ManageUsers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminUsers', page, search],
    queryFn: () => axiosClient.get(`/admin/users?page=${page}&limit=10&search=${search}`),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => axiosClient.patch(`/admin/users/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
  });

  const handleStatusToggle = (user) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (window.confirm(`Are you sure you want to change this user's status to ${newStatus}?`)) {
      statusMutation.mutate({ id: user._id, status: newStatus });
    }
  };

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Manage Users</h1>
          <p className="text-slate-500 mt-1">View and manage all registered accounts on the platform.</p>
        </div>
        <div className="w-full sm:w-72 relative">
          <Input 
            placeholder="Search by name or email..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
        </div>
      </div>

      <Card noPadding className="overflow-hidden">
        {isLoading ? (
          <div className="p-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-900"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Joined</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-16 px-6 text-center text-slate-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold shrink-0">
                            {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-1.5">
                          {user.role === 'ADMIN' && <Shield className="w-4 h-4 text-purple-600" />}
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {user.role.replace('_', ' ').toLowerCase()}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={user.status === 'ACTIVE' ? 'success' : 'error'}>
                          {user.status}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {user.role !== 'ADMIN' && (
                          <Button 
                            variant={user.status === 'ACTIVE' ? 'outline' : 'secondary'}
                            size="sm"
                            onClick={() => handleStatusToggle(user)}
                            disabled={statusMutation.isPending}
                          >
                            {user.status === 'ACTIVE' ? (
                              <><Ban className="w-4 h-4 mr-1.5 text-red-500" /> Suspend</>
                            ) : (
                              <><CheckCircle className="w-4 h-4 mr-1.5 text-green-500" /> Activate</>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-slate-100 bg-slate-50/50 py-3 px-6 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing page <span className="font-medium text-slate-900">{page}</span> of <span className="font-medium text-slate-900">{pagination.totalPages}</span>
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Prev
              </Button>
              <Button variant="outline" size="sm" disabled={page === pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
