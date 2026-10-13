import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { Briefcase, Building2, MapPin, Globe } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

import { assetUrl } from '../../utils/assets';
import { formatSalary } from '../../utils/format';

export default function CompanyProfile() {
  const { slug } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['company', slug],
    queryFn: () => axiosClient.get(`/companies/slug/${slug}`),
  });

  if (isLoading) return <div className="py-20 text-center">Loading company...</div>;
  if (error || !data?.data?.company) return <div className="py-20 text-center">Company not found.</div>;

  const company = data.data.company;
  const jobs = data.data.jobs || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card>
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
            {company.logo ? <img src={assetUrl(company.logo)} alt={company.name} className="h-full w-full object-cover" /> : <Building2 className="h-9 w-9 text-slate-400" />}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{company.name}</h1>
            <p className="text-slate-500 mt-2">{[company.industry, company.companySize && `${company.companySize} employees`].filter(Boolean).join(' · ') || 'Company'}</p>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500 mt-4">
              {company.location && <span className="flex items-center"><MapPin className="w-4 h-4 mr-1" />{company.location}</span>}
              {company.website && <a className="flex items-center hover:text-slate-900" href={company.website} target="_blank" rel="noreferrer"><Globe className="w-4 h-4 mr-1" />Website</a>}
            </div>
          </div>
        </div>
        {company.description && <p className="mt-6 text-slate-600 whitespace-pre-wrap leading-relaxed">{company.description}</p>}
      </Card>

      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Open Positions ({jobs.length})</h2>
        <div className="space-y-3">
          {jobs.length === 0 ? <Card>No published jobs currently available.</Card> : jobs.map(job => (
            <Card key={job._id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-slate-900">{job.title}</h3>
                <p className="text-sm text-slate-500 mt-1 flex items-center gap-3"><span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1" />{job.location || 'Not specified'}</span><span className="flex items-center"><Briefcase className="w-3.5 h-3.5 mr-1" />{job.employmentType?.replace('_', ' ')}</span>{formatSalary(job) && <span>{formatSalary(job)}</span>}</p>
              </div>
              <Link to={`/jobs/${job.slug || job._id}`}><Button size="sm">View Job</Button></Link>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
