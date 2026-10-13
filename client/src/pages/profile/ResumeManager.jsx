import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FileText, Trash2, Upload, Star, ExternalLink } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';

import { assetUrl } from '../../utils/assets';

export default function ResumeManager() {
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [replaceId, setReplaceId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: () => axiosClient.get('/applications/resumes'),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('file', file);
      if (replaceId) {
        return axiosClient.put(`/applications/resumes/${replaceId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      return axiosClient.post('/applications/resumes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success(replaceId ? 'Resume updated successfully' : 'Resume uploaded successfully');
      setFile(null);
      setReplaceId(null);
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
    onError: (error) => toast.error(error.message || 'Resume upload failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axiosClient.delete(`/applications/resumes/${id}`),
    onSuccess: () => {
      toast.success('Resume deleted');
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
    onError: (error) => toast.error(error.message || 'Could not delete resume'),
  });

  const defaultMutation = useMutation({
    mutationFn: (id) => axiosClient.patch(`/applications/resumes/${id}/default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      toast.success('Default resume updated');
    },
  });

  const resumes = data?.data?.resumes || [];

  const submit = (e) => {
    e.preventDefault();
    if (!file) return toast.error('Choose a PDF, DOC or DOCX file');
    if (file.size > 5 * 1024 * 1024) return toast.error('Maximum file size is 5MB');
    uploadMutation.mutate();
  };

  if (isLoading) return <div className="py-20 text-center">Loading resumes...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">My Resumes</h1>
        <p className="text-slate-500 mt-2">Manage the resumes you use when applying for jobs.</p>
      </div>

      <Card>
        <form onSubmit={submit} className="flex flex-col md:flex-row gap-4 md:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {replaceId ? 'Choose replacement resume' : 'Upload a resume'}
            </label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm border border-slate-300 rounded-lg p-2 bg-white"
            />
            <p className="text-xs text-slate-500 mt-2">PDF, DOC or DOCX · maximum 5MB</p>
          </div>
          <div className="flex gap-2">
            {replaceId && (
              <Button type="button" variant="secondary" onClick={() => { setReplaceId(null); setFile(null); }}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={uploadMutation.isPending}>
              <Upload className="w-4 h-4 mr-2" />
              {uploadMutation.isPending ? 'Saving...' : replaceId ? 'Replace Resume' : 'Upload Resume'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-3">
        {resumes.length === 0 ? (
          <Card className="text-center py-12">
            <FileText className="mx-auto h-10 w-10 text-slate-400" />
            <p className="mt-3 font-medium text-slate-900">No resumes uploaded</p>
            <p className="text-sm text-slate-500 mt-1">Upload one above before applying for jobs.</p>
          </Card>
        ) : resumes.map((resume) => (
          <Card key={resume._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-11 w-11 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{resume.fileName}</p>
                <p className="text-xs text-slate-500">{Math.round(resume.fileSize / 1024)} KB · {new Date(resume.createdAt).toLocaleDateString()}</p>
              </div>
              {resume.isDefault && <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700">Default</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={assetUrl(resume.fileUrl)} target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary" size="sm"><ExternalLink className="w-4 h-4 mr-1" />View</Button>
              </a>
              <Button type="button" variant="secondary" size="sm" onClick={() => { setReplaceId(resume._id); setFile(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Replace
              </Button>
              {!resume.isDefault && (
                <Button type="button" variant="secondary" size="sm" onClick={() => defaultMutation.mutate(resume._id)}>
                  <Star className="w-4 h-4 mr-1" />Default
                </Button>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => window.confirm(`Delete ${resume.fileName}?`) && deleteMutation.mutate(resume._id)} disabled={deleteMutation.isPending}>
                <Trash2 className="w-4 h-4 text-red-600" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
