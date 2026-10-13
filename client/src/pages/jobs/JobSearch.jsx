import { useEffect, useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, ChevronLeft, ChevronRight, SlidersHorizontal, X } from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import JobCard from '../../components/jobs/JobCard';
import {
  EMPLOYMENT_TYPES, EXPERIENCE_LEVELS, WORK_MODES, POSTED_WITHIN, SORT_OPTIONS, CURRENCIES, labelOf,
} from '../../utils/jobOptions';

const PAGE_SIZE = 10;
const FILTER_KEYS = ['keyword', 'location', 'employmentType', 'experienceLevel', 'remoteType', 'salaryMin', 'salaryMax', 'currency', 'postedWithin'];

const csv = (v) => (v ? v.split(',').filter(Boolean) : []);

function CheckGroup({ title, options, selected, onChange }) {
  const toggle = (value) =>
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  return (
    <div>
      <h4 className="text-sm font-semibold text-slate-900 mb-2">{title}</h4>
      <div className="space-y-1.5">
        {options.map((o) => (
          <label key={o.value} className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer hover:text-slate-900">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300"
              checked={selected.includes(o.value)}
              onChange={() => toggle(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  );
}

export default function JobSearch() {
  const [params, setParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // ---- read everything from the URL (so Back button / shared links work) ----
  const f = {
    keyword: params.get('keyword') || '',
    location: params.get('location') || '',
    employmentType: csv(params.get('employmentType')),
    experienceLevel: csv(params.get('experienceLevel')),
    remoteType: csv(params.get('remoteType')),
    salaryMin: params.get('salaryMin') || '',
    salaryMax: params.get('salaryMax') || '',
    currency: params.get('currency') || '',
    postedWithin: params.get('postedWithin') || '',
    sortBy: params.get('sortBy') || 'latest',
    page: Math.max(parseInt(params.get('page'), 10) || 1, 1),
  };

  // one place that changes the URL; any filter change goes back to page 1
  const update = (changes, keepPage = false) => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([k, v]) => {
          const val = Array.isArray(v) ? v.join(',') : v;
          if (val === '' || val === null || val === undefined || (k === 'sortBy' && val === 'latest')) next.delete(k);
          else next.set(k, val);
        });
        if (!keepPage) next.delete('page');
        return next;
      },
      { replace: true }
    );
  };

  // ---- text boxes are debounced so we do not call the API on every key press ----
  const [keywordInput, setKeywordInput] = useState(f.keyword);
  const [salaryInput, setSalaryInput] = useState({ min: f.salaryMin, max: f.salaryMax });

  useEffect(() => setKeywordInput(f.keyword), [f.keyword]);
  useEffect(() => setSalaryInput({ min: f.salaryMin, max: f.salaryMax }), [f.salaryMin, f.salaryMax]);

  useEffect(() => {
    if (keywordInput.trim() === f.keyword) return undefined;
    const t = setTimeout(() => update({ keyword: keywordInput.trim() }), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordInput]);

  useEffect(() => {
    if (salaryInput.min === f.salaryMin && salaryInput.max === f.salaryMax) return undefined;
    const t = setTimeout(() => update({ salaryMin: salaryInput.min, salaryMax: salaryInput.max }), 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salaryInput]);

  // ---- data ----
  const apiParams = useMemo(() => {
    const p = { limit: PAGE_SIZE, page: f.page, sortBy: f.sortBy };
    FILTER_KEYS.forEach((k) => {
      const v = Array.isArray(f[k]) ? f[k].join(',') : f[k];
      if (v) p[k] = v;
    });
    return p;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['jobs', apiParams],
    queryFn: () => axiosClient.get('/jobs/search', { params: apiParams }),
    placeholderData: keepPreviousData,
  });

  const { data: filterData } = useQuery({
    queryKey: ['jobFilterOptions'],
    queryFn: () => axiosClient.get('/jobs/meta/filters'),
    staleTime: 5 * 60 * 1000,
  });
  const locations = filterData?.data?.locations || [];

  const jobs = data?.data?.jobs || [];
  const pagination = data?.data?.pagination;

  // ---- active filter chips ----
  const chips = [];
  if (f.keyword) chips.push({ label: `"${f.keyword}"`, clear: () => update({ keyword: '' }) });
  if (f.location) chips.push({ label: f.location, clear: () => update({ location: '' }) });
  f.employmentType.forEach((v) => chips.push({ label: labelOf(EMPLOYMENT_TYPES, v), clear: () => update({ employmentType: f.employmentType.filter((x) => x !== v) }) }));
  f.experienceLevel.forEach((v) => chips.push({ label: labelOf(EXPERIENCE_LEVELS, v).split(' (')[0], clear: () => update({ experienceLevel: f.experienceLevel.filter((x) => x !== v) }) }));
  f.remoteType.forEach((v) => chips.push({ label: labelOf(WORK_MODES, v), clear: () => update({ remoteType: f.remoteType.filter((x) => x !== v) }) }));
  if (f.salaryMin || f.salaryMax) chips.push({ label: `Salary ${f.salaryMin || 0} - ${f.salaryMax || 'any'}`, clear: () => update({ salaryMin: '', salaryMax: '' }) });
  if (f.postedWithin) chips.push({ label: labelOf(POSTED_WITHIN, f.postedWithin), clear: () => update({ postedWithin: '' }) });

  const clearAll = () => {
    setKeywordInput('');
    setParams({}, { replace: true });
  };

  const goPage = (p) => {
    update({ page: p }, true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filters = (
    <div className="space-y-6">
      <CheckGroup title="Job type" options={EMPLOYMENT_TYPES} selected={f.employmentType} onChange={(v) => update({ employmentType: v })} />
      <CheckGroup title="Experience" options={EXPERIENCE_LEVELS} selected={f.experienceLevel} onChange={(v) => update({ experienceLevel: v })} />
      <CheckGroup title="Work mode" options={WORK_MODES} selected={f.remoteType} onChange={(v) => update({ remoteType: v })} />

      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Salary</h4>
        <select
          value={f.currency}
          onChange={(e) => update({ currency: e.target.value })}
          className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm mb-2"
        >
          <option value="">Any currency</option>
          {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <div className="flex gap-2">
          <input
            type="number" min="0" placeholder="Min"
            value={salaryInput.min}
            onChange={(e) => setSalaryInput((s) => ({ ...s, min: e.target.value }))}
            className="w-1/2 h-9 rounded-md border border-slate-200 px-2 text-sm"
          />
          <input
            type="number" min="0" placeholder="Max"
            value={salaryInput.max}
            onChange={(e) => setSalaryInput((s) => ({ ...s, max: e.target.value }))}
            className="w-1/2 h-9 rounded-md border border-slate-200 px-2 text-sm"
          />
        </div>
        <p className="text-xs text-slate-400 mt-1.5">e.g. 600000 for ₹6 LPA</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-slate-900 mb-2">Date posted</h4>
        <select
          value={f.postedWithin}
          onChange={(e) => update({ postedWithin: e.target.value })}
          className="w-full h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
        >
          {POSTED_WITHIN.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      {chips.length > 0 && (
        <Button variant="secondary" size="sm" fullWidth onClick={clearAll}>Clear all filters</Button>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search header */}
      <div className="text-center pt-4">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">Find your next role</h1>
        <p className="text-slate-500 mt-2">Search by skill, title or company, then narrow down by location and more.</p>
      </div>

      <Card className="p-2" noPadding>
        <form
          onSubmit={(e) => { e.preventDefault(); update({ keyword: keywordInput.trim() }); }}
          className="flex flex-col md:flex-row gap-2"
        >
          <div className="flex-1 flex items-center px-4 py-1 border-b md:border-b-0 md:border-r border-slate-100">
            <Search className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
            <input
              type="search"
              placeholder="Job title, skill (e.g. React) or company"
              className="w-full h-10 focus:outline-none text-slate-900 placeholder:text-slate-400"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
            />
          </div>
          <div className="md:w-72 flex items-center px-4 py-1">
            <MapPin className="h-5 w-5 text-slate-400 mr-3 shrink-0" />
            <select
              className="w-full h-10 bg-transparent focus:outline-none text-slate-900"
              value={f.location}
              onChange={(e) => update({ location: e.target.value })}
              aria-label="Location"
            >
              <option value="">All locations</option>
              {/* keep a typed/shared location visible even if no job has it right now */}
              {f.location && !locations.includes(f.location) && <option value={f.location}>{f.location}</option>}
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <Button type="submit" size="lg" className="md:px-8">Search</Button>
        </form>
      </Card>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Filters (desktop sidebar) */}
        <aside className="hidden lg:block w-64 shrink-0">
          <Card className="sticky top-20">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filters</h3>
            {filters}
          </Card>
        </aside>

        <div className="flex-1 min-w-0 space-y-4">
          {/* mobile filter toggle */}
          <div className="lg:hidden">
            <Button variant="secondary" fullWidth onClick={() => setShowFilters((s) => !s)}>
              <SlidersHorizontal className="w-4 h-4 mr-2" /> {showFilters ? 'Hide filters' : `Filters${chips.length ? ` (${chips.length})` : ''}`}
            </Button>
            {showFilters && <Card className="mt-3">{filters}</Card>}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              {isLoading ? 'Loading jobs...' : `${pagination?.total ?? 0} job${pagination?.total === 1 ? '' : 's'} found`}
              {isFetching && !isLoading && <span className="ml-2 text-xs font-normal text-slate-400">updating...</span>}
            </h2>
            <select
              value={f.sortBy}
              onChange={(e) => update({ sortBy: e.target.value })}
              className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm"
              aria-label="Sort by"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {chips.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {chips.map((c, i) => (
                <button
                  key={i}
                  onClick={c.clear}
                  className="inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-full bg-slate-900 text-white text-xs font-medium hover:bg-slate-700"
                >
                  {c.label} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse h-32 flex items-center">
                  <div className="h-14 w-14 bg-slate-200 rounded-lg mr-4 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-slate-200 rounded w-1/3" />
                    <div className="h-4 bg-slate-200 rounded w-1/4" />
                  </div>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <div className="py-16 text-center border border-red-200 bg-red-50 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-1">Could not load jobs</h3>
              <p className="text-red-700 text-sm">{error?.message}</p>
              <Button variant="secondary" className="mt-4" onClick={() => refetch()}>Try again</Button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="py-16 text-center border border-slate-200 rounded-lg border-dashed bg-white">
              <h3 className="text-lg font-semibold text-slate-900 mb-1">No jobs found</h3>
              <p className="text-slate-500">Try a different keyword or remove some filters.</p>
              {chips.length > 0 && <Button variant="outline" className="mt-5" onClick={clearAll}>Clear all filters</Button>}
            </div>
          ) : (
            <div className="space-y-3">{jobs.map((job) => <JobCard key={job._id} job={job} />)}</div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-6 pb-10">
              <Button variant="ghost" disabled={f.page <= 1} onClick={() => goPage(f.page - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" /> Prev
              </Button>
              <span className="px-4 py-2 text-sm font-medium text-slate-600">Page {pagination.page} of {pagination.totalPages}</span>
              <Button variant="ghost" disabled={f.page >= pagination.totalPages} onClick={() => goPage(f.page + 1)}>
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
