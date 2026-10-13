import { Link } from 'react-router-dom';
import { MapPin, Clock, Building, Banknote, CheckCircle2, Briefcase } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { assetUrl } from '../../utils/assets';
import { formatSalary, timeAgo } from '../../utils/format';
import { EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, labelOf, STATUS_VARIANT, statusLabel } from '../../utils/jobOptions';

export default function JobCard({ job, showMatch = false }) {
  const salary = formatSalary(job);
  const applied = job.myApplication;

  return (
    <Link to={`/jobs/${job.slug || job._id}`} className="block group">
      <Card className="hover:border-slate-300 hover:shadow-md transition-all duration-200 p-5 relative">
        {showMatch && job.matchScore > 0 && !job.isFallback && (
          <div className="absolute top-0 right-0 bg-green-50 text-green-700 text-[11px] font-bold px-3 py-1 rounded-bl-lg border-b border-l border-green-100">
            {job.matchScore}% match
          </div>
        )}

        <div className="flex gap-4">
          <div className="h-14 w-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
            {job.company?.logo ? (
              <img src={assetUrl(job.company.logo)} alt={job.company.name} className="h-full w-full object-cover" />
            ) : (
              <Building className="h-6 w-6 text-slate-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-700 transition-colors truncate">{job.title}</h3>
              {applied && (
                <Badge variant={STATUS_VARIANT[applied.status] || 'success'} className="shrink-0">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> {applied.status === 'APPLIED' ? 'Applied' : statusLabel(applied.status)}
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium text-slate-700 mt-0.5">{job.company?.name}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-sm text-slate-500">
              <span className="flex items-center"><MapPin className="h-4 w-4 mr-1 opacity-70" />{job.location || 'Location not specified'}</span>
              <span className="flex items-center"><Briefcase className="h-4 w-4 mr-1 opacity-70" />{labelOf(EMPLOYMENT_TYPES, job.employmentType)}</span>
              {salary && <span className="flex items-center"><Banknote className="h-4 w-4 mr-1 opacity-70" />{salary}</span>}
              <span className="flex items-center"><Clock className="h-4 w-4 mr-1 opacity-70" />{timeAgo(job.publishedAt || job.createdAt)}</span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              <Badge variant="primary">{labelOf(EXPERIENCE_LEVELS, job.experienceLevel).split(' (')[0]}</Badge>
              {job.remoteType && job.remoteType !== 'ONSITE' && <Badge variant="success">{statusLabel(job.remoteType)}</Badge>}
              {job.skills?.slice(0, 4).map((s) => <Badge key={s}>{s}</Badge>)}
              {job.skills?.length > 4 && <span className="text-xs text-slate-400 self-center">+{job.skills.length - 4}</span>}
            </div>

            {showMatch && job.matchReasons?.length > 0 && !job.isFallback && (
              <p className="mt-3 text-xs text-green-700 bg-green-50 rounded-md px-2.5 py-1.5">
                Why: {job.matchReasons.slice(0, 3).join(' · ')}
              </p>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
